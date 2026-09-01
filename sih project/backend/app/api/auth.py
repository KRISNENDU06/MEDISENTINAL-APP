import secrets
import time
import os
import threading
from typing import Annotated
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.security import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_password_hash,
    get_refresh_token_record,
)
from app.db.session import get_db
from app.models.domain import Role, User
from app.schemas.domain import (
    LoginRequest,
    RefreshTokenRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    RegisterWithOTPRequest,
    ResetPasswordOTPRequest,
    Token,
    UserCreate,
    UserRead,
)
from app.services.audit import log_activity
from app.services.notifier import send_email_otp_async, send_sms_otp_async

router = APIRouter(prefix="/auth", tags=["auth"])

# -------------------------------------------------------------
# In-Memory Cryptographically Secure OTP & Rate Limiter Store
# -------------------------------------------------------------
_OTP_STORE: dict[str, dict] = {}
_RATE_LIMIT_STORE: dict[str, list[float]] = {}


def generate_secure_otp(target: str, purpose: str = "REGISTER") -> str:
    target_clean = target.strip().lower()
    now = time.time()

    # Rate limiting: Maximum 5 OTP requests per 10 minutes per target
    history = _RATE_LIMIT_STORE.get(target_clean, [])
    history = [t for t in history if now - t < 600]
    if len(history) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Security Rate Limit: Too many OTP requests for this contact. Please wait 10 minutes.",
        )
    history.append(now)
    _RATE_LIMIT_STORE[target_clean] = history

    # Cryptographically secure 6-digit numeric token
    otp = f"{secrets.randbelow(900000) + 100000}"
    _OTP_STORE[target_clean] = {
        "otp": otp,
        "expires_at": now + 300,  # 5 minutes validity
        "attempts": 0,
        "purpose": purpose,
        "verified": False,
    }
    return otp


def verify_secure_otp(target: str, otp: str, purpose: str = "REGISTER") -> bool:
    target_clean = target.strip().lower()
    record = _OTP_STORE.get(target_clean)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found for this contact. Please request a new OTP.",
        )

    now = time.time()
    if now > record["expires_at"]:
        _OTP_STORE.pop(target_clean, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification OTP has expired (5-minute limit). Please request a new code.",
        )

    if record["attempts"] >= 5:
        _OTP_STORE.pop(target_clean, None)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many invalid attempts. For security, this OTP has been revoked.",
        )

    record["attempts"] += 1

    if record["otp"] != otp.strip():
        remaining = 5 - record["attempts"]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP code. {remaining} attempt(s) remaining.",
        )

    record["verified"] = True
    return True


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@router.post("/login", response_model=Token)
async def login(request: Request, db: Annotated[Session, Depends(get_db)]) -> Token:
    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        email = str(form.get("username", ""))
        password = str(form.get("password", ""))
    else:
        payload = LoginRequest.model_validate(await request.json())
        email = payload.email
        password = payload.password

    user = authenticate_user(db, email, password)
    if not user:
        log_activity(
            db,
            action="LOGIN",
            status="FAILED",
            details=f"Invalid credentials attempt for {email}",
            user_email=email,
            ip_address=request.client.host if request.client else None,
        )
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/mobile or password")

    log_activity(
        db,
        action="LOGIN",
        status="SUCCESS",
        details=f"{user.role.value} logged in ({user.full_name})",
        user=user,
        ip_address=request.client.host if request.client else None,
    )
    refresh_token_value = create_refresh_token(db, user)
    db.commit()
    return Token(access_token=create_access_token(user.email), refresh_token=refresh_token_value)


@router.post("/send-otp")
def send_otp(
    payload: SendOTPRequest,
    db: Annotated[Session, Depends(get_db)],
    request: Request,
) -> dict:
    target = payload.target.strip()
    if not target or len(target) < 4:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please provide a valid email or mobile number.")

    otp = generate_secure_otp(target, purpose=payload.purpose)

    # Dispatch to real destination (Email or SMS)
    if "@" in target or payload.channel == "EMAIL":
        send_email_otp_async(target, otp, purpose=payload.purpose)
    else:
        send_sms_otp_async(target, otp, purpose=payload.purpose)

    log_activity(
        db,
        action="OTP_GENERATED",
        details=f"Generated {payload.purpose} OTP for {target} via {payload.channel}",
        user_email=target if "@" in target else None,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    return {
        "success": True,
        "message": f"6-digit verification code has been dispatched to {target}. Please check your messages / inbox.",
        "channel": payload.channel,
        "target": target,
        "expires_in": 300,
    }


@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPRequest) -> dict:
    verify_secure_otp(payload.target, payload.otp, purpose=payload.purpose)
    return {
        "success": True,
        "message": "OTP verified successfully. You may now complete account registration.",
        "target": payload.target,
    }


