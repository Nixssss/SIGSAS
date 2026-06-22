from datetime import datetime

def montar_datetime(data, hora):
    if isinstance(data, datetime):
        data = data.date()

    return datetime.strptime(
        f"{data} {hora}",
        "%Y-%m-%d %H:%M"
    )


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

    nova_inicio = montar_datetime(data_inicio, horario_inicio)
    nova_fim = montar_datetime(data_fim, horario_fim)

    print("\n\n========== VERIFICAÇÃO DE CONFLITO ==========")
    print("SALA:", sala_id)
    print("NOVA:", nova_inicio, "->", nova_fim)
    print("TOTAL RESERVAS ENCONTRADAS:", len(reservas))
    print("============================================\n")

    for r in reservas:

        # 🔥 DEBUG MAIS LIMPO E ÚTIL
        print(f"\n[RESERVA {r.idReserva}] STATUS={r.idStatusReserva}")

        # 🔥 IGNORA RESERVAS INVÁLIDAS
        if not r.dataInicio or not r.dataFim:
            print("-> IGNORADA: datas inválidas")
            continue

        try:
            existente_inicio = montar_datetime(r.dataInicio, r.horaInicio)
            existente_fim = montar_datetime(r.dataFim, r.horaFim)

            print("EXISTENTE:", existente_inicio, "->", existente_fim)

            # 🔥 REGRA DE CONFLITO (CORRETA)
            conflito = (
                nova_inicio < existente_fim
                and nova_fim > existente_inicio
            )

            print("CONFLITO?", conflito)

            if conflito:
                print("\n🚨 CONFLITO ENCONTRADO COM RESERVA:", r.idReserva)
                return {
                    "conflito": True,
                    "reserva_conflitante": r.idReserva
                }

        except Exception as e:
            print(f"[ERRO] reserva {r.idReserva}: {e}")
            continue

    print("\n✔️ NENHUM CONFLITO ENCONTRADO\n")
    return {"conflito": False}