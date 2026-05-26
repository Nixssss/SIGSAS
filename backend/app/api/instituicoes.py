from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.instituicao import Instituicao
from app.schemas.instituicao import (
    InstituicaoCreate,
    InstituicaoUpdate,
    InstituicaoRead,
)

router = APIRouter(prefix="/instituicoes", tags=["Instituições"])


@router.get("", response_model=list[InstituicaoRead])
def listar_instituicoes(db: Session = Depends(get_db)):
    return db.query(Instituicao).all()


@router.post("", response_model=InstituicaoRead)
def criar_instituicao(
    dados: InstituicaoCreate,
    db: Session = Depends(get_db),
):
    nova = Instituicao(nome=dados.nome.strip())

    db.add(nova)
    db.commit()
    db.refresh(nova)

    return nova


@router.put("/{instituicao_id}", response_model=InstituicaoRead)
def atualizar_instituicao(
    instituicao_id: int,
    dados: InstituicaoUpdate,
    db: Session = Depends(get_db),
):
    instituicao = (
        db.query(Instituicao)
        .filter(Instituicao.id == instituicao_id)
        .first()
    )

    if not instituicao:
        raise HTTPException(status_code=404, detail="Instituição não encontrada")

    if dados.nome is not None:
        instituicao.nome = dados.nome.strip()

    db.commit()
    db.refresh(instituicao)

    return instituicao


@router.delete("/{instituicao_id}")
def excluir_instituicao(
    instituicao_id: int,
    db: Session = Depends(get_db),
):
    instituicao = (
        db.query(Instituicao)
        .filter(Instituicao.id == instituicao_id)
        .first()
    )

    if not instituicao:
        raise HTTPException(status_code=404, detail="Instituição não encontrada")

    db.delete(instituicao)
    db.commit()

    return {"message": "Instituição excluída com sucesso"}