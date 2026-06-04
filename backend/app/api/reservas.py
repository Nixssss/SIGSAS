from fastapi import APIRouter, Depends, HTTPException, Request
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
from app.services.auditoria_service import registrar_log


router = APIRouter(prefix="/reservas", tags=["Reservas"])


@router.get("", response_model=list[ReservaRead])
def listar_reservas(db: Session = Depends(get_db)):
    try:
        return db.query(Reserva).order_by(Reserva.idReserva.desc()).all()

    except Exception as error:
        registrar_log(
            db=db,
            acao="LISTAR_RESERVAS_ERRO",
            modulo="Reservas",
            etapa="listar",
            descricao="Erro ao listar reservas",
            status="erro",
            erro=str(error),
        )

        raise HTTPException(status_code=500, detail="Erro ao listar reservas")


@router.get("/{idReserva}", response_model=ReservaRead)
def buscar_reserva(idReserva: int, db: Session = Depends(get_db)):
    try:
        reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        return reserva

    except HTTPException:
        raise

    except Exception as error:
        registrar_log(
            db=db,
            acao="BUSCAR_RESERVA_ERRO",
            modulo="Reservas",
            etapa="buscar",
            descricao=f"Erro ao buscar reserva #{idReserva}",
            status="erro",
            erro=str(error),
        )

        raise HTTPException(status_code=500, detail="Erro ao buscar reserva")


@router.post("", response_model=ReservaRead)
def criar_reserva(
    reserva: ReservaCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        registrar_log(
            db=db,
            acao="RESERVA_MANUAL_INICIADA",
            modulo="Reservas",
            etapa="criar",
            descricao=(
                f"Usuário iniciou criação manual de reserva para sala #{reserva.idSala}, "
                f"período {reserva.dataInicio} {reserva.horaInicio} até "
                f"{reserva.dataFim} {reserva.horaFim}"
            ),
            status="iniciado",
            id_usuario=reserva.idUsuarioReserva,
            request=request,
        )

        sala = db.query(Sala).filter(Sala.idSala == reserva.idSala).first()

        if not sala:
            registrar_log(
                db=db,
                acao="RESERVA_MANUAL_ERRO",
                modulo="Reservas",
                etapa="validar_sala",
                descricao=f"Tentativa de criar reserva para sala inexistente #{reserva.idSala}",
                status="erro",
                erro="Sala não encontrada",
                id_usuario=reserva.idUsuarioReserva,
                request=request,
            )

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
            registrar_log(
                db=db,
                acao="RESERVA_MANUAL_CONFLITO",
                modulo="Reservas",
                etapa="validar_conflito",
                descricao=(
                    f"Tentativa de criar reserva em conflito para sala #{reserva.idSala}. "
                    f"Conflito com reserva #{conflito.idReserva}"
                ),
                status="erro",
                erro="Conflito de reserva",
                id_usuario=reserva.idUsuarioReserva,
                request=request,
            )

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

        registrar_log(
            db=db,
            acao="RESERVA_MANUAL_CONCLUIDA",
            modulo="Reservas",
            etapa="concluido",
            descricao=(
                f"Reserva #{nova_reserva.idReserva} criada manualmente para sala "
                f"#{nova_reserva.idSala} por {nova_reserva.nomeUsuarioReserva}"
            ),
            status="sucesso",
            id_usuario=nova_reserva.idUsuarioReserva,
            request=request,
        )

        return nova_reserva

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="RESERVA_MANUAL_ERRO_INTERNO",
            modulo="Reservas",
            etapa="criar",
            descricao="Erro interno ao criar reserva manual",
            status="erro",
            erro=str(error),
            id_usuario=reserva.idUsuarioReserva,
            request=request,
        )

        raise HTTPException(status_code=500, detail="Erro interno ao criar reserva")


@router.put("/{idReserva}", response_model=ReservaRead)
def atualizar_reserva(
    idReserva: int,
    dados: ReservaUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
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

        registrar_log(
            db=db,
            acao="ATUALIZAR_RESERVA",
            modulo="Reservas",
            etapa="atualizar",
            descricao=f"Reserva #{reserva.idReserva} foi atualizada",
            status="sucesso",
            id_usuario=reserva.idUsuarioReserva,
            request=request,
        )

        return reserva

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="ATUALIZAR_RESERVA_ERRO_INTERNO",
            modulo="Reservas",
            etapa="atualizar",
            descricao=f"Erro interno ao atualizar reserva #{idReserva}",
            status="erro",
            erro=str(error),
            request=request,
        )

        raise HTTPException(status_code=500, detail="Erro interno ao atualizar reserva")


@router.patch("/{idReserva}/status", response_model=ReservaRead)
def atualizar_status_reserva(
    idReserva: int,
    dados: ReservaStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        if dados.idStatusReserva not in [1, 2, 3, 4]:
            raise HTTPException(status_code=400, detail="Status inválido")

        status_anterior = reserva.idStatusReserva

        reserva.idStatusReserva = dados.idStatusReserva
        reserva.idUsuarioAprovacao = dados.idUsuarioAprovacao
        reserva.justificativa = dados.justificativa or ""

        db.commit()
        db.refresh(reserva)

        descricao_status = {
            1: "pendente",
            2: "aprovada",
            3: "recusada",
            4: "cancelada",
        }

        registrar_log(
            db=db,
            acao="ALTERAR_STATUS_RESERVA",
            modulo="Reservas",
            etapa="status",
            descricao=(
                f"Reserva #{reserva.idReserva} teve status alterado de "
                f"{descricao_status.get(status_anterior, status_anterior)} para "
                f"{descricao_status.get(reserva.idStatusReserva, reserva.idStatusReserva)}"
            ),
            status="sucesso",
            id_usuario=dados.idUsuarioAprovacao or reserva.idUsuarioReserva,
            request=request,
        )

        return reserva

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="ALTERAR_STATUS_RESERVA_ERRO_INTERNO",
            modulo="Reservas",
            etapa="status",
            descricao=f"Erro interno ao alterar status da reserva #{idReserva}",
            status="erro",
            erro=str(error),
            request=request,
        )

        raise HTTPException(status_code=500, detail="Erro interno ao alterar status da reserva")


@router.delete("/{idReserva}")
def excluir_reserva(
    idReserva: int,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        reserva = db.query(Reserva).filter(Reserva.idReserva == idReserva).first()

        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")

        id_usuario = reserva.idUsuarioReserva
        descricao = f"Reserva #{reserva.idReserva} foi excluída"

        db.delete(reserva)
        db.commit()

        registrar_log(
            db=db,
            acao="EXCLUIR_RESERVA",
            modulo="Reservas",
            etapa="excluir",
            descricao=descricao,
            status="sucesso",
            id_usuario=id_usuario,
            request=request,
        )

        return {"message": "Reserva excluída com sucesso"}

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="EXCLUIR_RESERVA_ERRO_INTERNO",
            modulo="Reservas",
            etapa="excluir",
            descricao=f"Erro interno ao excluir reserva #{idReserva}",
            status="erro",
            erro=str(error),
            request=request,
        )

        raise HTTPException(status_code=500, detail="Erro interno ao excluir reserva")