from typing import Dict, Any

conversas: Dict[str, Dict[str, Any]] = {}

# =========================
# FLUXO
# =========================
ORDEM_RESERVA = [
    "data_inicio",
    "data_fim",
    "campus_id",
    "horario_inicio",
    "horario_fim",
    "capacidade",
    
]

SYNC_FIELDS = ORDEM_RESERVA



# =========================
# ESTADO INICIAL
# =========================
def estado_inicial():
    return {
        "status": "inicio",
        "intencao": None,

        "filtros": {
            "tipo_sala_id": None,
            "tipo_sala": None,
            "capacidade": None,
            "campus_id": None,
            "todos_campi": False,
            "recursos": [],
            "opcoes_tipo": []
        },

        "slots": {
            "data_inicio": None,
            "data_fim": None,
            "campus_id": None,
            "horario_inicio": None,
            "horario_fim": None,
            "capacidade": None
        },

        "reserva": {},
        "campi": [],
        "salas": [],
        "salas_encontradas": [],
        "sala_selecionada": None,
        "ultima_frase": None,
        "aguardando_confirmacao": False
    }


# =========================
# GET STATE
# =========================
def get_state(user_id: str):
    if user_id not in conversas:
        conversas[user_id] = estado_inicial()
    return conversas[user_id]


# =========================
# NORMALIZAÇÃO
# =========================
def normalize_state(state: Dict[str, Any]):


    slots = state.get("slots", {})
    filtros = state.get("filtros", {})

    # limpa lixo
    for k in list(slots.keys()):
        if slots[k] in ("", [], {}):
            slots[k] = None

    # =========================
    # SYNC CONTROLADO 
    # =========================
    for k in SYNC_FIELDS:

        slot_val = slots.get(k)
        filtro_val = filtros.get(k)

        if slot_val is not None:
            filtros[k] = slot_val

        elif filtro_val is not None and slot_val is None:
            slots[k] = filtro_val

    state["slots"] = slots
    state["filtros"] = filtros

    state["reserva"] = {
        k: v for k, v in slots.items() if v is not None
    }



    return state


# =========================
# UPDATE STATE
# =========================
def update_state(user_id: str, new_data: Dict[str, Any]):

    state = get_state(user_id)



    if "filtros" in new_data:
        for k, v in new_data["filtros"].items():
            if v is not None:
                state["filtros"][k] = v
        new_data.pop("filtros")

    if "slots" in new_data:
        for k, v in new_data["slots"].items():
            if v is not None:
                state["slots"][k] = v
        new_data.pop("slots")

    state.update(new_data)

    state = normalize_state(state)
    conversas[user_id] = state




# =========================
# CLEAR STATE
# =========================
def clear_state(user_id: str):
    conversas.pop(user_id, None)


# =========================
# SLOT HELPERS
# =========================
def preencher_slots(state: Dict[str, Any], dados: Dict[str, Any]):
    for k, v in dados.items():
        if k in state["slots"] and v is not None:
            state["slots"][k] = v


# =========================
# PRÓXIMO SLOT FALTANDO
# =========================
def proximo_slot_faltando(state: Dict[str, Any]):

    state = normalize_state(state)
    slots = state["slots"]

    for campo in ORDEM_RESERVA:
        val = slots.get(campo)

        if val in (None, "", []):
            return campo

    return None


# =========================
# HELPERS
# =========================
def slots_completos(state: Dict[str, Any]):
    return proximo_slot_faltando(state) is None


def slots_faltando(state: Dict[str, Any]):
    state = normalize_state(state)
    slots = state["slots"]

    return [
        campo
        for campo in ORDEM_RESERVA
        if slots.get(campo) in (None, "", [])
    ]