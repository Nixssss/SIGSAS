from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.edificio import Edificio
from app.models.campus import Campus
from app.schemas.edificio import EdificioCreate, EdificioUpdate, EdificioRead

router = APIRouter(prefix="/edificios", tags=["Edifícios"])


@router.get("", response_model=list[EdificioRead])
def listar_edificios(db: Session = Depends(get_db)):
    return db.query(Edificio).all()


@router.post("", response_model=EdificioRead)
def criar_edificio(
    dados: EdificioCreate,
    db: Session = Depends(get_db),
):
    campus = db.query(Campus).filter(Campus.id == dados.idCampus).first()

    if not campus:
        raise HTTPException(status_code=404, detail="Campus não encontrado")

    novo = Edificio(
        nome=dados.nome.strip(),
        idCampus=dados.idCampus,
    )

    db.add(novo)
    db.commit()
    db.refresh(novo)

    return novo


@router.put("/{edificio_id}", response_model=EdificioRead)
def atualizar_edificio(
    edificio_id: int,
    dados: EdificioUpdate,
    db: Session = Depends(get_db),
):
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()

    if not edificio:
        raise HTTPException(status_code=404, detail="Edifício não encontrado")

    if dados.idCampus is not None:
        campus = db.query(Campus).filter(Campus.id == dados.idCampus).first()

        if not campus:
            raise HTTPException(status_code=404, detail="Campus não encontrado")

        edificio.idCampus = dados.idCampus

    if dados.nome is not None:
        edificio.nome = dados.nome.strip()

    db.commit()
    db.refresh(edificio)

    return edificio


@router.delete("/{edificio_id}")
def excluir_edificio(
    edificio_id: int,
    db: Session = Depends(get_db),
):
    edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()

    if not edificio:
        raise HTTPException(status_code=404, detail="Edifício não encontrado")

    db.delete(edificio)
    db.commit()

    return {"message": "Edifício excluído com sucesso"}