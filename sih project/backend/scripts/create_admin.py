import getpass
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import select  # noqa: E402

from app.core.security import get_password_hash  # noqa: E402
from app.db.init_db import init_db  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.domain import Role, User  # noqa: E402


def main() -> None:
    init_db()
    email = input("Admin email: ").strip()
    full_name = input("Admin full name: ").strip() or "System Administrator"
    password = getpass.getpass("Admin password: ")
    confirm_password = getpass.getpass("Confirm password: ")

    if not email or not password:
        raise SystemExit("Email and password are required.")
    if password != confirm_password:
        raise SystemExit("Passwords do not match.")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")

    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == email))
        if existing:
            existing.full_name = full_name
            existing.hashed_password = get_password_hash(password)
            existing.role = Role.ADMIN
            existing.is_active = True
            print("Existing user updated to ADMIN.")
        else:
            db.add(
                User(
                    email=email,
                    full_name=full_name,
                    hashed_password=get_password_hash(password),
                    role=Role.ADMIN,
                    is_active=True,
                )
            )
            print("Admin user created.")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
