from app.models.reserva import Reserva
from app.services.conversation_state import get_state, update_state


def cancelar_reserva_flow(user_id, db, frase=None):

    state = get_state(user_id)

    reservas = (
        db.query(Reserva)
        .filter(Reserva.idUsuarioReserva == int(user_id))
        .all()
    )

    # não tem reservas
    if not reservas:
        return {
            "status": "cancelar",
            "message": "Você não possui reservas para cancelar."
        }

    lista = "\n".join([
        f"{r.idReserva} - {r.sala.nome} ({r.dataInicio})"
        for r in reservas
    ])

    update_state(user_id, {
        "status": "aguardando_cancelamento",
        "reservas_cancelaveis": [r.idReserva for r in reservas]
    })

    return {
        "status": "aguardando_cancelamento",
        "message": f"Escolha as reservas que deseja cancelar:\n\n{lista}\n\nVocê pode digitar um ou mais IDs."
    }