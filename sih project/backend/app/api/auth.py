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
from app.schemas.domain import LoginRequest, RefreshTokenRequest, Token, UserCreate, UserRead
from app.services.audit import log_activity

router = APIRouter(prefix="/auth", tags=["auth"])


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
            details="Invalid email or password",
            user_email=email,
            ip_address=request.client.host if request.client else None,
        )
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    log_activity(
        db,
        action="LOGIN",
        status="SUCCESS",
        details=f"{user.role.value} logged in",
        user=user,
        ip_address=request.client.host if request.client else None,
    )
    refresh_token_value = create_refresh_token(db, user)
    db.commit()
    return Token(access_token=create_access_token(user.email), refresh_token=refresh_token_value)


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
