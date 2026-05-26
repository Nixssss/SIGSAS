from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.schemas.usuario import UsuarioCreate, UsuarioResponse
from app.models.usuario import Usuario
from app.db.session import get_db

# Configuração para criptografar a senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()

@router.post("/registrar", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    # 1. Verifica se e-mail já existe
    usuario_existente = db.query(Usuario).filter(Usuario.email == usuario_in.email).first()
    if usuario_existente:
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado.")

    # 2. Criptografa a senha
    senha_hasheada = pwd_context.hash(usuario_in.senha)

    # 3. Salva no banco de dados
    novo_usuario = Usuario(
        nome=usuario_in.nome,
        email=usuario_in.email,
        senha_hash=senha_hasheada
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario
