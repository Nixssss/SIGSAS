from app.services.classificador import classificar
from app.utils.texto import normalizar

from app.models.tipo_sala import TipoSala
from app.models.recurso import Recurso

import re


def nlu(frase, db):

    intent = classificar(frase)
    frase_norm = normalizar(frase)

    # =========================
    # TIPO DE SALA
    # =========================
    tipos = db.query(TipoSala).all()

    tipo_sala = None

    for t in tipos:
        nome_norm = normalizar(t.nome)

        if nome_norm in frase_norm:
            tipo_sala = {
                "id": t.id,
                "nome": t.nome
            }
            break

    # =========================
    # RECURSOS
    # =========================
    recursos_db = db.query(Recurso).all()

    recursos = []

    for r in recursos_db:
        nome_norm = normalizar(r.nome)

        if nome_norm in frase_norm:
            recursos.append({
                "id": r.id,
                "nome": r.nome
            })

    # =========================
    # CAPACIDADE (SÓ FILTRO)
    # =========================
    capacidade = None

    numeros = re.findall(r"\d+", frase)

    if numeros:
        capacidade = int(numeros[0])

    # =========================
    # OUTPUT
    # =========================
    return {
        "intent": intent,
        "confidence": 1.0,
        "entities": {
            "tipo_sala": tipo_sala,
            "recursos": recursos,
            "capacidade": capacidade
        }
    }