from app.db.session import SessionLocal
from app.models.resposta import Resposta

db = SessionLocal()

respostas = [
    ("escolher_sala", "Encontrei essas salas. Qual você deseja reservar?"),
    ("escolher_data_inicio", "Qual a data de início da reserva?"),
    ("escolher_data_fim", "Qual a data de término da reserva?"),
    ("escolher_horario_inicio", "Qual o horário de início da reserva?"),
    ("escolher_horario_fim", "Qual o horário de término da reserva?"),
    ("sala_selecionada", "Sala selecionada com sucesso."),
    ("conflito_reserva", "Essa sala já possui uma reserva nesse período."),
]

for codigo, texto in respostas:

    existe = (
        db.query(Resposta)
        .filter(Resposta.codigo == codigo)
        .first()
    )

    if not existe:

        db.add(
            Resposta(
                codigo=codigo,
                texto=texto
            )
        )

db.commit()

print("Respostas cadastradas com sucesso!")