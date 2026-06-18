from app.services.datetime_parser import interpretar_data_hora


def verificar_conflito(
    db,
    sala_id,
    data_inicio,
    data_fim,
    horario_inicio,
    horario_fim
):

    from app.models.reserva import Reserva

    reservas = (
        db.query(Reserva)
        .filter(Reserva.idSala == sala_id)
        .all()
    )

    nova_inicio = interpretar_data_hora(
        f"{data_inicio} {horario_inicio}"
    )

    nova_fim = interpretar_data_hora(
        f"{data_fim} {horario_fim}"
    )

    if not nova_inicio or not nova_fim:
        return {"conflito": False}

    for r in reservas:

        existente_inicio = interpretar_data_hora(
            f"{r.dataInicio} {r.horaInicio}"
        )

        existente_fim = interpretar_data_hora(
            f"{r.dataFim} {r.horaFim}"
        )

        if not existente_inicio or not existente_fim:
            continue

        if nova_inicio < existente_fim and nova_fim > existente_inicio:

            return {
                "conflito": True,
                "reserva_conflitante": r
            }

    return {
        "conflito": False
    }