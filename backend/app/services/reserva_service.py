from app.models.reserva import Reserva


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

    reserva = Reserva(
        idSala=sala_id,
        idUsuarioReserva=usuario_id,

        dataInicio=data_inicio,
        horaInicio=hora_inicio,

        dataFim=data_fim,
        horaFim=hora_fim,

        motivo=motivo,
        qtdPessoas=qtd_pessoas,

        idStatusReserva=1
    )

    db.add(reserva)
    db.commit()
    db.refresh(reserva)

    return reserva