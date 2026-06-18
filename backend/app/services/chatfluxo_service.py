from datetime import datetime, date, timedelta
from typing import Dict, Any

from sqlalchemy.orm import Session

from app.models.sala import Sala
from app.models.reserva import Reserva
from app.models.usuario import Usuario
from app.models.instituicao import Instituicao
from app.models.tipo_sala import TipoSala
from app.models.edificio import Edificio
from app.models.campus import Campus
from app.models.sala_recurso import SalaRecurso
from app.models.recurso import Recurso


sessoes: Dict[str, Dict[str, Any]] = {}

STATUS_RESERVA = {
    1: "Pendente",
    2: "Aprovada",
    3: "Recusada",
    4: "Cancelada",
}

TURNOS = {
    "manha": {"nome": "Manhã", "inicio": "08:00", "fim": "12:00"},
    "tarde": {"nome": "Tarde", "inicio": "13:00", "fim": "18:00"},
    "noite": {"nome": "Noite", "inicio": "18:30", "fim": "22:30"},
    "dia_todo": {"nome": "Dia todo", "inicio": "08:00", "fim": "22:30"},
}

QUANTIDADE_MINIMA_PADRAO = 10


class ChatbotFluxoService:
    def menu(self):
        return {
            "resposta": (
                "Olá! Sou o chatbot do SIGSAS. Escolha uma opção:\n\n"
                "1 - Reservar\n"
                "2 - Cancelar reserva\n"
                "3 - Confirmar reserva"
            ),
            "tipoInteracao": "menu",
            "opcoes": [
                {"label": "1 - Reservar", "valor": "1"},
                {"label": "2 - Cancelar reserva", "valor": "2"},
                {"label": "3 - Confirmar reserva", "valor": "3"},
            ],
        }

    def resetar_sessao(self, session_id: str):
        sessoes.pop(session_id, None)

    def registrar_abandono_se_precisar(
        self,
        session_id: str,
        db: Session | None = None,
        id_usuario: int | None = None,
        nome_usuario: str | None = None,
        email_usuario: str | None = None,
        ip_maquina: str | None = None,
        **kwargs,
    ):
        """
        Registra, de forma segura, quando uma sessão do chatbot é resetada
        no meio de um fluxo.

        O chatfluxo_router.py chama este método antes de limpar a sessão.
        Esta implementação evita erro 500 no endpoint /chatbot-fluxo/reset
        e mantém compatibilidade mesmo que o router envie parâmetros extras.
        """

        sessao = sessoes.get(session_id)

        if not sessao:
            return False

        etapa_atual = sessao.get("step", "menu")

        etapas_sem_abandono = {
            "menu",
            "confirmar_criacao",
            "cancelar_confirmacao",
            "confirmar_confirmacao",
        }

        if etapa_atual in etapas_sem_abandono:
            return False

        sessao["abandonoRegistrado"] = True
        sessao["etapaAbandono"] = etapa_atual

        return True

    def processar_mensagem(
        self,
        texto: str,
        session_id: str,
        db: Session,
        id_usuario: int | None = None,
        request: Any | None = None,
        **kwargs,
    ):
        mensagem = str(texto or "").strip()

        if not mensagem:
            return {"resposta": "Digite uma opção ou mensagem para continuar."}

        if mensagem.lower() in {"menu", "inicio", "início", "voltar"}:
            sessoes[session_id] = {"step": "menu"}
            return self.menu()

        if session_id not in sessoes:
            sessoes[session_id] = {"step": "menu"}

        sessao = sessoes[session_id]
        step = sessao.get("step", "menu")

        if step == "menu":
            if mensagem == "1":
                sessao.clear()
                sessao["step"] = "data"
                return self.resposta_calendario(db)

            if mensagem == "2":
                return self.listar_reservas_cancelaveis_usuario(
                    db=db,
                    sessao=sessao,
                    id_usuario=id_usuario,
                )

            if mensagem == "3":
                sessao["step"] = "confirmar_id_reserva"
                return {
                    "resposta": (
                        "Informe o número da reserva que deseja confirmar.\n\n"
                        "Exemplo: 4"
                    )
                }

            return self.menu()

        if step == "data":
            return self.etapa_data(mensagem, sessao, db)

        if step == "campus":
            return self.etapa_campus(mensagem, sessao, db)

        if step == "horario":
            return self.etapa_horario(mensagem, sessao, db)

        if step == "tipo_sala":
            return self.etapa_tipo_sala(mensagem, sessao, db)

        if step == "quantidade":
            return self.etapa_quantidade(mensagem, sessao, db)

        if step == "escolher_sala":
            return self.etapa_escolher_sala(mensagem, sessao, db)

        if step == "confirmar_criacao":
            return self.etapa_confirmar_criacao(mensagem, sessao, db, id_usuario)

        if step == "cancelar_escolher_reserva":
            return self.etapa_cancelar_escolher_reserva(mensagem, sessao, db)

        if step == "cancelar_confirmacao":
            return self.etapa_cancelar_confirmacao(mensagem, sessao, db)

        if step == "confirmar_id_reserva":
            return self.etapa_confirmar_id_reserva(mensagem, sessao, db)

        if step == "confirmar_confirmacao":
            return self.etapa_confirmar_confirmacao(mensagem, sessao, db)

        sessoes[session_id] = {"step": "menu"}
        return self.menu()

    def resposta_calendario(self, db: Session):
        hoje = date.today()
        ultimo_dia_ano = date(hoje.year, 12, 31)

        nomes_meses = {
            1: "Janeiro",
            2: "Fevereiro",
            3: "Março",
            4: "Abril",
            5: "Maio",
            6: "Junho",
            7: "Julho",
            8: "Agosto",
            9: "Setembro",
            10: "Outubro",
            11: "Novembro",
            12: "Dezembro",
        }

        mapa_meses = {}
        data_atual = hoje

        while data_atual <= ultimo_dia_ano:
            chave_mes = f"{data_atual.year}-{str(data_atual.month).zfill(2)}"

            if chave_mes not in mapa_meses:
                mapa_meses[chave_mes] = {
                    "mes": data_atual.month,
                    "ano": data_atual.year,
                    "nomeMes": nomes_meses[data_atual.month],
                    "dias": [],
                }

            domingo = data_atual.weekday() == 6
            disponivel = self.dia_tem_alguma_sala_disponivel(db, data_atual)

            mapa_meses[chave_mes]["dias"].append(
                {
                    "dataIso": data_atual.isoformat(),
                    "dataBr": self.formatar_data_br(data_atual.isoformat()),
                    "dia": data_atual.day,
                    "mes": data_atual.month,
                    "ano": data_atual.year,
                    "diaSemana": data_atual.weekday(),
                    "disponivel": bool(disponivel and not domingo),
                    "motivoIndisponivel": (
                        "Domingo indisponível para reserva."
                        if domingo
                        else "Não há salas disponíveis nesta data."
                    ),
                }
            )

            data_atual += timedelta(days=1)

        meses = list(mapa_meses.values())

        return {
            "resposta": (
                "Escolha a data da reserva no calendário.\n\n"
                "Os dias em cinza estão indisponíveis. "
                "Todos os domingos ficam bloqueados. "
                "Se precisar reservar em um dia bloqueado, entre em contato com a administração."
            ),
            "tipoInteracao": "calendario",
            "meses": meses,
            "dias": [dia for mes in meses for dia in mes["dias"]],
        }

    def etapa_data(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        if not mensagem.startswith("DATA:"):
            return self.resposta_calendario(db)

        data_iso = mensagem.replace("DATA:", "").strip()

        try:
            data_obj = datetime.strptime(data_iso, "%Y-%m-%d").date()
        except ValueError:
            return {"resposta": "Data inválida. Escolha novamente pelo calendário."}

        if data_obj.weekday() == 6:
            return {
                "resposta": (
                    "Essa data está indisponível para reserva.\n"
                    "Entre em contato com a administração, pois precisa de verificação."
                ),
                **self.resposta_calendario(db),
            }

        if not self.dia_tem_alguma_sala_disponivel(db, data_obj):
            return {
                "resposta": (
                    "Essa data está indisponível porque não há salas disponíveis.\n"
                    "Entre em contato com a administração, pois precisa de verificação."
                ),
                **self.resposta_calendario(db),
            }

        sessao["data"] = data_iso
        sessao["step"] = "campus"

        return self.resposta_campus(db, sessao)

    def resposta_campus(self, db: Session, sessao: Dict[str, Any]):
        campi_disponiveis = self.get_campi_disponiveis(db, sessao)

        if not campi_disponiveis:
            sessao["step"] = "data"
            return {
                "resposta": (
                    "Não encontrei campus com salas disponíveis para "
                    f"{self.formatar_data_br(sessao['data'])}.\n\n"
                    "Escolha outra data no calendário."
                ),
                **self.resposta_calendario(db),
            }

        return {
            "resposta": (
                f"Para {self.formatar_data_br(sessao['data'])}, ainda temos salas disponíveis.\n\n"
                "Agora escolha sua preferência de campus:"
            ),
            "tipoInteracao": "botoes",
            "opcoes": [
                {"label": campus.nome, "valor": f"CAMPUS:{campus.id}"}
                for campus in campi_disponiveis
            ],
        }

    def etapa_campus(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        if not mensagem.startswith("CAMPUS:"):
            return self.resposta_campus(db, sessao)

        id_campus = int(mensagem.replace("CAMPUS:", ""))

        campus = db.query(Campus).filter(Campus.id == id_campus).first()

        if not campus:
            return self.resposta_campus(db, sessao)

        sessao["idCampus"] = id_campus
        sessao["nomeCampus"] = campus.nome
        sessao["step"] = "horario"

        return self.resposta_horario(db, sessao)

    def resposta_horario(self, db: Session, sessao: Dict[str, Any]):
        return {
            "resposta": (
                f"No campus {sessao['nomeCampus']}, ainda temos salas livres em "
                f"{self.formatar_data_br(sessao['data'])}.\n\n"
                "Selecione o turno desejado.\n\n"
                "Você pode escolher até dois turnos.\n"
                "Se escolher Dia todo, os outros turnos serão desativados."
            ),
            "tipoInteracao": "turnos",
            "turnos": [
                {"label": "Manhã", "valor": "manha"},
                {"label": "Tarde", "valor": "tarde"},
                {"label": "Noite", "valor": "noite"},
                {"label": "Dia todo", "valor": "dia_todo"},
            ],
        }

    def etapa_horario(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        if not mensagem.startswith("HORARIO:"):
            return self.resposta_horario(db, sessao)

        payload = mensagem.replace("HORARIO:", "").strip()
        turnos = payload.split(",") if payload else []

        turnos = [t for t in turnos if t in TURNOS]

        if not turnos:
            return {
                "resposta": "Selecione pelo menos um turno.",
                **self.resposta_horario(db, sessao),
            }

        if "dia_todo" in turnos:
            turnos = ["dia_todo"]

        if "dia_todo" not in turnos and len(turnos) > 2:
            return {
                "resposta": "Você pode escolher no máximo dois turnos.",
                **self.resposta_horario(db, sessao),
            }

        inicio, fim = self.calcular_intervalo_turnos(turnos)

        sessao["turnos"] = turnos
        sessao["horaInicio"] = inicio
        sessao["horaFim"] = fim

        if not self.existem_salas_para_filtros(db, sessao):
            return {
                "resposta": (
                    "Não encontrei salas disponíveis nesse campus, data e turno.\n\n"
                    "Você pode escolher outro turno ou digitar menu para recomeçar."
                ),
                **self.resposta_horario(db, sessao),
            }

        sessao["step"] = "tipo_sala"
        return self.resposta_tipo_sala(db, sessao)

    def resposta_tipo_sala(self, db: Session, sessao: Dict[str, Any]):
        tipos = self.get_tipos_disponiveis(db, sessao)

        if not tipos:
            sessao["step"] = "horario"
            return {
                "resposta": (
                    "Não encontrei tipos de sala disponíveis para esses filtros.\n"
                    "Escolha outro horário."
                ),
                **self.resposta_horario(db, sessao),
            }

        return {
            "resposta": (
                "Agora escolha o tipo de sala desejado.\n\n"
                "Essa escolha será usada como motivo da reserva."
            ),
            "tipoInteracao": "botoes",
            "opcoes": [
                {"label": tipo.nome, "valor": f"TIPO_SALA:{tipo.id}"}
                for tipo in tipos
            ],
        }

    def etapa_tipo_sala(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        if not mensagem.startswith("TIPO_SALA:"):
            return self.resposta_tipo_sala(db, sessao)

        id_tipo_sala = int(mensagem.replace("TIPO_SALA:", ""))

        tipo = db.query(TipoSala).filter(TipoSala.id == id_tipo_sala).first()

        if not tipo:
            return self.resposta_tipo_sala(db, sessao)

        limite_minimo, limite_maximo = self.get_limites_quantidade_tipo(
            db=db,
            sessao=sessao,
            id_tipo_sala=id_tipo_sala,
        )

        if limite_maximo is None:
            sessao["step"] = "tipo_sala"
            return {
                "resposta": (
                    f"Não encontrei salas disponíveis para {tipo.nome} nesse campus, data e turno.\n\n"
                    "Escolha outro tipo de sala."
                ),
                **self.resposta_tipo_sala(db, sessao),
            }

        if limite_maximo < limite_minimo:
            sessao["step"] = "tipo_sala"
            return {
                "resposta": (
                    f"As salas disponíveis para {tipo.nome} possuem capacidade máxima de "
                    f"{limite_maximo} pessoas, menor que o mínimo permitido de {limite_minimo}.\n\n"
                    "Escolha outro tipo de sala ou entre em contato com a administração."
                ),
                **self.resposta_tipo_sala(db, sessao),
            }

        sessao["idTipoSala"] = id_tipo_sala
        sessao["nomeTipoSala"] = tipo.nome
        sessao["quantidadeMinima"] = limite_minimo
        sessao["quantidadeMaxima"] = limite_maximo
        sessao["step"] = "quantidade"

        return {
            "resposta": (
                f"Ótimo. Para {tipo.nome}, ainda existem salas compatíveis.\n\n"
                "Informe a quantidade de pessoas.\n"
                f"Mínimo: {limite_minimo} pessoas\n"
                f"Máximo: {limite_maximo} pessoas"
            )
        }

    def etapa_quantidade(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        try:
            quantidade = int(mensagem)
        except ValueError:
            return {"resposta": "Digite apenas o número de pessoas. Exemplo: 30"}

        quantidade_minima = int(sessao.get("quantidadeMinima", QUANTIDADE_MINIMA_PADRAO))
        quantidade_maxima = sessao.get("quantidadeMaxima")

        if quantidade_maxima is None:
            quantidade_minima, quantidade_maxima = self.get_limites_quantidade_tipo(
                db=db,
                sessao=sessao,
                id_tipo_sala=sessao.get("idTipoSala"),
            )

            sessao["quantidadeMinima"] = quantidade_minima
            sessao["quantidadeMaxima"] = quantidade_maxima

        if quantidade < quantidade_minima:
            return {
                "resposta": (
                    f"A quantidade mínima é {quantidade_minima} pessoas.\n\n"
                    "Informe outra quantidade."
                )
            }

        if quantidade_maxima is not None and quantidade > int(quantidade_maxima):
            return {
                "resposta": (
                    f"A quantidade máxima permitida para esse tipo de sala é "
                    f"{quantidade_maxima} pessoas.\n\n"
                    "Informe outra quantidade."
                )
            }

        sessao["quantidade"] = quantidade

        salas = self.get_salas_disponiveis_filtradas(db, sessao)

        if not salas:
            return {
                "resposta": (
                    "Não encontrei salas disponíveis com todos esses critérios.\n\n"
                    "Você pode digitar menu para recomeçar e tentar outra data, campus, turno ou tipo de sala."
                )
            }

        sessao["salasDisponiveisReserva"] = [sala.id for sala in salas]
        sessao["step"] = "escolher_sala"

        return {
            "resposta": (
                f"Encontrei {len(salas)} sala(s) disponível(is) para os parâmetros informados.\n\n"
                "Escolha uma das opções abaixo para continuar com a reserva."
            ),
            "tipoInteracao": "lista-salas",
            "salas": [
                self.montar_card_sala(db, sala, indice)
                for indice, sala in enumerate(salas, start=1)
            ],
        }

    def etapa_escolher_sala(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        try:
            indice = int(mensagem)
        except ValueError:
            return {"resposta": "Digite apenas o número da sala listada. Exemplo: 1"}

        ids_salas = sessao.get("salasDisponiveisReserva", [])

        if indice < 1 or indice > len(ids_salas):
            return {
                "resposta": (
                    "Número inválido. Escolha uma das salas listadas.\n"
                    f"Digite um número entre 1 e {len(ids_salas)}."
                )
            }

        id_sala = ids_salas[indice - 1]
        sala = db.query(Sala).filter(Sala.idSala == id_sala).first()

        if not sala:
            sessao["step"] = "menu"
            return {"resposta": "Sala não encontrada. Digite menu para recomeçar."}

        sessao["idSalaReserva"] = id_sala
        sessao["step"] = "confirmar_criacao"

        return {
            "resposta": (
                "Confira os dados da reserva:\n\n"
                f"Sala: {sala.nome} | nº {sala.numero}\n"
                f"Campus: {sessao['nomeCampus']}\n"
                f"Data: {self.formatar_data_br(sessao['data'])}\n"
                f"Horário: {sessao['horaInicio']} até {sessao['horaFim']}\n"
                f"Tipo/Motivo: {sessao['nomeTipoSala']}\n"
                f"Quantidade de pessoas: {sessao['quantidade']}\n\n"
                "Digite SIM para criar a reserva ou NÃO para cancelar."
            )
        }

    def etapa_confirmar_criacao(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
        id_usuario: int | None,
    ):
        resposta_usuario = mensagem.lower().strip()

        if resposta_usuario not in {"sim", "s", "não", "nao", "n"}:
            return {"resposta": "Digite SIM para criar a reserva ou NÃO para cancelar."}

        if resposta_usuario in {"não", "nao", "n"}:
            self.limpar_fluxo_reserva(sessao)
            sessao["step"] = "menu"
            return {"resposta": "Reserva cancelada. Digite menu para voltar ao início."}

        if not id_usuario:
            self.limpar_fluxo_reserva(sessao)
            sessao["step"] = "menu"
            return {
                "resposta": (
                    "Não consegui identificar o usuário logado.\n"
                    "Saia e entre novamente no sistema."
                )
            }

        usuario = db.query(Usuario).filter(Usuario.id == id_usuario).first()

        if not usuario:
            self.limpar_fluxo_reserva(sessao)
            sessao["step"] = "menu"
            return {"resposta": "Usuário não encontrado no banco."}

        id_sala = sessao["idSalaReserva"]

        inicio = self.montar_datetime_reserva(sessao["data"], sessao["horaInicio"])
        fim = self.montar_datetime_reserva(sessao["data"], sessao["horaFim"])

        if not self.sala_esta_disponivel(db, id_sala, inicio, fim):
            self.limpar_fluxo_reserva(sessao)
            sessao["step"] = "menu"
            return {
                "resposta": (
                    "Essa sala ficou indisponível antes da confirmação.\n"
                    "Digite menu e tente novamente."
                )
            }

        nova_reserva = Reserva(
            idSala=id_sala,
            idUsuarioReserva=usuario.id,
            nomeUsuarioReserva=usuario.nome,
            matriculaUsuarioReserva=usuario.matricula or "Não informada",
            cargoUsuarioReserva=usuario.cargo or "Não informado",
            instituicaoUsuarioReserva=self.get_nome_instituicao_usuario(db, usuario)
            or "Não informada",
            idStatusReserva=1,
            dataInicio=sessao["data"],
            horaInicio=sessao["horaInicio"],
            dataFim=sessao["data"],
            horaFim=sessao["horaFim"],
            motivo=sessao["nomeTipoSala"],
            qtdPessoas=int(sessao["quantidade"]),
        )

        try:
            db.add(nova_reserva)
            db.commit()
            db.refresh(nova_reserva)
        except Exception as error:
            db.rollback()
            self.limpar_fluxo_reserva(sessao)
            sessao["step"] = "menu"
            return {
                "resposta": (
                    "Não consegui criar a reserva no banco de dados.\n"
                    f"Erro: {str(error)}"
                )
            }

        self.limpar_fluxo_reserva(sessao)
        sessao["step"] = "menu"

        return {
            "resposta": (
                "Reserva criada com sucesso no banco de dados!\n\n"
                f"{self.montar_texto_reserva(db, nova_reserva)}\n\n"
                "Ela foi criada como Pendente e aguarda aprovação."
            )
        }

    def listar_reservas_cancelaveis_usuario(
        self,
        db: Session,
        sessao: Dict[str, Any],
        id_usuario: int | None,
    ):
        if not id_usuario:
            sessao["step"] = "menu"
            return {
                "resposta": (
                    "Não consegui identificar o usuário logado.\n"
                    "Saia e entre novamente no sistema."
                )
            }

        reservas = (
            db.query(Reserva)
            .filter(
                Reserva.idUsuarioReserva == id_usuario,
                Reserva.idStatusReserva.in_([1, 2]),
            )
            .order_by(Reserva.dataInicio.asc(), Reserva.horaInicio.asc())
            .all()
        )

        if not reservas:
            sessao["step"] = "menu"
            return {
                "resposta": "Você não possui reservas pendentes ou aprovadas para cancelar."
            }

        sessao["reservasCancelamento"] = [r.idReserva for r in reservas]
        sessao["step"] = "cancelar_escolher_reserva"

        resposta = "Estas são suas reservas que podem ser canceladas:\n\n"

        for indice, reserva in enumerate(reservas, start=1):
            resposta += (
                f"{indice} - Reserva #{reserva.idReserva}\n"
                f"    Sala: {self.get_nome_sala(db, reserva.idSala)}\n"
                f"    Status: {STATUS_RESERVA.get(reserva.idStatusReserva)}\n"
                f"    Data: {self.formatar_data_br(reserva.dataInicio)} das "
                f"{reserva.horaInicio} às {reserva.horaFim}\n"
                f"    Motivo: {reserva.motivo}\n\n"
            )

        resposta += "Digite o número da lista que deseja cancelar."

        return {"resposta": resposta}

    def etapa_cancelar_escolher_reserva(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
    ):
        try:
            indice = int(mensagem)
        except ValueError:
            return {"resposta": "Digite apenas o número da lista."}

        ids = sessao.get("reservasCancelamento", [])

        if indice < 1 or indice > len(ids):
            return {"resposta": f"Digite um número entre 1 e {len(ids)}."}

        id_reserva = ids[indice - 1]
        reserva = db.query(Reserva).filter(Reserva.idReserva == id_reserva).first()

        if not reserva:
            sessao["step"] = "menu"
            return {"resposta": "Reserva não encontrada."}

        sessao["idReservaCancelar"] = id_reserva
        sessao["step"] = "cancelar_confirmacao"

        return {
            "resposta": (
                "Você escolheu esta reserva:\n\n"
                f"{self.montar_texto_reserva(db, reserva)}\n\n"
                "Digite SIM para cancelar ou NÃO para voltar."
            )
        }

    def etapa_cancelar_confirmacao(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
    ):
        resposta = mensagem.lower().strip()

        if resposta not in {"sim", "s", "não", "nao", "n"}:
            return {"resposta": "Digite SIM para cancelar ou NÃO para voltar."}

        if resposta in {"não", "nao", "n"}:
            sessao["step"] = "menu"
            sessao.pop("idReservaCancelar", None)
            sessao.pop("reservasCancelamento", None)
            return {"resposta": "Cancelamento interrompido."}

        reserva = (
            db.query(Reserva)
            .filter(Reserva.idReserva == sessao.get("idReservaCancelar"))
            .first()
        )

        if not reserva:
            sessao["step"] = "menu"
            return {"resposta": "Reserva não encontrada."}

        reserva.idStatusReserva = 4
        reserva.justificativa = "Cancelada pelo chatbot"

        db.commit()
        db.refresh(reserva)

        sessao["step"] = "menu"
        sessao.pop("idReservaCancelar", None)
        sessao.pop("reservasCancelamento", None)

        return {
            "resposta": (
                "Reserva cancelada com sucesso no banco de dados.\n\n"
                f"{self.montar_texto_reserva(db, reserva)}"
            )
        }

    def etapa_confirmar_id_reserva(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
    ):
        try:
            id_reserva = int(mensagem)
        except ValueError:
            return {"resposta": "Digite apenas o número da reserva."}

        reserva = db.query(Reserva).filter(Reserva.idReserva == id_reserva).first()

        if not reserva:
            sessao["step"] = "menu"
            return {"resposta": f"Não existe reserva #{id_reserva}."}

        if reserva.idStatusReserva != 1:
            sessao["step"] = "menu"
            return {
                "resposta": (
                    "Essa reserva não está pendente.\n\n"
                    f"{self.montar_texto_reserva(db, reserva)}"
                )
            }

        sessao["idReservaConfirmar"] = id_reserva
        sessao["step"] = "confirmar_confirmacao"

        return {
            "resposta": (
                f"{self.montar_texto_reserva(db, reserva)}\n\n"
                "Digite SIM para confirmar/aprovar ou NÃO para voltar."
            )
        }

    def etapa_confirmar_confirmacao(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
    ):
        resposta = mensagem.lower().strip()

        if resposta not in {"sim", "s", "não", "nao", "n"}:
            return {"resposta": "Digite SIM para confirmar ou NÃO para voltar."}

        if resposta in {"não", "nao", "n"}:
            sessao["step"] = "menu"
            sessao.pop("idReservaConfirmar", None)
            return {"resposta": "Confirmação interrompida."}

        reserva = (
            db.query(Reserva)
            .filter(Reserva.idReserva == sessao.get("idReservaConfirmar"))
            .first()
        )

        if not reserva:
            sessao["step"] = "menu"
            return {"resposta": "Reserva não encontrada."}

        reserva.idStatusReserva = 2
        reserva.justificativa = "Confirmada pelo chatbot"

        db.commit()
        db.refresh(reserva)

        sessao["step"] = "menu"
        sessao.pop("idReservaConfirmar", None)

        return {
            "resposta": (
                "Reserva confirmada/aprovada com sucesso no banco de dados.\n\n"
                f"{self.montar_texto_reserva(db, reserva)}"
            )
        }

    def dia_tem_alguma_sala_disponivel(self, db: Session, dia: date):
        if dia.weekday() == 6:
            return False

        salas = db.query(Sala).filter(Sala.ativo == True).all()

        for sala in salas:
            for turno in TURNOS.values():
                inicio = self.montar_datetime_reserva(dia.isoformat(), turno["inicio"])
                fim = self.montar_datetime_reserva(dia.isoformat(), turno["fim"])

                if self.sala_esta_disponivel(db, sala.id, inicio, fim):
                    return True

        return False

    def get_campi_disponiveis(self, db: Session, sessao: Dict[str, Any]):
        data = sessao["data"]
        campi = db.query(Campus).order_by(Campus.nome.asc()).all()
        resultado = []

        for campus in campi:
            salas = self.get_salas_por_campus(db, campus.id)

            for sala in salas:
                for turno in TURNOS.values():
                    inicio = self.montar_datetime_reserva(data, turno["inicio"])
                    fim = self.montar_datetime_reserva(data, turno["fim"])

                    if self.sala_esta_disponivel(db, sala.id, inicio, fim):
                        resultado.append(campus)
                        break

                if campus in resultado:
                    break

        return resultado

    def existem_salas_para_filtros(self, db: Session, sessao: Dict[str, Any]):
        salas = self.get_salas_por_campus(db, sessao["idCampus"])
        inicio = self.montar_datetime_reserva(sessao["data"], sessao["horaInicio"])
        fim = self.montar_datetime_reserva(sessao["data"], sessao["horaFim"])

        return any(self.sala_esta_disponivel(db, s.idSala, inicio, fim) for s in salas)

    def get_tipos_disponiveis(self, db: Session, sessao: Dict[str, Any]):
        salas = self.get_salas_por_campus(db, sessao["idCampus"])
        inicio = self.montar_datetime_reserva(sessao["data"], sessao["horaInicio"])
        fim = self.montar_datetime_reserva(sessao["data"], sessao["horaFim"])

        ids_tipos = set()

        for sala in salas:
            if self.sala_esta_disponivel(db, sala.id, inicio, fim):
                ids_tipos.add(sala.idTipoSala)

        if not ids_tipos:
            return []

        return (
            db.query(TipoSala)
            .filter(TipoSala.id.in_(list(ids_tipos)))
            .order_by(TipoSala.nome.asc())
            .all()
        )

    def get_limites_quantidade_tipo(
        self,
        db: Session,
        sessao: Dict[str, Any],
        id_tipo_sala: int | None,
    ):
        if not id_tipo_sala:
            return QUANTIDADE_MINIMA_PADRAO, None

        salas = (
            db.query(Sala)
            .join(Edificio, Sala.idEdificio == Edificio.id)
            .filter(
                Sala.ativo == True,
                Edificio.idCampus == sessao["idCampus"],
                Sala.idTipoSala == id_tipo_sala,
            )
            .order_by(Sala.capacidade.desc())
            .all()
        )

        inicio = self.montar_datetime_reserva(sessao["data"], sessao["horaInicio"])
        fim = self.montar_datetime_reserva(sessao["data"], sessao["horaFim"])

        salas_disponiveis = [
            sala
            for sala in salas
            if self.sala_esta_disponivel(db, sala.id, inicio, fim)
        ]

        if not salas_disponiveis:
            return QUANTIDADE_MINIMA_PADRAO, None

        maior_capacidade = max(int(sala.capacidade or 0) for sala in salas_disponiveis)

        return QUANTIDADE_MINIMA_PADRAO, maior_capacidade

    def get_salas_disponiveis_filtradas(self, db: Session, sessao: Dict[str, Any]):
        salas = (
            db.query(Sala)
            .join(Edificio, Sala.idEdificio == Edificio.id)
            .filter(
                Sala.ativo == True,
                Edificio.idCampus == sessao["idCampus"],
                Sala.idTipoSala == sessao["idTipoSala"],
                Sala.capacidade >= sessao["quantidade"],
            )
            .order_by(Sala.nome.asc())
            .all()
        )

        inicio = self.montar_datetime_reserva(sessao["data"], sessao["horaInicio"])
        fim = self.montar_datetime_reserva(sessao["data"], sessao["horaFim"])

        return [
            sala
            for sala in salas
            if self.sala_esta_disponivel(db, sala.id, inicio, fim)
        ]

    def get_salas_por_campus(self, db: Session, id_campus: int):
        return (
            db.query(Sala)
            .join(Edificio, Sala.idEdificio == Edificio.id)
            .filter(
                Sala.ativo == True,
                Edificio.idCampus == id_campus,
            )
            .all()
        )

    def sala_esta_disponivel(
        self,
        db: Session,
        id_sala: int,
        inicio_novo: datetime,
        fim_novo: datetime,
    ):
        reservas = (
            db.query(Reserva)
            .filter(
                Reserva.idSala == id_sala,
                Reserva.idStatusReserva.in_([1, 2]),
            )
            .all()
        )

        for reserva in reservas:
            inicio_existente = self.montar_datetime_reserva(
                reserva.dataInicio,
                reserva.horaInicio,
            )
            fim_existente = self.montar_datetime_reserva(
                reserva.dataFim,
                reserva.horaFim,
            )

            if inicio_novo < fim_existente and fim_novo > inicio_existente:
                return False

        return True

    def calcular_intervalo_turnos(self, turnos: list[str]):
        inicios = [TURNOS[t]["inicio"] for t in turnos]
        fins = [TURNOS[t]["fim"] for t in turnos]

        return min(inicios), max(fins)

    def montar_datetime_reserva(self, data: str, hora: str):
        return datetime.fromisoformat(f"{data}T{hora}")

    def formatar_data_br(self, data_iso: str):
        data_obj = datetime.strptime(data_iso, "%Y-%m-%d")
        return data_obj.strftime("%d/%m/%Y")

    def get_nome_instituicao_usuario(self, db: Session, usuario: Usuario):
        if not usuario.idInstituicao:
            return None

        instituicao = (
            db.query(Instituicao)
            .filter(Instituicao.id == usuario.idInstituicao)
            .first()
        )

        return instituicao.nome if instituicao else None

    def get_nome_sala(self, db: Session, id_sala: int):
        sala = db.query(Sala).filter(Sala.idSala == id_sala).first()
        return sala.nome if sala else "Sala não encontrada"

    def get_tipo_sala(self, db: Session, id_tipo_sala: int):
        tipo = db.query(TipoSala).filter(TipoSala.id == id_tipo_sala).first()
        return tipo.nome if tipo else "Tipo não informado"

    def get_localizacao_sala(self, db: Session, id_edificio: int):
        edificio = db.query(Edificio).filter(Edificio.id == id_edificio).first()

        if not edificio:
            return {
                "edificio": "Não informado",
                "campus": "Não informado",
                "instituicao": "Não informada",
            }

        campus = db.query(Campus).filter(Campus.id == edificio.idCampus).first()

        instituicao = None
        if campus:
            instituicao = (
                db.query(Instituicao)
                .filter(Instituicao.id == campus.idInstituicao)
                .first()
            )

        return {
            "edificio": edificio.nome,
            "campus": campus.nome if campus else "Não informado",
            "instituicao": instituicao.nome if instituicao else "Não informada",
        }

    def get_recursos_sala(self, db: Session, id_sala: int):
        vinculos = db.query(SalaRecurso).filter(SalaRecurso.idSala == id_sala).all()
        ids = [v.idRecurso for v in vinculos]

        if not ids:
            return []

        recursos = db.query(Recurso).filter(Recurso.id.in_(ids)).all()
        return [r.nome for r in recursos]

    def montar_card_sala(self, db: Session, sala: Sala, numero_lista: int):
        tipo = self.get_tipo_sala(db, sala.idTipoSala)
        localizacao = self.get_localizacao_sala(db, sala.idEdificio)
        recursos = self.get_recursos_sala(db, sala.id)

        return {
            "numeroLista": numero_lista,
            "idSala": sala.id,
            "nome": sala.nome,
            "numero": sala.numero,
            "tipo": tipo,
            "capacidade": sala.capacidade,
            "andar": sala.andar,
            "instituicao": localizacao["instituicao"],
            "campus": localizacao["campus"],
            "edificio": localizacao["edificio"],
            "recursos": recursos,
        }

    def montar_texto_sala(self, db: Session, sala: Sala):
        tipo = self.get_tipo_sala(db, sala.idTipoSala)
        localizacao = self.get_localizacao_sala(db, sala.idEdificio)
        recursos = self.get_recursos_sala(db, sala.id)
        recursos_texto = ", ".join(recursos) if recursos else "nenhum recurso informado"

        return (
            f"• {sala.nome} | nº {sala.numero}\n"
            f"  Tipo: {tipo}\n"
            f"  Capacidade: {sala.capacidade} pessoas\n"
            f"  Andar: {sala.andar}\n"
            f"  Instituição: {localizacao['instituicao']}\n"
            f"  Campus: {localizacao['campus']}\n"
            f"  Edifício: {localizacao['edificio']}\n"
            f"  Recursos: {recursos_texto}\n"
        )

    def montar_texto_reserva(self, db: Session, reserva: Reserva):
        return (
            f"Reserva #{reserva.idReserva}\n"
            f"Sala: {self.get_nome_sala(db, reserva.idSala)}\n"
            f"Solicitante: {reserva.nomeUsuarioReserva or 'Não informado'}\n"
            f"Matrícula: {reserva.matriculaUsuarioReserva or 'Não informada'}\n"
            f"Cargo: {reserva.cargoUsuarioReserva or 'Não informado'}\n"
            f"Instituição: {reserva.instituicaoUsuarioReserva or 'Não informada'}\n"
            f"Status: {STATUS_RESERVA.get(reserva.idStatusReserva, 'Desconhecido')}\n"
            f"Data: {self.formatar_data_br(reserva.dataInicio)} das "
            f"{reserva.horaInicio} às {reserva.horaFim}\n"
            f"Motivo/Tipo: {reserva.motivo}\n"
            f"Pessoas: {reserva.qtdPessoas}"
        )

    def limpar_fluxo_reserva(self, sessao: Dict[str, Any]):
        campos = [
            "data",
            "idCampus",
            "nomeCampus",
            "turnos",
            "horaInicio",
            "horaFim",
            "idTipoSala",
            "nomeTipoSala",
            "quantidade",
            "quantidadeMinima",
            "quantidadeMaxima",
            "salasDisponiveisReserva",
            "idSalaReserva",
        ]

        for campo in campos:
            sessao.pop(campo, None)