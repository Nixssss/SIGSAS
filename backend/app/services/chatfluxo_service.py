from datetime import datetime
from typing import Dict, Any

from sqlalchemy.orm import Session

from app.models.sala import Sala
from app.models.reserva import Reserva
from app.models.tipo_sala import TipoSala
from app.models.edificio import Edificio
from app.models.campus import Campus
from app.models.instituicao import Instituicao
from app.models.sala_recurso import SalaRecurso
from app.models.recurso import Recurso


sessoes: Dict[str, Dict[str, Any]] = {}


class ChatbotFluxoService:
    def menu(self):
        return {
            "resposta": (
                "Olá! Sou o chatbot do SIGSAS. Escolha uma opção:\n\n"
                "1 - Reservar\n"
                "2 - Cancelar reserva\n"
                "3 - Confirmar reserva"
            )
        }

    def resetar_sessao(self, session_id: str):
        sessoes.pop(session_id, None)

    def processar_mensagem(self, texto: str, session_id: str, db: Session):
        mensagem = str(texto or "").strip()

        if not mensagem:
            return {"resposta": "Digite uma opção ou mensagem para continuar."}

        if mensagem.lower() in {"menu", "início", "inicio", "voltar", "cancelar"}:
            sessoes[session_id] = {"step": "menu"}
            return self.menu()

        if session_id not in sessoes:
            sessoes[session_id] = {"step": "menu"}

        sessao = sessoes[session_id]
        step = sessao.get("step", "menu")

        if step == "menu":
            if mensagem == "1":
                sessao["step"] = "capacidade"
                return {"resposta": "Informe a capacidade mínima da sala. Exemplo: 30"}

            if mensagem == "2":
                return {
                    "resposta": (
                        "Cancelamento ainda não foi integrado ao banco neste fluxo.\n"
                        "Digite menu para voltar."
                    )
                }

            if mensagem == "3":
                return {
                    "resposta": (
                        "Confirmação ainda não foi integrada ao banco neste fluxo.\n"
                        "Digite menu para voltar."
                    )
                }

            return {
                "resposta": (
                    "Opção inválida. Escolha:\n\n"
                    "1 - Reservar\n"
                    "2 - Cancelar reserva\n"
                    "3 - Confirmar reserva"
                )
            }

        if step == "capacidade":
            try:
                capacidade = int(mensagem)
                if capacidade <= 0:
                    raise ValueError
            except ValueError:
                return {
                    "resposta": "Capacidade inválida. Digite apenas um número maior que zero."
                }

            sessao["capacidade"] = capacidade
            sessao["step"] = "data"
            return {"resposta": "Informe a data da reserva no formato dd/mm/aaaa."}

        if step == "data":
            try:
                data_reserva = datetime.strptime(mensagem, "%d/%m/%Y").date()
                if data_reserva < datetime.now().date():
                    return {"resposta": "Você não pode reservar uma sala em data passada."}
            except ValueError:
                return {"resposta": "Data inválida. Use o formato dd/mm/aaaa."}

            sessao["data"] = mensagem
            sessao["step"] = "hora_inicio"
            return {"resposta": "Informe o horário de início no formato hh:mm."}

        if step == "hora_inicio":
            try:
                datetime.strptime(mensagem, "%H:%M")
            except ValueError:
                return {"resposta": "Horário inválido. Use o formato hh:mm."}

            sessao["hora_inicio"] = mensagem
            sessao["step"] = "hora_fim"
            return {"resposta": "Informe o horário final no formato hh:mm."}

        if step == "hora_fim":
            try:
                hora_inicio = datetime.strptime(
                    sessao["hora_inicio"], "%H:%M"
                ).time()
                hora_fim = datetime.strptime(mensagem, "%H:%M").time()
            except ValueError:
                return {"resposta": "Horário inválido. Use o formato hh:mm."}

            if hora_fim <= hora_inicio:
                return {
                    "resposta": "O horário final deve ser maior que o horário inicial."
                }

            sessao["hora_fim"] = mensagem
            return self.buscar_salas_disponiveis(db, sessao)

        return self.menu()

    def montar_datetime_reserva(self, data: str, hora: str):
        return datetime.fromisoformat(f"{data}T{hora}")

    def reserva_tem_conflito(
        self,
        reserva: Reserva,
        inicio_novo: datetime,
        fim_novo: datetime,
    ):
        if reserva.idStatusReserva not in [1, 2]:
            return False

        inicio_existente = self.montar_datetime_reserva(
            reserva.dataInicio,
            reserva.horaInicio,
        )

        fim_existente = self.montar_datetime_reserva(
            reserva.dataFim,
            reserva.horaFim,
        )

        return inicio_novo < fim_existente and fim_novo > inicio_existente

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
        ids_recursos = [v.idRecurso for v in vinculos]

        if not ids_recursos:
            return []

        recursos = db.query(Recurso).filter(Recurso.id.in_(ids_recursos)).all()
        return [r.nome for r in recursos]

    def montar_texto_sala(self, db: Session, sala: Sala):
        tipo = self.get_tipo_sala(db, sala.idTipoSala)
        localizacao = self.get_localizacao_sala(db, sala.idEdificio)
        recursos = self.get_recursos_sala(db, sala.idSala)
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

    def buscar_salas_disponiveis(self, db: Session, sessao: Dict[str, Any]):
        data = datetime.strptime(sessao["data"], "%d/%m/%Y").date()

        inicio = datetime.combine(
            data,
            datetime.strptime(sessao["hora_inicio"], "%H:%M").time(),
        )

        fim = datetime.combine(
            data,
            datetime.strptime(sessao["hora_fim"], "%H:%M").time(),
        )

        capacidade = int(sessao["capacidade"])

        salas = (
            db.query(Sala)
            .filter(
                Sala.ativo == True,
                Sala.capacidade >= capacidade,
            )
            .order_by(Sala.nome.asc())
            .all()
        )

        if not salas:
            sessao["step"] = "menu"
            return {
                "resposta": (
                    "Não encontrei salas ativas com essa capacidade mínima.\n"
                    "Digite menu para tentar novamente."
                )
            }

        salas_livres = []

        for sala in salas:
            reservas_da_sala = (
                db.query(Reserva)
                .filter(
                    Reserva.idSala == sala.idSala,
                    Reserva.idStatusReserva.in_([1, 2]),
                )
                .all()
            )

            conflito = any(
                self.reserva_tem_conflito(reserva, inicio, fim)
                for reserva in reservas_da_sala
            )

            if not conflito:
                salas_livres.append(sala)

        sessao["step"] = "menu"

        if not salas_livres:
            return {
                "resposta": (
                    "Nenhuma sala disponível nesse período.\n"
                    "Digite menu para tentar outro horário."
                )
            }

        resposta = "Salas disponíveis para esse período:\n\n"

        for indice, sala in enumerate(salas_livres, start=1):
            resposta += f"{indice} - {self.montar_texto_sala(db, sala)}\n"

        resposta += (
            "\nPara criar a reserva, use a tela de Salas e clique em Reservar "
            "na sala desejada."
        )

        return {
            "resposta": resposta,
            "salas": [
                {
                    "idSala": sala.idSala,
                    "nome": sala.nome,
                    "numero": sala.numero,
                    "capacidade": sala.capacidade,
                    "idTipoSala": sala.idTipoSala,
                    "idEdificio": sala.idEdificio,
                    "ativo": sala.ativo,
                }
                for sala in salas_livres
            ],
        }