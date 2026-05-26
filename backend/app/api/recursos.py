from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.recurso import Recurso
from app.schemas.recurso import RecursoCreate, RecursoUpdate, RecursoRead

router = APIRouter(prefix="/recursos", tags=["Recursos"])


@router.get("", response_model=list[RecursoRead])
def listar_recursos(db: Session = Depends(get_db)):
    return db.query(Recurso).all()


@router.post("", response_model=RecursoRead)
def criar_recurso(dados: RecursoCreate, db: Session = Depends(get_db)):
    novo = Recurso(nome=dados.nome.strip())

    db.add(novo)
    db.commit()
    db.refresh(novo)

    return novo


@router.put("/{recurso_id}", response_model=RecursoRead)
def atualizar_recurso(
    recurso_id: int,
    dados: RecursoUpdate,
    db: Session = Depends(get_db),
):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()

    if not recurso:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")

    if dados.nome is not None:
        recurso.nome = dados.nome.strip()

    db.commit()
    db.refresh(recurso)

    return recurso


@router.delete("/{recurso_id}")
def excluir_recurso(recurso_id: int, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).filter(Recurso.id == recurso_id).first()

    if not recurso:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")

    db.delete(recurso)
    db.commit()

    return {"message": "Recurso excluído com sucesso"}