from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.reserva import Reserva
from app.models.sala import Sala
from app.schemas.reserva import (
    ReservaCreate,
    ReservaUpdate,
    ReservaStatusUpdate,
    ReservaRead,
)


router = APIRouter(prefix="/reservas", tags=["Reservas"])


@router.get("", response_model=list[ReservaRead])
def listar_reservas(db: Session = Depends(get_db)):
    return db.query(Reserva).order_by(Reserva.idReserva.desc()).all()


@router.get("/{idReserva}", response_model=ReservaRead)
def buscar_reserva(idReserva: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")

    return reserva


@router.post("", response_model=ReservaRead)
def criar_reserva(reserva: ReservaCreate, db: Session = Depends(get_db)):
    sala = db.query(Sala).filter(Sala.idSala == reserva.idSala).first()

    if not sala:
        raise HTTPException(status_code=404, detail="Sala não encontrada")

    conflito = (
        db.query(Reserva)
        .filter(
            Reserva.idSala == reserva.idSala,
            Reserva.idStatusReserva.in_([1, 2]),
            Reserva.dataInicio <= reserva.dataFim,
            Reserva.dataFim >= reserva.dataInicio,
        )
        .first()
    )

    if conflito:
        raise HTTPException(
            status_code=409,
            detail="Já existe uma reserva pendente ou aprovada para essa sala nesse período",
        )

    nova_reserva = Reserva(
        idSala=reserva.idSala,
        idUsuarioReserva=reserva.idUsuarioReserva,
        nomeUsuarioReserva=reserva.nomeUsuarioReserva,
        matriculaUsuarioReserva=reserva.matriculaUsuarioReserva,
        cargoUsuarioReserva=reserva.cargoUsuarioReserva,
        instituicaoUsuarioReserva=reserva.instituicaoUsuarioReserva,
        idStatusReserva=1,
        dataInicio=reserva.dataInicio,
        horaInicio=reserva.horaInicio,
        dataFim=reserva.dataFim,
        horaFim=reserva.horaFim,
        motivo=reserva.motivo,
        qtdPessoas=reserva.qtdPessoas,
    )

    db.add(nova_reserva)
    db.commit()
    db.refresh(nova_reserva)

    return nova_reserva


@router.put("/{idReserva}", response_model=ReservaRead)
def atualizar_reserva(
    idReserva: int,
    dados: ReservaUpdate,
    db: Session = Depends(get_db),
):
    reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")

    if dados.idSala is not None:
        sala = db.query(Sala).filter(Sala.idSala == dados.idSala).first()

        if not sala:
            raise HTTPException(status_code=404, detail="Sala não encontrada")

        reserva.idSala = dados.idSala

    campos = dados.dict(exclude_unset=True)
    campos.pop("idSala", None)

    for campo, valor in campos.items():
        setattr(reserva, campo, valor)

    db.commit()
    db.refresh(reserva)

    return reserva


@router.patch("/{idReserva}/status", response_model=ReservaRead)
def atualizar_status_reserva(
    idReserva: int,
    dados: ReservaStatusUpdate,
    db: Session = Depends(get_db),
):
    reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")

    if dados.idStatusReserva not in [1, 2, 3, 4]:
        raise HTTPException(status_code=400, detail="Status inválido")

    reserva.idStatusReserva = dados.idStatusReserva
    reserva.idUsuarioAprovacao = dados.idUsuarioAprovacao
    reserva.justificativa = dados.justificativa or ""

    db.commit()
    db.refresh(reserva)

    return reserva


@router.delete("/{idReserva}")
def excluir_reserva(idReserva: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")

    db.delete(reserva)
    db.commit()

    return {"message": "Reserva excluída com sucesso"}