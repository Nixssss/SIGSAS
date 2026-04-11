from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.usuario import Usuario
from backend.app.schemas.auth import LoginRequest, TokenResponse, UserCreate, UserRead
from backend.app.core.security import verify_password, create_access_token, get_password_hash

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )

    if not verify_password(data.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/registrar", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def registrar_usuario(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(Usuario).filter(Usuario.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já registrado"
        )

    hashed_password = get_password_hash(user_in.senha)

    db_user = Usuario(
        nome=user_in.nome,
        email=user_in.email,
        senha_hash=hashed_password,
        perfil=user_in.perfil
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user