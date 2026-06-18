from app.services.tipo_sala_service import obter_tipo_sala


def resolver_filtros(filtros, db):

    if not filtros:
        return {}

    resolvido = filtros.copy()

    tipo_nome = filtros.get("tipo_sala")

    # =========================
    # NORMALIZAÇÃO SEGURA
    # =========================
    if tipo_nome:
        tipo_nome = str(tipo_nome).strip().lower()
    else:
        tipo_nome = None

    # =========================
    # RESOLVE TIPO_SALA
    # =========================
    tipo = obter_tipo_sala(db, tipo_nome) if tipo_nome else None

    # =========================
    # APLICA RESULTADO
    # =========================
    if tipo:
        resolvido["tipo_sala_id"] = tipo.id
        resolvido["tipo_sala"] = tipo.nome  # mantém nome correto
        resolvido.pop("tipo_sala_raw", None)

    else:
        resolvido["tipo_sala_id"] = None

        if tipo_nome:
            resolvido["tipo_sala_raw"] = tipo_nome

    return resolvido