from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.usuario import Usuario, UsuarioCreate, UsuarioUpdate
from app.services.usuario_service import UsuarioService

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"]
)


@router.post("/", response_model=Usuario)
def criar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
    return UsuarioService.criar_usuario(db, dados)


@router.get("/", response_model=list[Usuario])
def listar_usuarios(db: Session = Depends(get_db)):
    return UsuarioService.listar_usuarios(db)


@router.get("/{usuario_id}", response_model=Usuario)
def obter_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = UsuarioService.obter_usuario(db, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario


@router.put("/{usuario_id}", response_model=Usuario)
def atualizar_usuario(usuario_id: int, dados: UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = UsuarioService.atualizar_usuario(db, usuario_id, dados)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario


@router.delete("/{usuario_id}")
def deletar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    sucesso = UsuarioService.deletar_usuario(db, usuario_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"mensagem": "Usuário removido com sucesso"}