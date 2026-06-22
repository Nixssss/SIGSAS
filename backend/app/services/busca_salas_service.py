from sqlalchemy.orm import Session, joinedload
from app.models.sala import Sala
from app.models.recurso import Recurso
from app.models.edificio import Edificio
from app.models.campus import Campus
from app.services.disponibilidade_service import verificar_conflito


def buscar_salas(filtros, db: Session):

    # =========================
    # NORMALIZA CAMPUS
    # =========================
    campus_id = filtros.get("campus_id")

    if isinstance(campus_id, str):
        campus_id = campus_id.strip().lower()
        if campus_id in ["todos", "tudo", "all"]:
            campus_id = "todos"

    query = (
        db.query(Sala)
        .options(
            joinedload(Sala.edificio).joinedload(Edificio.campus)
        )
    )

    # =========================
    # CAPACIDADE
    # =========================
    capacidade = filtros.get("capacidade")

    if capacidade not in (None, "", 0):
        try:
            capacidade = int(capacidade)
            query = query.filter(Sala.capacidade >= int(capacidade * 0.7))
        except:
            pass

    # =========================
    # TIPO DE SALA
    # =========================
    tipo_sala_id = filtros.get("tipo_sala_id")

    if tipo_sala_id:
        query = query.filter(Sala.idTipoSala == tipo_sala_id)

    # =========================
    # CAMPUS
    # =========================
    if campus_id and campus_id != "todos":
        query = query.join(Sala.edificio).filter(Edificio.idCampus == campus_id)

    # =========================
    # RECURSOS
    # =========================
    recursos = filtros.get("recursos", [])

    if recursos:
        query = query.join(Sala.recursos)

        ids_recursos = [
            r.get("id") for r in recursos
            if isinstance(r, dict) and r.get("id") is not None
        ]

        if ids_recursos:
            query = query.filter(Recurso.id.in_(ids_recursos))

    # =========================
    # RESULTADO BASE
    # =========================
    salas = query.distinct().all()

    # =========================
    # SEM SALAS
    # =========================
    if not salas:
        return []

    # =========================
    # DISPONIBILIDADE
    # =========================
    data_inicio = filtros.get("data_inicio")
    data_fim = filtros.get("data_fim")
    horario_inicio = filtros.get("horario_inicio")
    horario_fim = filtros.get("horario_fim")

    if data_inicio and horario_inicio and horario_fim:

        if not data_fim:
            data_fim = data_inicio

        salas_disponiveis = []

        for sala in salas:
            try:
                conflito = verificar_conflito(
                    db=db,
                    sala_id=sala.id,
                    data_inicio=str(data_inicio),
                    data_fim=str(data_fim),
                    horario_inicio=horario_inicio,
                    horario_fim=horario_fim
                )

                if not conflito.get("conflito"):
                    salas_disponiveis.append(sala)

            except Exception as e:
                print(f"[ERRO DISPONIBILIDADE] sala {sala.id}: {e}")
                continue

        return salas_disponiveis

    return salas