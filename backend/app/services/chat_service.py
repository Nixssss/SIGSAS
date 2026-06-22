import re
from app.services.extrator_filtro_service import extrair_filtros
from app.services.extrair_intencao_service import extrair_intencao
from app.services.resolver_filtros_service import resolver_filtros
from app.services.busca_salas_service import buscar_salas
from app.services.resposta_service import buscar_resposta
from app.services.reserva_service_chat import criar_reserva
from app.services.resolver_erro import resolver_erro_palavra
from app.services.reserva_cancelamento_service import cancelar_reserva_flow
from datetime import datetime
from app.models.reserva import Reserva
from app.models.campus import Campus
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
        "id": getattr(sala, "id", None),
        "nome": getattr(sala, "nome", None),
        "capacidade": getattr(sala, "capacidade", None),

        "tipo_sala": (
            sala.tipo_sala.nome
            if getattr(sala, "tipo_sala", None)
            else None
        ),

        "campus": (
            sala.edificio.campus.nome
            if getattr(sala, "edificio", None)
            and getattr(sala.edificio, "campus", None)
            else None
        )
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
    frase_corrigida = resolver_erro_palavra(frase, db)
    frase_norm = frase_corrigida.lower().strip()
    if frase_norm in ["reiniciar", "reset", "novo", "começar", "começar de novo", "reiniciar tudo"]:

        print("\n========== RESET EXECUTADO ==========")
        print("[DEBUG] limpando estado do usuário:", user_id)

        update_state(user_id, {
            "status": "inicio",
            "slots": {},
            "filtros": {
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
            },
            "salas_encontradas": [],
            "sala_selecionada": None
        })

        state = get_state(user_id)

        print("[DEBUG] state após reset:", state)

        return {
            "status": "resetado",
            "message": "Fluxo reiniciado com sucesso. O que você deseja reservar?"
        }

    intencao = extrair_intencao(frase, db)
    status = state.get("status", "inicio")
   # =========================
    # CANCELAMENTO EM ANDAMENTO (PRIORIDADE MÁXIMA)
    # =========================
    if status == "aguardando_cancelamento":

        state = get_state(user_id)

        ids_validos = state.get("reservas_cancelaveis", [])

        ids = [int(x) for x in re.findall(r"\d+", frase)]

        ids_para_cancelar = [i for i in ids if i in ids_validos]

        if not ids_para_cancelar:
            return {
                "status": "aguardando_cancelamento",
                "message": "Nenhuma reserva válida encontrada. Tente novamente."
            }

        reservas = (
            db.query(Reserva)
            .filter(Reserva.idReserva.in_(ids_para_cancelar))
            .all()
        )

        for r in reservas:
            db.delete(r)

        db.commit()

        update_state(user_id, {
            "status": "inicio",
            "reservas_cancelaveis": []
        })

        return {
            "status": "cancelado",
            "message": f"Reservas canceladas com sucesso: {ids_para_cancelar}"
        }


    # =========================
    # INICIAR CANCELAMENTO (SÓ SE NÃO ESTIVER NO FLUXO)
    # =========================
    if intencao == "cancelar":
        return cancelar_reserva_flow(user_id, db, frase)
    # =========================
    # CONFIRMAR RESERVA
    # =========================
    if status == "confirmar_reserva":

        if frase_norm in ["sim", "s", "confirmar"]:

            sala = state.get("sala_selecionada")
            filtros = state.get("filtros", {})

            if not sala:
                 return {
                    "status": "erro",
                    "message": "Sala não encontrada na sessão"
                   }

            reserva = criar_reserva(
                db=db,
                sala_id=sala["id"],
                usuario_id=int(state.get("user_id", user_id)),
                data_inicio=filtros.get("data_inicio"),
                hora_inicio=filtros.get("horario_inicio"),
                data_fim=filtros.get("data_fim"),
                hora_fim=filtros.get("horario_fim"),
                qtd_pessoas=filtros.get("capacidade", 1)
            )
            update_state(user_id, {
                "status": "inicio",
                "slots": {},
                "filtros": {
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
                },
                "salas_encontradas": [],
                "sala_selecionada": None
            })

            return {
                "status": "reserva_criada",
                "message": f"Reserva criada com sucesso! {reserva.idReserva}"
            }

        if frase_norm in ["nao", "não", "n", "cancelar"]:

            update_state(user_id, {
                "status": "inicio",
                "salas_encontradas": [],
                "sala_selecionada": None
            })

            return {
                "status": "cancelado",
                "message": "Reserva cancelada."
            }

        return {
            "status": "confirmar_reserva",
            "message": 'Digite "Sim" para confirmar ou "Não" para cancelar.'
        }
    # =========================
    # BLOQUEIO ESCOLHER SALA
    # =========================
    if status == "escolher_sala":
        debug("FLUXO ESCOLHER_SALA ATIVO - ignorando extração")

        salas = state.get("salas_encontradas", [])

        escolhida = next(
            (s for s in salas if s["nome"].lower() == frase_norm),
            None
        )

        if not escolhida:
            return {
                "status": "escolher_sala",
                "message": buscar_resposta("listar_salas", db)
            }

        sala_completa = {
            **escolhida,
            "tipo_sala": state["filtros"].get("tipo_sala"),
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
    # EXTRAÇÃO (CORRIGIDA)
    # =========================
    filtros = state.get("filtros", {})

    debug("FILTROS ANTES", filtros)

    frase_processada = resolver_erro_palavra(frase, db)
    novos = extrair_filtros(frase_processada, db)
    # =========================
    #  FALLBACK CAPACIDADE
    # =========================

    filtros_atuais = state.get("filtros", {})

    match_num = re.fullmatch(r"\d+", frase.strip())

    if match_num and filtros_atuais.get("capacidade") is None:
        novos["capacidade"] = int(match_num.group())

    horario = novos.get("horario_inicio")
    if (
        horario
        and filtros_atuais.get("horario_inicio")
        and not filtros_atuais.get("horario_fim")
    ):

        novos["horario_fim"] = horario
        novos["horario_inicio"] = None

    filtros_atuais = state.get("filtros", {})

    data = novos.get("data_inicio")


    if isinstance(data, dict):
        novos["data_inicio"] = data.get("inicio")
        novos["data_fim"] = data.get("fim")
        data = novos["data_inicio"]

    if (
        data is not None
        and filtros_atuais.get("data_inicio") is not None
        and filtros_atuais.get("data_fim") is None
    ):
        novos["data_fim"] = data
        novos["data_inicio"] = None

    if isinstance(novos.get("data_inicio"), dict):
        novos["data_fim"] = novos["data_inicio"].get("fim")
        novos["data_inicio"] = novos["data_inicio"].get("inicio")

    debug("EXTRAIDOS", novos)

    novos = resolver_filtros(novos, db)
    debug("RESOLVIDOS", novos)

    novos = normalizar_filtros(novos)
    debug("NORMALIZADOS", novos)

    filtros = merge_dict(filtros, novos)

    debug("MERGE RESULTADO", filtros)

    update_state(user_id, {"filtros": filtros})
    def normalizar_data(d):
        if not d:
            return None

        if isinstance(d, dict):
            d = d.get("inicio")

        if isinstance(d, datetime):
            return d.date()

        if isinstance(d, str):
            try:
                return datetime.strptime(d, "%Y-%m-%d").date()
            except:
                return None

        return d


    def dentro_do_semestre(data):
        if not data:
            return False  

        mes = data.month
        return (2 <= mes <= 6) or (8 <= mes <= 12)


    # =========================
    # NORMALIZAÇÃO
    # =========================
    data_inicio = normalizar_data(filtros.get("data_inicio"))
    data_fim = normalizar_data(filtros.get("data_fim"))

    # se não tiver fim, usa início
    if data_inicio and not data_fim:
        data_fim = data_inicio


    # =========================
    # VALIDAÇÃO SEMESTRE
    # =========================

    # 1. valida início
    if data_inicio and not dentro_do_semestre(data_inicio):
        return {
            "status": "bloqueado_semestre",
            "message": "Reservas só podem ser feitas entre fevereiro-junho ou agosto-dezembro."
        }

    # 2. valida fim
    if data_fim and not dentro_do_semestre(data_fim):
        return {
            "status": "bloqueado_semestre",
            "message": "Reservas só podem ser feitas entre fevereiro-junho ou agosto-dezembro."
        }

    # 3. impede cruzar semestre
    if data_inicio and data_fim:
        inicio_ok = (2 <= data_inicio.month <= 6) or (8 <= data_inicio.month <= 12)
        fim_ok = (2 <= data_fim.month <= 6) or (8 <= data_fim.month <= 12)

        if (data_inicio.month // 7) != (data_fim.month // 7):
            # isso detecta mudança de semestre (Jun -> Ago, etc)
            return {
                "status": "bloqueado_semestre",
                "message": "Não é permitido reservar atravessando semestres diferentes."
            }
    # =========================
    # SYNC CORRIGIDO
    # =========================
    for k in [
        "data_inicio",
        "data_fim",
        "campus_id",
        "horario_inicio",
        "horario_fim",
        "capacidade"
    ]:
        if state["filtros"].get(k) is not None:
            state["slots"][k] = state["filtros"][k]

    state = normalize_state(state)

    debug("FILTROS ATUALIZADOS", state["filtros"])
    debug("SLOTS ATUALIZADOS", state["slots"])

    # =========================
    # TIPO DE SALA OBRIGATÓRIO
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

    perguntas = {
        "data_inicio": "Qual a data da reserva? (ex: 17/07)",
        "data_fim": "Qual a data de término?",
        "horario_inicio": "Qual o horário de início?",
        "horario_fim": "Qual o horário de término?",
        "capacidade": "Para quantas pessoas?",
        "campus_id": "Qual campus você deseja?"
    }

    if faltando == "campus_id":

            campi = db.query(Campus).all()

            lista_campi = "\n".join(
                [f"- {c.nome}" for c in campi]
            )

            return {
                "status": "coletando",
                "message":
                    "Qual campus você deseja?\n\n"
                    f"{lista_campi}\n"
                    "- Todos"
            }

    if faltando:
            return {
                "status": "coletando",
                "message": perguntas.get(
                    faltando,
                    "Me confirma essa informação."
                )
            }

    # =========================
    # BUSCA FINAL
    # =========================
    salas = buscar_salas(state["filtros"], db)

    campus_original = state["filtros"].get("campus_id")

    # =====================================
    # FALLBACK: se escolheu campus específico
    # =====================================
    if not salas and campus_original and campus_original != "todos":

        debug("FALLBACK CAMPUS ATIVADO", campus_original)

        filtros_fallback = dict(state["filtros"])
        filtros_fallback["campus_id"] = "todos"

        salas = buscar_salas(filtros_fallback, db)

        # atualiza estado pra não ficar preso no campus ruim
        state["filtros"]["campus_id"] = "todos"
        update_state(user_id, {"filtros": state["filtros"]})


    # =====================================
    # SEM SALAS EM NENHUM CAMPUS
    # =====================================
    if not salas:
        return {
            "status": "nenhuma_sala",
            "message": (
                "Não encontramos salas disponíveis para essa capacidade e horário em nenhum campus.\n"
                "Deseja tentar outro período ou outra capacidade?"
            ),
            "data": {
                "fallback": True,
                "campus_original": campus_original
            }
        }
    if len(salas) > 1:
        salas_normalizadas = []

        for s in salas:
            if isinstance(s, dict):
                salas_normalizadas.append({
                    "id": s.get("id"),
                    "nome": s.get("nome"),
                    "capacidade": s.get("capacidade"),
                    "campus": s.get("campus")
                })
            else:
                salas_normalizadas.append({
                    "id": s.id,
                    "nome": s.nome,
                    "capacidade": s.capacidade,
                    "campus": (
                        s.edificio.campus.nome
                        if getattr(s, "edificio", None)
                        and getattr(s.edificio, "campus", None)
                        else None
                    )
                })

        update_state(user_id, {
            "status": "escolher_sala",
            "salas_encontradas": salas_normalizadas
        })

        return {
            "status": "escolher_sala",
            "message": "Encontrei mais de uma sala. Qual você prefere?",
            "data": {
                "salas": salas_normalizadas
            }
        }
    # garante que sempre é lista
    if isinstance(salas, dict):
        salas = [salas]

    if not isinstance(salas, list):
        salas = list(salas)

    if len(salas) == 0:
        return {
            "status": "nenhuma_sala",
            "message": "Nenhuma sala encontrada."
        }

    sala = salas[0]

    # SEMPRE define sala_final
    sala_final = sala_to_dict(sala) if not isinstance(sala, dict) else sala

    update_state(user_id, {
        "status": "confirmar_reserva",
        "sala_selecionada": sala_final
    })

    return {
        "status": "confirmar_reserva",
        "message": montar_resumo_reserva(state, sala_final),
        "data": sala_final
    }