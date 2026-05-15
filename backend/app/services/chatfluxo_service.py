from datetime import datetime
from sqlalchemy.orm import Session

from app.models.tipo_sala import TipoSala
from app.models.sala import Sala
from app.models.reserva import Reserva

sessoes = {}


class ChatbotFluxoService:

    def processar_mensagem(self, texto, session_id, db: Session):

        mensagem = str(texto).strip()

        if session_id not in sessoes:
            sessoes[session_id] = {"step": "menu"}

        sessao = sessoes[session_id]
        step = sessao["step"]

        # MENU
        if step == "menu":

            print("MENSAGEM RECEBIDA:", mensagem)

            if mensagem == "1":

                sessao["step"] = "campus"

                return {
                    "resposta":
                    "Escolha o campus:\n\n"
                    "1 - Campus Asa Sul\n"
                    "2 - Campus Taguatinga"
                }

            if mensagem == "2":
                return {"resposta": "Funcionalidade de cancelamento ainda não implementada."}

            if mensagem == "3":
                return {"resposta": "Funcionalidade de confirmação ainda não implementada."}

            return {
                "resposta":
                "Opção inválida.\n\n"
                "1 - Reservar\n"
                "2 - Cancelar reserva\n"
                "3 - Confirmar reserva"
            }

        # CAMPUS
        elif step == "campus":

            print("CAMPUS RECEBIDO:", mensagem)

            if mensagem not in ["1", "2"]:
                return {
                    "resposta":
                    "Campus inválido.\n\n"
                    "1 - Campus Asa Sul\n"
                    "2 - Campus Taguatinga"
                }

            sessao["campus"] = mensagem
            sessao["step"] = "tipo_sala"

            tipos_sala = db.query(TipoSala).all()

            texto_tipos = "Escolha o tipo de sala:\n\n"

            for index, item in enumerate(tipos_sala, start=1):
                texto_tipos += f"{index} - {item.nome}\n"

            return {"resposta": texto_tipos}

        # TIPO SALA
        elif step == "tipo_sala":

            print("TIPO SALA RECEBIDO:", mensagem)

            if mensagem not in ["1", "2", "3", "4"]:
                return {
                    "resposta":
                    "Tipo de sala inválido.\n\n"
                    "1 - Sala de aula\n"
                    "2 - Lab informática\n"
                    "3 - Lab análises clínicas\n"
                    "4 - Auditório"
                }

            sessao["tipo_sala"] = mensagem
            sessao["step"] = "data"

            return {"resposta": "Informe a data no formato dd/mm/aaaa"}

        # DATA
        elif step == "data":

            print("DATA RECEBIDA:", mensagem)

            try:
                data_reserva = datetime.strptime(mensagem, "%d/%m/%Y")
                hoje = datetime.now()

                if data_reserva.date() < hoje.date():
                    return {"resposta": "Você não pode reservar uma sala em data passada."}

                sessao["data"] = mensagem
                sessao["step"] = "hora_inicio"

                return {
                    "resposta":
                    "Informe o horário de início da reserva no formato hh:mm"
                }

            except ValueError:
                return {"resposta": "Data inválida. Use dd/mm/aaaa"}

        # HORA INICIO
        elif step == "hora_inicio":

            print("HORA INICIO RECEBIDA:", mensagem)

            try:
                datetime.strptime(mensagem, "%H:%M")

                sessao["hora_inicio"] = mensagem
                sessao["step"] = "hora_fim"

                return {
                    "resposta":
                    "Informe o horário final da reserva no formato hh:mm"
                }

            except ValueError:
                return {"resposta": "Horário inválido. Use hh:mm"}

        # HORA FIM
        elif step == "hora_fim":

            print("HORA FIM RECEBIDA:", mensagem)

            try:

                hora_inicio = datetime.strptime(sessao["hora_inicio"], "%H:%M")
                hora_fim = datetime.strptime(mensagem, "%H:%M")

                if hora_fim <= hora_inicio:
                    return {"resposta": "Horário final deve ser maior que o inicial."}

                sessao["hora_fim"] = mensagem

                sessao["step"] = "buscar_salas"

                return self.buscar_salas_disponiveis(db, sessao)

            except ValueError:
                return {"resposta": "Horário inválido. Use hh:mm"}

        return {"resposta": "Fluxo encerrado."}

    # =========================
    # BUSCAR SALAS DISPONÍVEIS
    # =========================
    def buscar_salas_disponiveis(self, db: Session, sessao):

        data = sessao["data"]
        tipo_sala = sessao["tipo_sala"]
        campus = sessao["campus"]

        salas = db.query(Sala).filter(
            Sala.tipo_sala_id == tipo_sala,
            salas = db.query(Sala).all()
        ).all()

        reservas = db.query(Reserva).filter(
            Reserva.data == data
        ).all()

        salas_ocupadas = {r.sala_id for r in reservas}

        salas_livres = [
            sala for sala in salas
            if sala.id not in salas_ocupadas
        ]

        if not salas_livres:
            sessao["step"] = "menu"
            return {"resposta": "Nenhuma sala disponível nesse horário."}

        sessao["salas_disponiveis"] = [s.id for s in salas_livres]
        sessao["step"] = "selecionar_sala"

        texto = "Salas disponíveis:\n\n"

        for i, sala in enumerate(salas_livres, start=1):
            texto += f"{i} - {sala.nome}\n"

        return {"resposta": texto}