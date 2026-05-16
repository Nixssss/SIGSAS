from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.instituicao import Instituicao
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserRead,
    RedefinirSenhaRequest,
)
from app.core.security import (
    verify_password,
    create_access_token,
    get_password_hash,
)

router = APIRouter()


def buscar_nome_instituicao(db: Session, id_instituicao: int | None):
    if not id_instituicao:
        return None

    instituicao = (
        db.query(Instituicao)
        .filter(Instituicao.id == id_instituicao)
        .first()
    )

    return instituicao.nome if instituicao else None


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos",
        )

    if not verify_password(data.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos",
        )

    nome_instituicao = buscar_nome_instituicao(db, user.idInstituicao)

    token = create_access_token(
        {
            "sub": str(user.id),
            "id": user.id,
            "idUsuario": user.id,
            "nome": user.nome,
            "email": user.email,
            "perfil": user.perfil,
            "matricula": user.matricula,
            "cargo": user.cargo,
            "idInstituicao": user.idInstituicao,
            "instituicao": nome_instituicao,
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post(
    "/registrar",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def registrar_usuario(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(Usuario).filter(Usuario.email == user_in.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já registrado",
        )

    if user_in.idInstituicao is not None:
        instituicao = (
            db.query(Instituicao)
            .filter(Instituicao.id == user_in.idInstituicao)
            .first()
        )

        if not instituicao:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instituição não encontrada",
            )

    hashed_password = get_password_hash(user_in.senha)

    db_user = Usuario(
        nome=user_in.nome.strip(),
        email=user_in.email.lower().strip(),
        senha_hash=hashed_password,
        perfil=user_in.perfil,
        matricula=user_in.matricula.strip() if user_in.matricula else None,
        cargo=user_in.cargo.strip() if user_in.cargo else None,
        idInstituicao=user_in.idInstituicao,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    nome_instituicao = buscar_nome_instituicao(db, db_user.idInstituicao)

    return {
        "id": db_user.id,
        "nome": db_user.nome,
        "email": db_user.email,
        "perfil": db_user.perfil,
        "matricula": db_user.matricula,
        "cargo": db_user.cargo,
        "idInstituicao": db_user.idInstituicao,
        "instituicao": nome_instituicao,
    }


@router.post("/redefinir-senha")
def redefinir_senha(data: RedefinirSenhaRequest, db: Session = Depends(get_db)):
    if not data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email não informado",
        )

    if not data.nova_senha:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nova senha não informada",
        )

    if len(data.nova_senha) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve ter no mínimo 6 caracteres",
        )

    user = db.query(Usuario).filter(Usuario.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    user.senha_hash = get_password_hash(data.nova_senha)

    db.commit()
    db.refresh(user)

    return {
        "detail": "Senha redefinida com sucesso",
        "email": user.email,
    }