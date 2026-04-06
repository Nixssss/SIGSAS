from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.sala import Sala
from app.schemas.sala import SalaCreate, SalaRead
from app.core.security import get_current_user

router = APIRouter(prefix="/salas", tags=["Salas"])

@router.post("", response_model=SalaRead)
def criar_sala(
    sala: SalaCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    nova_sala = Sala(**sala.model_dump())
    db.add(nova_sala)
    db.commit()
    db.refresh(nova_sala)
    return nova_sala

@router.get("", response_model=list[SalaRead])
def listar_salas(
    capacidade: int | None = None,
    tipo: str | None = None,
    edificio: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(Sala)

    if capacidade is not None:
        query = query.filter(Sala.capacidade >= capacidade)
    if tipo is not None:
        query = query.filter(Sala.tipo == tipo)
    if edificio is not None:
        query = query.filter(Sala.edificio == edificio)

    return query.all()