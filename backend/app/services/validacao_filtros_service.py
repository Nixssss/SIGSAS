def validar_filtros_necessarios(state):

    filtros = state.get(
        "filtros",
        {}
    )

    faltando = []

    # =========================
    # CAMPUS
    # =========================
    if not filtros.get(
        "campus_id"
    ):

        faltando.append(
            "campus"
        )

    # =========================
    # CAPACIDADE
    # =========================
    if not filtros.get(
        "capacidade"
    ):

        faltando.append(
            "capacidade"
        )

    return faltando