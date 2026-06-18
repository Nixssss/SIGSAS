import re
from app.utils.texto import normalizar
from app.services.datetime_parser import interpretar_data_hora

from app.models.campus import Campus
from app.models.tipo_sala import TipoSala
from app.models.recurso import Recurso


def extrair_filtros(frase, db):

    filtros = {
        "tipo_sala_id": None,
        "tipo_sala": None,

        "capacidade": None,
        "campus_id": None,
        "todos_campi": False,
        "recursos": [],
        "opcoes_tipo": [],

        "data_inicio": None,
        "data_fim": None,
        "horario_inicio": None,
        "horario_fim": None
    }

    frase_original = frase
    frase_norm = normalizar(frase.strip())
    frase_lower = frase.lower()

    # =====================================================
    # CAMPUS
    # =====================================================
    campi = db.query(Campus).all()

    for c in campi:
        if normalizar(c.nome) in frase_norm:
            filtros["campus_id"] = c.id
            break

    if "todos" in frase_norm and "campus" in frase_norm:
        filtros["todos_campi"] = True

   # =====================================================
# DATA
# =====================================================
    data_hora = interpretar_data_hora(frase_original)

    print("[EXTRATOR] data_hora =", data_hora)
    print("[EXTRATOR] tipo =", type(data_hora))

    if data_hora is not None:

        # datetime
        if hasattr(data_hora, "date"):
            filtros["data_inicio"] = data_hora.date()
            filtros["data_fim"] = data_hora.date()

        # date
        else:
            filtros["data_inicio"] = data_hora
            filtros["data_fim"] = data_hora

        print(
            "[EXTRATOR] data_inicio atribuída =",
            filtros["data_inicio"]
        )

        print(
            "[EXTRATOR] data_fim atribuída =",
            filtros["data_fim"]
        )

    else:
        print("[EXTRATOR] data_hora veio None")

    # =====================================================
    # HORÁRIO
    # =====================================================
    match_range = re.search(
        r"(\d{1,2}:\d{2})\s*(?:às|a|ate|até|-|–|~)\s*(\d{1,2}:\d{2})",
        frase_lower
    )

    if match_range:
        filtros["horario_inicio"] = match_range.group(1)
        filtros["horario_fim"] = match_range.group(2)

    else:
        matches = re.findall(r"\d{1,2}:\d{2}", frase_lower)

        if len(matches) == 1:
            filtros["horario_inicio"] = matches[0]

        elif len(matches) >= 2:
            filtros["horario_inicio"] = matches[0]
            filtros["horario_fim"] = matches[1]

    # =====================================================
    # CAPACIDADE
    # =====================================================
    match_capacidade = re.search(
        r"\b(\d+)\s*(pessoas?|alunos?|lugares?)\b",
        frase_lower
    )

    if match_capacidade:
        filtros["capacidade"] = int(match_capacidade.group(1))
    else:
        match_para = re.search(r"\bpara\s+(\d+)\b", frase_lower)

        if match_para:
            filtros["capacidade"] = int(match_para.group(1))

    # =====================================================
    # TIPO SALA
    # =====================================================
    tipos = db.query(TipoSala).all()

    for t in tipos:
        if normalizar(t.nome) in frase_norm:
            filtros["tipo_sala_id"] = t.id
            filtros["tipo_sala"] = t.nome
            break

    if not filtros["tipo_sala_id"]:

        mapa = {
            "auditorio": "auditório",
            "laboratorio": "laboratório",
            "lab": "laboratório",
            "sala": "sala",
            "quadra": "quadra"
        }

        termo = next((t for t in mapa if t in frase_norm), None)

        if termo:
            filtros["tipo_sala"] = mapa[termo]

    # =====================================================
    # RECURSOS
    # =====================================================
    # =====================================================
# RECURSOS
# =====================================================
    recursos = db.query(Recurso).all()

    for r in recursos:

        nome_recurso = normalizar(r.nome)

        if nome_recurso in frase_norm:
            filtros["recursos"].append({
                "id": r.id,
                "nome": r.nome
            })

    print("[EXTRATOR] FILTROS FINAIS =", filtros)

    return filtros