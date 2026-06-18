from sqlalchemy.orm import Session

from app.models.sala import Sala
from app.models.recurso import Recurso
from app.models.edificio import Edificio
from app.models.campus import Campus
from app.services.disponibilidade_service import (
    verificar_conflito
)


def buscar_salas(filtros, db: Session):

    query = (
        db.query(Sala)
        .join(
            Edificio,
            Sala.idEdificio == Edificio.id
        )
        .join(
            Campus,
            Edificio.idCampus == Campus.id
        )
    )

    # =========================
    # CAPACIDADE
    # =========================
    capacidade = filtros.get("capacidade")

    if capacidade:
        query = query.filter(
            Sala.capacidade >= capacidade
        )

    # =========================
    # TIPO DE SALA
    # =========================
    tipo_sala_id = filtros.get("tipo_sala_id")

    if tipo_sala_id:
        query = query.filter(
            Sala.idTipoSala == tipo_sala_id
        )

    # =========================
    # CAMPUS
    # =========================
    campus_id = filtros.get("campus_id")

    if campus_id and campus_id != "todos":
        query = query.filter(
            Campus.id == campus_id
        )

    # =========================
    # RECURSOS
    # =========================
    recursos = filtros.get("recursos", [])

    if recursos:

        query = query.join(Sala.recursos)

        ids_recursos = []

        for recurso in recursos:

            if isinstance(recurso, dict):
                ids_recursos.append(
                    recurso.get("id")
                )

        ids_recursos = [
            r for r in ids_recursos
            if r is not None
        ]

        if ids_recursos:
            query = query.filter(
                Recurso.id.in_(ids_recursos)
            )

    # =========================
    # RESULTADO BASE
    # =========================
    salas = (
        query
        .distinct()
        .all()
    )

    # =========================
    # DISPONIBILIDADE
    # =========================
    data_inicio = filtros.get("data_inicio")
    data_fim = filtros.get("data_fim")

    horario_inicio = filtros.get(
        "horario_inicio"
    )

    horario_fim = filtros.get(
        "horario_fim"
    )

    if (
        data_inicio
        and horario_inicio
        and horario_fim
    ):

        # se não vier data_fim
        # usa a mesma data da reserva
        if not data_fim:
            data_fim = data_inicio

        salas_disponiveis = []

        for sala in salas:

            conflito = verificar_conflito(
                db=db,
                sala_id=sala.id,
                data_inicio=data_inicio.strftime(
                    "%d/%m/%Y"
                ),
                data_fim=data_fim.strftime(
                    "%d/%m/%Y"
                ),
                horario_inicio=horario_inicio,
                horario_fim=horario_fim
            )

            if not conflito["conflito"]:
                salas_disponiveis.append(
                    sala
                )

        return salas_disponiveis

    return salas