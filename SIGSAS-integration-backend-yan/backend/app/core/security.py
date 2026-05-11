from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.core.config as config
from .base import Base

engine = create_engine(
    config.settings.DATABASE_URL, pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


<<<<<<< HEAD
def get_password_hash(password: str) -> str:
    password = password[:72]  # protege contra crash do bcrypt
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
=======
def get_db():
    db = SessionLocal()
>>>>>>> yan/feature/backend-estrutura
    try:
        yield db
    finally:
        db.close()