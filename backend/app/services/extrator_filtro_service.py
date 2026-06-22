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

    if "todos" in frase_norm:
        filtros["todos_campi"] = True
        filtros["campus_id"] = "todos"

    # =====================================================
    # DATA
    # =====================================================
    match_datas = re.search(
        r"(\d{1,2}/\d{1,2})\s*(?:até|a|ate|-)\s*(\d{1,2}/\d{1,2})",
        frase_lower
    )

    if match_datas:
        filtros["data_inicio"] = match_datas.group(1)
        filtros["data_fim"] = match_datas.group(2)

    # parser semântico (mais confiável)
    data_hora = interpretar_data_hora(frase_original)

    if data_hora:
        if isinstance(data_hora, dict):
            filtros["data_inicio"] = data_hora.get("inicio")
            filtros["data_fim"] = data_hora.get("fim")
        else:
            filtros["data_inicio"] = getattr(data_hora, "date", lambda: data_hora)()

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

        if len(matches) >= 1:
            filtros["horario_inicio"] = matches[0]
        if len(matches) >= 2:
            filtros["horario_fim"] = matches[1]

    # =====================================================
    # CAPACIDADE
    # =====================================================
    match_capacidade = re.search(
        r"\b(\d+)\s*(pessoas?|alunos?|lugares?)\b",
        frase_lower
    )

    match_para = re.search(r"\bpara\s+(\d+)\b", frase_lower)

    if match_capacidade:
        filtros["capacidade"] = int(match_capacidade.group(1))
    elif match_para:
        filtros["capacidade"] = int(match_para.group(1))
    elif re.fullmatch(r"\d+", frase_lower.strip()):
        filtros["capacidade"] = int(frase_lower.strip())

    # =====================================================
    # TIPO DE SALA (SEM HARD CODE FIXO)
    # =====================================================
    tipos = db.query(TipoSala).all()

    melhor_match = None
    melhor_id = None
    print("\n===== DEBUG TIPOS =====")
    print("FRASE:", frase_norm)
    for t in tipos:
        nome_norm = normalizar(t.nome)

        if nome_norm in frase_norm:
            melhor_match = t.nome
            melhor_id = t.id
            break

    if melhor_id:
        filtros["tipo_sala_id"] = melhor_id
        filtros["tipo_sala"] = melhor_match

    # fallback semântico (NÃO fixa string tipo "laboratório")
    if not filtros["tipo_sala_id"]:
        termos = frase_norm.split()

        for t in tipos:
            nome_norm = normalizar(t.nome)

            if any(palavra in nome_norm for palavra in termos):
                filtros["tipo_sala_id"] = t.id
                filtros["tipo_sala"] = t.nome
                break

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