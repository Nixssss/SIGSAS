import re
from app.services.extrator_filtro_service import extrair_filtros
from app.services.extrair_intencao_service import extrair_intencao
from app.services.resolver_filtros_service import resolver_filtros
from app.services.busca_salas_service import buscar_salas
from app.services.resposta_service import buscar_resposta
from app.services.reserva_service_chat import criar_reserva
from app.services.conversation_state import (
    get_state,
    update_state,
    proximo_slot_faltando,
    normalize_state
)


# =========================
# DEBUG
# =========================
def debug(msg, data=None):
    print(f"\n[CHAT DEBUG] {msg}")
    if data is not None:
        print(data)


# =========================
# HELPERS
# =========================
def sala_to_dict(sala):
    return {
        "id": sala.id,
        "nome": sala.nome,
        "capacidade": sala.capacidade,
        "tipo_sala": sala.tipo_sala.nome if sala.tipo_sala else None,
        "campus": sala.edificio.campus.nome if sala.edificio and sala.edificio.campus else None
    }



def montar_resumo_reserva(state, sala):

    filtros = state.get("filtros", {})

    data_inicio = filtros.get("data_inicio")
    data_fim = filtros.get("data_fim")

    try:
        if data_inicio:
            data_inicio = data_inicio.strftime("%d/%m/%Y")
    except:
        pass

    try:
        if data_fim:
            data_fim = data_fim.strftime("%d/%m/%Y")
    except:
        pass

    return f"""
Confirma a reserva?

Sala: {sala.get('nome')}
Tipo: {sala.get('tipo_sala')}
Campus: {sala.get('campus')}

Data Início: {data_inicio}
Data Fim: {data_fim}
Horário: {filtros.get('horario_inicio')} às {filtros.get('horario_fim')}

Capacidade solicitada: {filtros.get('capacidade')} pessoas

Digite "Sim" para confirmar ou "Não" para cancelar.
""".strip()


# =========================
# NORMALIZAÇÃO DE FILTROS
# =========================
def normalizar_filtros(f):
    if not f:
        return f

    mapping = {
        "hora_inicio": "horario_inicio",
        "hora_fim": "horario_fim",
        "inicio": "horario_inicio",
        "fim": "horario_fim"
    }

    for old, new in mapping.items():
        if old in f:
            f[new] = f.pop(old)

    return f


# =========================
# MERGE LIMPO
# =========================
def merge_dict(base, new):
    if not new:
        return base

    for k, v in new.items():
        if v is not None:
            base[k] = v

    return base