@router.post("/register-with-otp", response_model=Token)
def register_with_otp(
    payload: RegisterWithOTPRequest,
    db: Annotated[Session, Depends(get_db)],
    request: Request,
) -> Token:
    target_clean = payload.target.strip().lower()
    
    # 1. Verify OTP
    verify_secure_otp(payload.target, payload.otp, purpose="REGISTER")

    # 2. Check if user already exists
    existing = db.scalar(select(User).where(User.email.ilike(target_clean)))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email/mobile already exists. Please sign in instead.",
        )

    # 3. Create user
    user = User(
        email=target_clean,
        full_name=payload.full_name.strip(),
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.flush()

    log_activity(
        db,
        action="USER_REGISTERED",
        details=f"User {user.full_name} ({user.email}) registered with role {user.role.value}",
        user=user,
        ip_address=request.client.host if request.client else None,
    )
    refresh_token_value = create_refresh_token(db, user)
    db.commit()

    # Clear OTP record
    _OTP_STORE.pop(target_clean, None)

    return Token(access_token=create_access_token(user.email), refresh_token=refresh_token_value)


@router.post("/reset-password-otp")
def reset_password_with_otp(
    payload: ResetPasswordOTPRequest,
    db: Annotated[Session, Depends(get_db)],
    request: Request,
) -> dict:
    target_clean = payload.target.strip().lower()
    
    # 1. Verify OTP
    verify_secure_otp(payload.target, payload.otp, purpose="RESET_PASSWORD")

    # 2. Lookup user
    user = db.scalar(select(User).where(User.email.ilike(target_clean)))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No registered account found with this email/mobile.")

    # 3. Update password
    user.hashed_password = get_password_hash(payload.new_password)
    
    log_activity(
        db,
        action="PASSWORD_RESET",
        details=f"Password reset successfully for {user.email}",
        user=user,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    # Clear OTP
    _OTP_STORE.pop(target_clean, None)

    return {
        "success": True,
        "message": "Password updated successfully. You can now log in with your new password.",
    }


@router.post("/shutdown")
def shutdown_app(request: Request) -> dict:
    """Safe shutdown endpoint to stop local backend & frontend processes."""
    def terminate():
        time.sleep(0.8)
        try:
            os.system('taskkill /F /IM uvicorn.exe /T >nul 2>&1')
            os.system('taskkill /F /IM node.exe /T >nul 2>&1')
        except Exception:
            pass
        os._exit(0)

    threading.Thread(target=terminate, daemon=True).start()
    return {
        "success": True,
        "message": "MEDISENTINEL processes are terminating safely.",
    }


@router.post("/refresh", response_model=Token)
def refresh_token(payload: RefreshTokenRequest, db: Annotated[Session, Depends(get_db)]) -> Token:
    record = get_refresh_token_record(db, payload.refresh_token)
    if not record:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user = db.get(User, record.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    record.revoked_at = datetime.utcnow()
    new_refresh_token = create_refresh_token(db, user)
    log_activity(db, action="TOKEN_REFRESHED", details="Access token refreshed", user=user)
    db.commit()
    return Token(access_token=create_access_token(user.email), refresh_token=new_refresh_token)


@router.post("/logout")
def logout(
    payload: RefreshTokenRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    record = get_refresh_token_record(db, payload.refresh_token)
    if record and record.user_id == current_user.id:
        record.revoked_at = datetime.utcnow()
    log_activity(db, action="LOGOUT", details="User logged out", user=current_user)
    db.commit()
    return {"message": "Logged out"}


@router.get("/me", response_model=UserRead)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user


@router.post(
    "/users",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(Role.ADMIN))],
) -> User:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.flush()
    log_activity(
        db,
        action="USER_CREATED",
        details=f"Created user {user.email} with role {user.role.value}",
        user=current_user,
    )
    db.commit()
    db.refresh(user)
    return user

