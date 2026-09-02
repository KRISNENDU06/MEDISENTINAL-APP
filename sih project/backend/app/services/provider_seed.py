from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.domain import Role, User


PROVIDER_ACCOUNTS = [
    ("clinic.private@sih.gov.in", "Private Clinic Data Provider", "Clinic@12345", "PRIVATE_CLINIC", Role.HEALTH_OFFICIAL),
    ("clinic.gov@sih.gov.in", "Government Clinic Data Provider", "GovClinic@12345", "GOVERNMENT_CLINIC", Role.HEALTH_OFFICIAL),
    ("hospital@sih.gov.in", "Hospital Data Provider", "Hospital@12345", "HOSPITAL", Role.HEALTH_OFFICIAL),
    ("doctor@sih.gov.in", "Doctor Data Provider", "Doctor@12345", "DOCTOR", Role.HEALTH_OFFICIAL),
    ("municipal.health@sih.gov.in", "Municipal Health Authority", "Municipal@12345", "MUNICIPAL_HEALTH_AUTHORITY", Role.ADMIN),
    ("idsp.official@sih.gov.in", "Government Health Official", "IDSP@12345", "GOVERNMENT_HEALTH_OFFICIAL", Role.HEALTH_OFFICIAL),
]


def seed_provider_accounts(db: Session) -> None:
    for email, full_name, password, provider_type, role in PROVIDER_ACCOUNTS:
        user = db.scalar(select(User).where(User.email == email))
        if not user:
            db.add(User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                role=role,
                provider_type=provider_type,
                is_active=True,
            ))
        else:
            user.full_name = full_name
            user.role = role
            user.provider_type = provider_type
            user.is_active = True
    db.commit()
