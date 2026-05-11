from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.core.config as config
from .base import Base

engine = create_engine(
    config.settings.DATABASE_URL, pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()