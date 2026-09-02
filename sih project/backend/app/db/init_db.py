from sqlalchemy import inspect, text

from app.db.session import Base, engine
from app.models import domain  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

    # Lightweight migration for the demo SQLite/Postgres deployment.
    # create_all() does not add columns to an already-created table.
    inspector = inspect(engine)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "provider_type" not in user_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN provider_type VARCHAR(60) DEFAULT 'PUBLIC_CITIZEN'"))
