from datetime import date, datetime

from app.models.reserva import Reserva
from app.models.usuario import Usuario


def criar_reserva(
    db,
    sala_id,
    usuario_id,
    data_inicio,
    hora_inicio,
    data_fim,
    hora_fim,
    motivo="Reserva via chatbot",
    qtd_pessoas=1
):

    # =========================
    # BUSCA USUÁRIO
    # =========================
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id)
        .first()
    )

    # =========================
    # NORMALIZA DATAS
    # =========================
    if isinstance(data_inicio, (date, datetime)):
        data_inicio = data_inicio.strftime("%Y-%m-%d")

    if isinstance(data_fim, (date, datetime)):
        data_fim = data_fim.strftime("%Y-%m-%d")

    # =========================
    # RESERVA
    # =========================
    reserva = Reserva(
        idSala=sala_id,
        idUsuarioReserva=usuario_id,

        nomeUsuarioReserva=usuario.nome if usuario else None,
        matriculaUsuarioReserva=usuario.matricula if usuario else None,
        cargoUsuarioReserva=usuario.cargo if usuario else None,
        instituicaoUsuarioReserva=(
            usuario.instituicao.nome if usuario and usuario.instituicao else None
        ),

        dataInicio=data_inicio,
        horaInicio=str(hora_inicio),

        dataFim=data_fim,
        horaFim=str(hora_fim),

        motivo=motivo,
        qtdPessoas=int(qtd_pessoas),

        idStatusReserva=1
    )

    db.add(reserva)
    db.commit()
    db.refresh(reserva)

    return reserva