from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.reserva import Reserva
from app.models.sala import Sala
from app.schemas.reserva import ReservaCreate, ReservaRead
from app.core.security import get_current_user

router = APIRouter(prefix="/reservas", tags=["Reservas"])

@router.post("", response_model=ReservaRead)
def criar_reserva(
    reserva: ReservaCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    sala = db.query(Sala).filter(Sala.id == reserva.sala_id).first()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala não encontrada")

    if reserva.data_inicio >= reserva.data_fim:
        raise HTTPException(status_code=400, detail="data_inicio deve ser menor que data_fim")

    conflito = db.query(Reserva).filter(
        Reserva.sala_id == reserva.sala_id,
        Reserva.status != "cancelada",
        Reserva.data_inicio < reserva.data_fim,
        Reserva.data_fim > reserva.data_inicio
    ).first()

    if conflito:
        raise HTTPException(status_code=409, detail="Já existe uma reserva nesse período")

    nova_reserva = Reserva(
        sala_id=reserva.sala_id,
        usuario_id=reserva.usuario_id,
        data_inicio=reserva.data_inicio,
        data_fim=reserva.data_fim,
        status="pendente",
    )

    db.add(nova_reserva)
    db.commit()
    db.refresh(nova_reserva)
    return nova_reserva

@router.get("", response_model=list[ReservaRead])
def listar_reservas(
    sala_id: int | None = None,
    usuario_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(Reserva)

    if sala_id is not None:
        query = query.filter(Reserva.sala_id == sala_id)
    if usuario_id is not None:
        query = query.filter(Reserva.usuario_id == usuario_id)
    if status is not None:
        query = query.filter(Reserva.status == status)

    return query.all()