# =========================
# CORE
# =========================
def processar_mensagem(frase, db, user_id="default"):

    if not frase or not frase.strip():
        return {
            "status": "erro",
            "message": buscar_resposta("mensagem_vazia", db),
            "data": {}
        }

    state = get_state(user_id)
    frase_norm = frase.lower().strip()

    intencao = extrair_intencao(frase, db)
    status = state.get("status", "inicio")
    # =========================
    # BLOQUEIO TOTAL DE FLUXO ESCOLHER SALA
    # =========================
    if status == "escolher_sala":
        debug("FLUXO ESCOLHER_SALA ATIVO - ignorando extração")

        salas = state.get("salas_encontradas", [])

        escolhida = next(
            (s for s in salas if s["nome"].lower() == frase_norm),
            None
        )

        if not escolhida:
            lista = "\n".join([f"- {s['nome']} ({s['capacidade']})" for s in salas])
            return {
                "status": "escolher_sala",
                "message": buscar_resposta("listar_salas", db) + "\n\n" + lista
            }

        sala_completa = {
            **escolhida,
            "tipo_sala": state["filtros"].get("tipo_sala"),
            "campus": None
        }

        update_state(user_id, {
            "status": "confirmar_reserva",
            "sala_selecionada": sala_completa
        })

        return {
            "status": "confirmar_reserva",
            "message": montar_resumo_reserva(state, sala_completa),
            "data": sala_completa
        }
    debug("INTENÇÃO", intencao)
    debug("STATUS", status)
     # =========================
    # EXTRAÇÃO
    # =========================
    filtros = state.get("filtros", {})

    debug("FILTROS ANTES", filtros)

    novos = extrair_filtros(frase, db)
    faltando_atual = proximo_slot_faltando(state)

    # usuário respondeu a data final
    if (
        faltando_atual == "data_fim"
        and novos.get("data_inicio")
    ):
        novos["data_fim"] = novos["data_inicio"]
        novos["data_inicio"] = None

    # usuário respondeu o horário final
    if (
        faltando_atual == "horario_fim"
        and novos.get("horario_inicio")
    ):
        novos["horario_fim"] = novos["horario_inicio"]
        novos["horario_inicio"] = None
    debug("EXTRAIDOS", novos)

    novos = resolver_filtros(novos, db)
    debug("RESOLVIDOS", novos)

    novos = normalizar_filtros(novos)
    debug("NORMALIZADOS", novos)

    filtros = merge_dict(filtros, novos)

    debug("MERGE RESULTADO", filtros)

    update_state(user_id, {"filtros": filtros})
    # =========================
    # RESET
    # =========================
    if intencao in ["agendamento", 1]:

        update_state(user_id, {
            "status": "coletando",
            "slots": {},
            "filtros": {},
            "salas_encontradas": [],
            "sala_selecionada": None
        })

        state = get_state(user_id)
        status = state.get("status", "inicio")
    # =========================
    # CONFIRMAÇÃO FINAL
    # =========================
    if status == "confirmar_reserva":

        debug("STATUS ATUAL", status)
        debug("SALA SELECIONADA", state.get("sala_selecionada"))

        if frase_norm in ["sim", "s", "ok", "confirmo"]:

            sala = state.get("sala_selecionada") or {}
            filtros = state.get("filtros", {}) or {}

            if not sala:
                return {
                    "status": "erro",
                    "message": "Nenhuma sala foi selecionada."
                }

            # =========================
            # CRIA RESERVA
            # =========================
            try:

                criar_reserva(
                    db=db,
                    sala_id=sala["id"],
                    usuario_id=user_id,
                    data_inicio=filtros.get("data_inicio"),
                    hora_inicio=filtros.get("horario_inicio"),
                    data_fim=filtros.get("data_fim"),
                    hora_fim=filtros.get("horario_fim"),
                    motivo=filtros.get("tipo_sala", "Reserva via chatbot"),
                    qtd_pessoas=filtros.get("capacidade", 1)
                )

            except Exception as e:

                print("ERRO AO CRIAR RESERVA:", e)

                return {
                    "status": "erro",
                    "message": "Não foi possível criar a reserva."
                }

            data_inicio = filtros.get("data_inicio")
            data_fim = filtros.get("data_fim")

            try:
                if data_inicio:
                    data_inicio = data_inicio.strftime("%d/%m/%Y")
            except Exception:
                pass

            try:
                if data_fim:
                    data_fim = data_fim.strftime("%d/%m/%Y")
            except Exception:
                pass

            update_state(user_id, {
                "status": "finalizado",
                "sala_selecionada": None,
                "salas_encontradas": []
            })

            return {
                "status": "ok",
                "message": f"""
    Reserva realizada com sucesso!

    Sala: {sala.get('nome')}
    Tipo: {sala.get('tipo_sala')}
    Campus: {sala.get('campus')}

    Data Início: {data_inicio}
    Data Fim: {data_fim}
    Horário: {filtros.get('horario_inicio')} às {filtros.get('horario_fim')}

    Capacidade: {filtros.get('capacidade')} pessoas
    """.strip(),
                "data": sala
            }

        if frase_norm in ["nao", "não", "cancelar"]:

            update_state(user_id, {
                "status": "coletando",
                "sala_selecionada": None
            })

            return {
                "status": "cancelado",
                "message": buscar_resposta("cancelamento_confirmado", db)
            }

        sala = state.get("sala_selecionada") or {}

        if not sala:

            update_state(user_id, {"status": "coletando"})

            return {
                "status": "coletando",
                "message": "Vamos iniciar uma nova busca de sala. O que você precisa reservar?"
            }

        return {
            "status": "confirmar_reserva",
            "message": montar_resumo_reserva(state, sala),
            "data": sala
        }

     # =========================
    # EXTRAÇÃO
    # =========================
    filtros = state.get("filtros", {})

    debug("FILTROS ANTES", filtros)

    novos = extrair_filtros(frase, db)
    faltando_atual = proximo_slot_faltando(state)

    # usuário respondeu a data final
    if (
        faltando_atual == "data_fim"
        and novos.get("data_inicio")
    ):
        novos["data_fim"] = novos["data_inicio"]
        novos["data_inicio"] = None

    # usuário respondeu o horário final
    if (
        faltando_atual == "horario_fim"
        and novos.get("horario_inicio")
    ):
        novos["horario_fim"] = novos["horario_inicio"]
        novos["horario_inicio"] = None
    debug("EXTRAIDOS", novos)

    novos = resolver_filtros(novos, db)
    debug("RESOLVIDOS", novos)

    novos = normalizar_filtros(novos)
    debug("NORMALIZADOS", novos)

    filtros = merge_dict(filtros, novos)

    debug("MERGE RESULTADO", filtros)

    update_state(user_id, {"filtros": filtros})

    # =========================
    # DEBUG ESTADO APÓS UPDATE
    # =========================
    state = get_state(user_id)

    debug("STATE FILTROS APOS UPDATE", state["filtros"])
    debug("STATE SLOTS APOS UPDATE", state["slots"])

    for k in [
        "data_inicio",
        "data_fim",
        "campus_id",
        "horario_inicio",
        "horario_fim",
        "capacidade"
    ]:
        if state["filtros"].get(k) and state["slots"].get(k) is None:

            print(
                f"[SYNC CHAT] {k} -> "
                f"{state['filtros'].get(k)}"
            )

            state["slots"][k] = state["filtros"][k]

    debug("STATE SLOTS APOS SYNC", state["slots"])

    state = normalize_state(state)

    debug("FILTROS ATUALIZADOS", state["filtros"])
    debug("SLOTS ATUALIZADOS", state["slots"])
    # =========================
    # REGRA CRÍTICA
    # =========================
    if state["filtros"].get("tipo_sala_id") is None:
        return {
            "status": "coletando_tipo_sala",
            "message": "Qual tipo de sala você precisa? (auditório, laboratório, sala de aula)"
        }

    # =========================
    # SLOT CHECK
    # =========================
    faltando = proximo_slot_faltando(state)

    debug("FALTANDO", faltando)

    perguntas = {
        "data_inicio": "Qual a data da reserva? (ex: 17/07)",
        "data_fim": "Qual a data de término?",
        "horario_inicio": "Qual o horário de início?",
        "horario_fim": "Qual o horário de término?",
        "capacidade": "Para quantas pessoas?",
        "campus_id": "Qual campus você deseja?"
        
    }

    if faltando:
        return {
            "status": "coletando",
            "message": perguntas.get(faltando, "Me confirma essa informação.")
        }

    # =========================
    # BUSCA FINAL
    # =========================
    salas = buscar_salas(state["filtros"], db)

    debug("SALAS ENCONTRADAS", len(salas))

    if not salas:
        return {
            "status": "nenhuma_sala",
            "message": buscar_resposta("nenhuma_sala", db),
            "data": {}
        }

    if len(salas) > 1:
        update_state(user_id, {
            "status": "escolher_sala",
            "salas_encontradas": [
                {"id": s.id, "nome": s.nome, "capacidade": s.capacidade}
                for s in salas
            ]
        })

        return {
            "status": "escolher_sala",
            "message": buscar_resposta("listar_salas", db),
            "data": {"salas": salas}
        }

    sala = sala_to_dict(salas[0])

    update_state(user_id, {
        "status": "confirmar_reserva",
        "sala_selecionada": sala
    })

    return {
        "status": "confirmar_reserva",
        "message": montar_resumo_reserva(state, sala),
        "data": sala
    }