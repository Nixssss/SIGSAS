from datetime import datetime, date, timedelta
from typing import Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.sala import Sala
from app.models.reserva import Reserva
from app.models.usuario import Usuario
from app.models.instituicao import Instituicao
from app.models.tipo_sala import TipoSala
from app.models.edificio import Edificio
from app.models.campus import Campus
from app.models.sala_recurso import SalaRecurso
from app.models.recurso import Recurso
from app.models.usuario_curso import UsuarioCurso
from app.models.curso import Curso
from app.services.auditoria_service import registrar_log
from app.services.email_resend_service import (
    enviar_email_reserva_criada,
    enviar_email_reserva_aprovada,
    enviar_email_reserva_cancelada,
)


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
    def menu(self, db: Session | None = None, id_usuario: int | None = None):
        opcoes = [{"label": "1 - Reservar", "valor": "1"}]

        usuario = self.get_usuario_logado(db, id_usuario) if db is not None else None
        perfil = self.normalizar_perfil(usuario.perfil) if usuario else None

        if perfil == "Administrador":
            opcoes.append({"label": "2 - Cancelar reserva", "valor": "2"})
            opcoes.append({"label": "3 - Confirmar reserva", "valor": "3"})

        elif perfil == "Coordenador":
            pode_cancelar = False

            if db is not None and id_usuario is not None:
                pode_cancelar = self.usuario_tem_reservas_cancelaveis(
                    db=db,
                    id_usuario=id_usuario,
                )

            if pode_cancelar:
                opcoes.append({"label": "2 - Cancelar reserva", "valor": "2"})

            opcoes.append({"label": "3 - Confirmar reserva", "valor": "3"})

        else:
            pode_cancelar = False

            if db is not None and id_usuario is not None:
                pode_cancelar = self.usuario_tem_reservas_cancelaveis(
                    db=db,
                    id_usuario=id_usuario,
                )

            if pode_cancelar:
                opcoes.append({"label": "2 - Cancelar reserva", "valor": "2"})

        texto_opcoes = "\n".join(opcao["label"] for opcao in opcoes)

        return {
            "resposta": (
                "Olá! Sou o chatbot do SIGSAS. Escolha uma opção:\n\n"
                f"{texto_opcoes}"
            ),
            "tipoInteracao": "menu",
            "opcoes": opcoes,
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
        motivo: str | None = None,
        request: Any | None = None,
        **kwargs,
    ):
        sessao = sessoes.get(session_id)

        if not sessao:
            return False

        etapa_atual = sessao.get("step", "menu")

        etapas_sem_abandono = {
            "menu",
            "reservar_outra_sala",
        }

        if etapa_atual in etapas_sem_abandono:
            return False

        if sessao.get("abandonoRegistrado"):
            return False

        sessao["abandonoRegistrado"] = True
        sessao["etapaAbandono"] = etapa_atual

        if db is not None:
            try:
                dados_parciais = []

                if sessao.get("nomeInstituicaoReserva"):
                    dados_parciais.append(f"Instituição: {sessao.get('nomeInstituicaoReserva')}")

                if sessao.get("cursoUsuarioReserva"):
                    dados_parciais.append(f"Curso: {sessao.get('cursoUsuarioReserva')}")

                if sessao.get("data"):
                    dados_parciais.append(f"Data: {self.formatar_data_br(sessao.get('data'))}")

                if sessao.get("nomeCampus"):
                    dados_parciais.append(f"Campus: {sessao.get('nomeCampus')}")

                if sessao.get("horaInicio"):
                    dados_parciais.append(f"Horário inicial: {sessao.get('horaInicio')}")

                if sessao.get("horaFim"):
                    dados_parciais.append(f"Horário final: {sessao.get('horaFim')}")

                if sessao.get("nomeTipoSala"):
                    dados_parciais.append(f"Tipo de sala: {sessao.get('nomeTipoSala')}")

                if sessao.get("quantidade"):
                    dados_parciais.append(f"Pessoas: {sessao.get('quantidade')}")

                resumo_parcial = " | ".join(dados_parciais) if dados_parciais else "Sem dados parciais relevantes."
                descricao_motivo = motivo or "Usuário abandonou o fluxo do chatbot antes de concluir."

                registrar_log(
                    db=db,
                    acao="CHATBOT_ABANDONO",
                    modulo="Chatbot",
                    etapa=str(etapa_atual),
                    descricao=(
                        f"{descricao_motivo} Etapa interrompida: {etapa_atual}. "
                        f"Dados parciais: {resumo_parcial}"
                    ),
                    status="abandono",
                    id_usuario=id_usuario,
                    nome_usuario=nome_usuario,
                    email_usuario=email_usuario,
                    ip_maquina=ip_maquina,
                    session_id=session_id,
                    request=request,
                )
            except Exception as error:
                print("Erro ao registrar abandono do chatbot:", str(error))

        return True

    def normalizar_perfil(self, perfil: str | None):
        texto = str(perfil or "").strip().lower()

        if texto in {"administrador", "admin", "dono"}:
            return "Administrador"

        if texto in {"coordenador", "coord"}:
            return "Coordenador"

        if texto in {"professor", "docente", "usuario", "usuário"}:
            return "Professor"

        return str(perfil or "").strip()

    def get_usuario_logado(self, db: Session, id_usuario: int | None):
        if not id_usuario:
            return None

        return db.query(Usuario).filter(Usuario.id == id_usuario).first()

    def buscar_usuario_reserva_email(self, db: Session, reserva: Reserva):
        if not reserva.idUsuarioReserva:
            return None

        return db.query(Usuario).filter(Usuario.id == reserva.idUsuarioReserva).first()

    def montar_dados_email_reserva_chatbot(self, db: Session, reserva: Reserva):
        return {
            "nome_sala": self.get_nome_sala(db, reserva.idSala),
            "solicitante": reserva.nomeUsuarioReserva,
            "matricula": reserva.matriculaUsuarioReserva,
            "cargo": reserva.cargoUsuarioReserva,
            "instituicao": reserva.instituicaoUsuarioReserva,
            "curso": reserva.cursoUsuarioReserva,
            "data_inicio": reserva.dataInicio,
            "hora_inicio": reserva.horaInicio,
            "data_fim": reserva.dataFim,
            "hora_fim": reserva.horaFim,
            "motivo": reserva.motivo,
            "qtd_pessoas": reserva.qtdPessoas,
        }

    def enviar_email_reserva_aprovada_chatbot(self, db: Session, reserva: Reserva):
        usuario = self.buscar_usuario_reserva_email(db, reserva)

        if not usuario or not usuario.email:
            print(
                f"[SIGSAS EMAIL] Reserva #{reserva.idReserva} sem usuário/email para envio de aprovação."
            )
            return

        try:
            enviar_email_reserva_aprovada(
                email=usuario.email,
                justificativa=reserva.justificativa or "Confirmada pelo chatbot",
                **self.montar_dados_email_reserva_chatbot(db, reserva),
            )
        except Exception as error:
            print(
                f"[SIGSAS EMAIL] Erro ao enviar email de aprovação da reserva #{reserva.idReserva}: {str(error)}"
            )

    def enviar_email_reserva_pendente_chatbot(self, db: Session, reserva: Reserva):
        usuario = self.buscar_usuario_reserva_email(db, reserva)

        if not usuario or not usuario.email:
            print(
                f"[SIGSAS EMAIL] Reserva #{reserva.idReserva} sem usuário/email para envio de pendência."
            )
            return

        try:
            enviar_email_reserva_criada(
                email=usuario.email,
                **self.montar_dados_email_reserva_chatbot(db, reserva),
            )
        except Exception as error:
            print(
                f"[SIGSAS EMAIL] Erro ao enviar email de pendência da reserva #{reserva.idReserva}: {str(error)}"
            )

    def enviar_email_reserva_cancelada_chatbot(self, db: Session, reserva: Reserva):
        usuario = self.buscar_usuario_reserva_email(db, reserva)

        if not usuario or not usuario.email:
            print(
                f"[SIGSAS EMAIL] Reserva #{reserva.idReserva} sem usuário/email para envio de cancelamento."
            )
            return

        try:
            enviar_email_reserva_cancelada(
                email=usuario.email,
                justificativa=reserva.justificativa or "Cancelada pelo chatbot",
                **self.montar_dados_email_reserva_chatbot(db, reserva),
            )
        except Exception as error:
            print(
                f"[SIGSAS EMAIL] Erro ao enviar email de cancelamento da reserva #{reserva.idReserva}: {str(error)}"
            )

    def get_vinculos_usuario(self, db: Session, id_usuario: int | None):
        if not id_usuario:
            return []

        return (
            db.query(UsuarioCurso)
            .filter(UsuarioCurso.idUsuario == id_usuario)
            .all()
        )

    def get_cursos_usuario_para_reserva(self, db: Session, id_usuario: int | None):
        usuario = self.get_usuario_logado(db, id_usuario)

        if not usuario:
            return []

        perfil = self.normalizar_perfil(usuario.perfil)

        if perfil == "Administrador":
            return []

        vinculos = self.get_vinculos_usuario(db, id_usuario)

        if perfil == "Coordenador":
            vinculos = [
                vinculo
                for vinculo in vinculos
                if self.normalizar_perfil(vinculo.tipoVinculo)
                in {"Coordenador", "Professor"}
            ]
        else:
            vinculos = [
                vinculo
                for vinculo in vinculos
                if self.normalizar_perfil(vinculo.tipoVinculo) == "Professor"
            ]

        resultado = []
        ids_adicionados = set()

        for vinculo in vinculos:
            if vinculo.idCurso in ids_adicionados:
                continue

            ids_adicionados.add(vinculo.idCurso)
            resultado.append(vinculo)

        return resultado

    def get_ids_cursos_coordenador(self, db: Session, id_usuario: int | None):
        if not id_usuario:
            return []

        vinculos = self.get_vinculos_usuario(db, id_usuario)

        return [
            vinculo.idCurso
            for vinculo in vinculos
            if self.normalizar_perfil(vinculo.tipoVinculo) == "Coordenador"
        ]

    def get_ids_areas_coordenador(self, db: Session, id_usuario: int | None):
        ids_cursos_coordenador = self.get_ids_cursos_coordenador(
            db=db,
            id_usuario=id_usuario,
        )

        if not ids_cursos_coordenador:
            return []

        areas = (
            db.query(Curso.id_area_curso)
            .filter(
                Curso.id.in_(ids_cursos_coordenador),
                Curso.id_area_curso.isnot(None),
            )
            .distinct()
            .all()
        )

        return [area[0] for area in areas if area[0] is not None]

    def get_cursos_das_areas_coordenador(
        self,
        db: Session,
        id_usuario: int | None,
    ):
        ids_areas = self.get_ids_areas_coordenador(
            db=db,
            id_usuario=id_usuario,
        )

        if not ids_areas:
            return []

        return (
            db.query(Curso)
            .filter(Curso.id_area_curso.in_(ids_areas))
            .order_by(Curso.nome.asc())
            .all()
        )

    def get_reservas_cancelaveis_usuario(self, db: Session, id_usuario: int | None):
        usuario = self.get_usuario_logado(db, id_usuario)

        if not usuario:
            return []

        perfil = self.normalizar_perfil(usuario.perfil)

        query = db.query(Reserva).filter(Reserva.idStatusReserva.in_([1, 2]))

        if perfil != "Administrador":
            query = query.filter(Reserva.idUsuarioReserva == id_usuario)

        return query.order_by(Reserva.dataInicio.asc(), Reserva.horaInicio.asc()).all()

    def usuario_tem_reservas_cancelaveis(self, db: Session, id_usuario: int | None):
        return len(self.get_reservas_cancelaveis_usuario(db, id_usuario)) > 0

    def get_reservas_pendentes_para_confirmar(self, db: Session, id_usuario: int | None):
        usuario = self.get_usuario_logado(db, id_usuario)

        if not usuario:
            return []

        perfil = self.normalizar_perfil(usuario.perfil)

        query = db.query(Reserva).filter(Reserva.idStatusReserva == 1)

        if perfil == "Administrador":
            return query.order_by(
                Reserva.dataInicio.asc(),
                Reserva.horaInicio.asc(),
            ).all()

        if perfil == "Coordenador":
            cursos_area = self.get_cursos_das_areas_coordenador(
                db=db,
                id_usuario=id_usuario,
            )

            if not cursos_area:
                return []

            ids_cursos_area = [curso.id for curso in cursos_area]
            nomes_cursos_area = [
                str(curso.nome or "").strip().lower()
                for curso in cursos_area
                if curso.nome
            ]

            return (
                query.filter(
                    or_(
                        Reserva.idCursoReserva.in_(ids_cursos_area),
                        func.lower(func.trim(Reserva.cursoUsuarioReserva)).in_(
                            nomes_cursos_area
                        ),
                    )
                )
                .order_by(Reserva.dataInicio.asc(), Reserva.horaInicio.asc())
                .all()
            )

        return []

    def usuario_tem_reservas_para_confirmar(self, db: Session, id_usuario: int | None):
        return len(self.get_reservas_pendentes_para_confirmar(db, id_usuario)) > 0

    def montar_resposta_ajuste_fluxo(
        self,
        mensagem: str,
        opcoes: list[dict[str, str]],
    ):
        return {
            "resposta": mensagem,
            "tipoInteracao": "botoes",
            "opcoes": opcoes,
        }

    def opcoes_ajuste_data_instituicao(self):
        return [
            {"label": "Escolher outra data", "valor": "AJUSTE:DATA"},
        ]

    def opcoes_ajuste_horario_data_campus(self):
        return [
            {"label": "Escolher outra data", "valor": "AJUSTE:DATA"},
        ]

    def opcoes_ajuste_tipo_horario_data(self):
        return [
            {"label": "Escolher outra data", "valor": "AJUSTE:DATA"},
        ]

    def opcoes_ajuste_sala_tipo_data(self):
        return [
            {"label": "Escolher outra data", "valor": "AJUSTE:DATA"},
        ]

    def processar_ajuste_fluxo(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
    ):
        ajuste = str(mensagem or "").strip().upper()

        if not ajuste.startswith("AJUSTE:"):
            return None

        acao = ajuste.split(":", 1)[1].strip()

        if acao == "INSTITUICAO":
            for chave in [
                "idInstituicaoReserva", "nomeInstituicaoReserva", "data",
                "idCampus", "nomeCampus", "horaInicio", "horaFim",
                "idTipoSala", "nomeTipoSala", "faixasCapacidade",
                "faixaCapacidadeInicio", "faixaCapacidadeFim",
                "faixaCapacidadeLabel", "quantidade", "salasDisponiveisReserva",
                "idSalaReserva",
            ]:
                sessao.pop(chave, None)

            sessao["step"] = "instituicao"
            return self.resposta_instituicao(db, sessao)

        if acao == "DATA":
            for chave in [
                "data", "idCampus", "nomeCampus", "horaInicio", "horaFim",
                "idTipoSala", "nomeTipoSala", "faixasCapacidade",
                "faixaCapacidadeInicio", "faixaCapacidadeFim",
                "faixaCapacidadeLabel", "quantidade", "salasDisponiveisReserva",
                "idSalaReserva",
            ]:
                sessao.pop(chave, None)

            sessao["step"] = "data"
            return self.resposta_calendario(db)

        if acao == "CAMPUS":
            if not sessao.get("data"):
                sessao["step"] = "data"
                return self.resposta_calendario(db)

            for chave in [
                "idCampus", "nomeCampus", "horaInicio", "horaFim",
                "idTipoSala", "nomeTipoSala", "faixasCapacidade",
                "faixaCapacidadeInicio", "faixaCapacidadeFim",
                "faixaCapacidadeLabel", "quantidade", "salasDisponiveisReserva",
                "idSalaReserva",
            ]:
                sessao.pop(chave, None)

            sessao["step"] = "campus"
            return self.resposta_campus(db, sessao)

        if acao == "HORARIO":
            if not sessao.get("idCampus"):
                sessao["step"] = "campus"
                return self.resposta_campus(db, sessao)

            for chave in [
                "horaInicio", "horaFim", "idTipoSala", "nomeTipoSala",
                "faixasCapacidade", "faixaCapacidadeInicio", "faixaCapacidadeFim",
                "faixaCapacidadeLabel", "quantidade", "salasDisponiveisReserva",
                "idSalaReserva",
            ]:
                sessao.pop(chave, None)

            sessao["step"] = "horario_inicio"
            return self.resposta_horario_inicio(db, sessao)

        if acao == "TIPO":
            if not sessao.get("horaInicio") or not sessao.get("horaFim"):
                sessao["step"] = "horario_inicio"
                return self.resposta_horario_inicio(db, sessao)

            for chave in [
                "idTipoSala", "nomeTipoSala", "faixasCapacidade",
                "faixaCapacidadeInicio", "faixaCapacidadeFim",
                "faixaCapacidadeLabel", "quantidade", "salasDisponiveisReserva",
                "idSalaReserva",
            ]:
                sessao.pop(chave, None)

            sessao["step"] = "tipo_sala"
            return self.resposta_tipo_sala(db, sessao)

        if acao == "SALA":
            sessao.pop("idSalaReserva", None)
            salas = self.get_salas_disponiveis_filtradas(db, sessao)

            if not salas:
                sessao["step"] = "tipo_sala"
                return self.montar_resposta_ajuste_fluxo(
                    "Não encontrei outra sala disponível com esses dados. Escolha uma alternativa para continuar.",
                    self.opcoes_ajuste_tipo_horario_data(),
                )

            sessao["salasDisponiveisReserva"] = [sala.idSala for sala in salas]
            sessao["step"] = "escolher_sala"
            return {
                "resposta": (
                    f"Encontrei {len(salas)} sala(s) disponível(is) com os dados atuais.\\n\\n"
                    "Escolha uma das opções abaixo para continuar."
                ),
                "tipoInteracao": "lista-salas",
                "salas": [
                    self.montar_card_sala(db, sala, indice)
                    for indice, sala in enumerate(salas, start=1)
                ],
            }

        return None

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
            self.registrar_abandono_se_precisar(
                db=db,
                session_id=session_id,
                id_usuario=id_usuario,
                request=request,
                motivo="Usuário digitou menu/voltar antes de concluir o fluxo",
            )

            sessoes[session_id] = {"step": "menu"}
            return self.menu(db=db, id_usuario=id_usuario)

        if session_id not in sessoes:
            sessoes[session_id] = {"step": "menu"}

        sessao = sessoes[session_id]
        step = sessao.get("step", "menu")

        resposta_ajuste = self.processar_ajuste_fluxo(
            mensagem=mensagem,
            sessao=sessao,
            db=db,
        )

        if resposta_ajuste is not None:
            return resposta_ajuste

        if step == "menu":
            if mensagem == "1":
                sessao.clear()
                return self.iniciar_fluxo_reserva(
                    db=db,
                    sessao=sessao,
                    id_usuario=id_usuario,
                )

            if mensagem == "2":
                if not self.usuario_tem_reservas_cancelaveis(
                    db=db,
                    id_usuario=id_usuario,
                ):
                    sessao["step"] = "menu"
                    return {
                        "resposta": (
                            "Não existe nenhuma reserva pendente ou aprovada disponível para cancelar.\n\n"
                            "Digite menu para voltar ao início ou escolha a opção 1 para fazer uma reserva."
                        )
                    }

                return self.listar_reservas_cancelaveis_usuario(
                    db=db,
                    sessao=sessao,
                    id_usuario=id_usuario,
                )

            if mensagem == "3":
                if not self.usuario_tem_reservas_para_confirmar(
                    db=db,
                    id_usuario=id_usuario,
                ):
                    sessao["step"] = "menu"
                    return {
                        "resposta": (
                            "Não existe nenhuma reserva pendente disponível para confirmar.\n\n"
                            "Digite menu para voltar ao início."
                        )
                    }

                return self.listar_reservas_para_confirmacao(
                    db=db,
                    sessao=sessao,
                    id_usuario=id_usuario,
                )

            return self.menu(db=db, id_usuario=id_usuario)

        if step == "instituicao":
            return self.etapa_instituicao(mensagem, sessao, db)

        if step == "curso_reserva":
            return self.etapa_curso_reserva(mensagem, sessao, db)

        if step == "data":
            return self.etapa_data(mensagem, sessao, db)

        if step == "campus":
            return self.etapa_campus(mensagem, sessao, db)

        if step == "horario_inicio":
            return self.etapa_horario_inicio(mensagem, sessao, db)

        if step == "horario_fim":
            return self.etapa_horario_fim(mensagem, sessao, db)

        if step == "tipo_sala":
            return self.etapa_tipo_sala(mensagem, sessao, db)

        if step == "faixa_capacidade":
            return self.etapa_faixa_capacidade(mensagem, sessao, db)

        if step == "quantidade":
            return self.etapa_quantidade(mensagem, sessao, db)

        if step == "escolher_sala":
            return self.etapa_escolher_sala(mensagem, sessao, db)

        if step == "confirmar_criacao":
            return self.etapa_confirmar_criacao(mensagem, sessao, db, id_usuario)

        if step == "reservar_outra_sala":
            return self.etapa_reservar_outra_sala(
                mensagem=mensagem,
                sessao=sessao,
                db=db,
                id_usuario=id_usuario,
            )

        if step == "cancelar_escolher_reserva":
            return self.etapa_cancelar_escolher_reserva(mensagem, sessao, db)

        if step == "cancelar_confirmacao":
            return self.etapa_cancelar_confirmacao(mensagem, sessao, db)

        if step == "confirmar_escolher_reserva":
            return self.etapa_confirmar_escolher_reserva(mensagem, sessao, db)

        if step == "confirmar_id_reserva":
            return self.etapa_confirmar_id_reserva(mensagem, sessao, db)

        if step == "confirmar_confirmacao":
            return self.etapa_confirmar_confirmacao(mensagem, sessao, db)

        sessoes[session_id] = {"step": "menu"}
        return self.menu(db=db, id_usuario=id_usuario)

    def iniciar_fluxo_reserva(
        self,
        db: Session,
        sessao: Dict[str, Any],
        id_usuario: int | None,
    ):
        cursos_usuario = self.get_cursos_usuario_para_reserva(db, id_usuario)

        if len(cursos_usuario) == 1:
            curso = cursos_usuario[0]
            sessao["idCursoReserva"] = curso.idCurso
            sessao["cursoUsuarioReserva"] = curso.curso.nome if curso.curso else None

        if len(cursos_usuario) > 1:
            sessao["cursosReserva"] = [curso.idCurso for curso in cursos_usuario]
            sessao["cursosReservaOpcoes"] = [
                {
                    "idCurso": curso.idCurso,
                    "nomeCurso": curso.curso.nome
                    if curso.curso
                    else f"Curso #{curso.idCurso}",
                }
                for curso in cursos_usuario
            ]

        sessao["step"] = "instituicao"
        return self.resposta_instituicao(db, sessao)

    def resposta_instituicao(self, db: Session, sessao: Dict[str, Any]):
        instituicoes = db.query(Instituicao).order_by(Instituicao.nome.asc()).all()

        if not instituicoes:
            sessao["step"] = "menu"
            return {
                "resposta": (
                    "Não encontrei nenhuma instituição cadastrada no banco.\n\n"
                    "Cadastre uma instituição antes de iniciar uma reserva."
                )
            }

        return {
            "resposta": (
                "Para iniciar a reserva, escolha a instituição/universidade.\n\n"
                "Depois disso, vou mostrar o calendário e somente os campi vinculados à instituição escolhida."
            ),
            "tipoInteracao": "instituicoes",
            "instituicoes": [
                {
                    "idInstituicao": instituicao.id,
                    "nome": instituicao.nome,
                    "valor": f"INSTITUICAO:{instituicao.id}",
                }
                for instituicao in instituicoes
            ],
            "opcoes": [
                {"label": instituicao.nome, "valor": f"INSTITUICAO:{instituicao.id}"}
                for instituicao in instituicoes
            ],
        }

    def etapa_instituicao(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        if not mensagem.startswith("INSTITUICAO:"):
            return self.resposta_instituicao(db, sessao)

        try:
            id_instituicao = int(mensagem.replace("INSTITUICAO:", ""))
        except ValueError:
            return self.resposta_instituicao(db, sessao)

        instituicao = (
            db.query(Instituicao)
            .filter(Instituicao.id == id_instituicao)
            .first()
        )

        if not instituicao:
            return self.resposta_instituicao(db, sessao)

        sessao["idInstituicaoReserva"] = instituicao.id
        sessao["nomeInstituicaoReserva"] = instituicao.nome

        if sessao.get("cursosReservaOpcoes"):
            sessao["step"] = "curso_reserva"
            return self.resposta_curso_reserva(db, sessao)

        sessao["step"] = "data"
        return self.resposta_calendario(db)

    def resposta_curso_reserva(self, db: Session, sessao: Dict[str, Any]):
        cursos_usuario = sessao.get("cursosReservaOpcoes", [])

        opcoes = [
            {
                "label": curso.get("nomeCurso") or f"Curso #{curso.get('idCurso')}",
                "valor": f"CURSO_RESERVA:{curso.get('idCurso')}",
            }
            for curso in cursos_usuario
        ]

        return {
            "resposta": (
                "Instituição selecionada. Agora informe para qual curso será esta reserva.\n\n"
                "Selecione um dos cursos vinculados ao seu usuário."
            ),
            "tipoInteracao": "botoes",
            "opcoes": opcoes,
        }

    def etapa_curso_reserva(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
    ):
        if not mensagem.startswith("CURSO_RESERVA:"):
            return self.resposta_curso_reserva(db, sessao)

        try:
            id_curso = int(mensagem.replace("CURSO_RESERVA:", ""))
        except ValueError:
            return self.resposta_curso_reserva(db, sessao)

        ids_permitidos = sessao.get("cursosReserva", [])

        if id_curso not in ids_permitidos:
            return self.resposta_curso_reserva(db, sessao)

        curso_opcao = next(
            (
                curso
                for curso in sessao.get("cursosReservaOpcoes", [])
                if int(curso.get("idCurso")) == id_curso
            ),
            None,
        )

        sessao["idCursoReserva"] = id_curso
        sessao["cursoUsuarioReserva"] = (
            curso_opcao.get("nomeCurso") if curso_opcao else f"Curso #{id_curso}"
        )
        sessao["step"] = "data"

        return self.resposta_calendario(db)

    def esta_em_ferias_academicas(self, dia: date):
        return dia.month in {1, 7}

    def get_motivo_indisponivel_data(self, db: Session, dia: date):
        if dia.weekday() == 6:
            return "Domingo indisponível para reserva."

        if self.esta_em_ferias_academicas(dia):
            if dia.month == 1:
                return "Período de férias acadêmicas de janeiro."

            return "Período de férias acadêmicas de julho."

        if not self.dia_tem_alguma_sala_disponivel(db, dia):
            return "Não há salas disponíveis nesta data."

        return None

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

            motivo_indisponivel = self.get_motivo_indisponivel_data(db, data_atual)

            mapa_meses[chave_mes]["dias"].append(
                {
                    "dataIso": data_atual.isoformat(),
                    "dataBr": self.formatar_data_br(data_atual.isoformat()),
                    "dia": data_atual.day,
                    "mes": data_atual.month,
                    "ano": data_atual.year,
                    "diaSemana": data_atual.weekday(),
                    "disponivel": motivo_indisponivel is None,
                    "motivoIndisponivel": motivo_indisponivel
                    or "Disponível para reserva.",
                }
            )

            data_atual += timedelta(days=1)

        meses = list(mapa_meses.values())

        return {
            "resposta": (
                "Escolha a data da reserva no calendário.\n\n"
                "Os dias em cinza estão indisponíveis. "
                "Todos os domingos ficam bloqueados. "
                "Janeiro e julho ficam bloqueados por férias acadêmicas. "
                "O calendário considera o semestre letivo de fevereiro a junho e de agosto a dezembro."
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

        motivo_indisponivel = self.get_motivo_indisponivel_data(db, data_obj)

        if motivo_indisponivel:
            sessao["step"] = "data"
            return self.montar_resposta_ajuste_fluxo(
                (
                    "Essa data está indisponível para reserva.\n"
                    f"Motivo: {motivo_indisponivel}\n\n"
                    "Escolha uma das opções abaixo para continuar."
                ),
                self.opcoes_ajuste_data_instituicao(),
            )

        sessao["data"] = data_iso
        sessao["step"] = "campus"

        return self.resposta_campus(db, sessao)

    def resposta_campus(self, db: Session, sessao: Dict[str, Any]):
        campi_status = self.get_campi_com_status(db, sessao)
        campi_disponiveis = [campus for campus in campi_status if campus["disponivel"]]
        nome_instituicao = sessao.get("nomeInstituicaoReserva", "instituição selecionada")

        if not campi_status:
            sessao["step"] = "data"
            return {
                "resposta": (
                    f"Não encontrei nenhum campus cadastrado para {nome_instituicao}.\n\n"
                    "Escolha outra instituição ou cadastre campi antes de continuar."
                )
            }

        if not campi_disponiveis:
            sessao["step"] = "campus"
            return self.montar_resposta_ajuste_fluxo(
                (
                    f"Para {self.formatar_data_br(sessao['data'])}, não há salas disponíveis em nenhum campus de {nome_instituicao}.\n\n"
                    "Você pode escolher outra data ou trocar a instituição."
                ),
                self.opcoes_ajuste_data_instituicao(),
            )

        return {
            "resposta": (
                f"Para {self.formatar_data_br(sessao['data'])}, estes são os campi de {nome_instituicao}.\n\n"
                "Escolha um campus disponível para continuar:"
            ),
            "tipoInteracao": "campi",
            "campi": campi_status,
            "opcoes": [
                {"label": campus["nome"], "valor": f"CAMPUS:{campus['id']}"}
                for campus in campi_disponiveis
            ],
        }

    def etapa_campus(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        if not mensagem.startswith("CAMPUS:"):
            return self.resposta_campus(db, sessao)

        try:
            id_campus = int(mensagem.replace("CAMPUS:", ""))
        except ValueError:
            return self.resposta_campus(db, sessao)

        campus = db.query(Campus).filter(Campus.id == id_campus).first()

        if not campus:
            return self.resposta_campus(db, sessao)

        disponivel, motivo = self.campus_tem_disponibilidade_na_data(
            db=db,
            id_campus=id_campus,
            data=sessao["data"],
        )

        if not disponivel:
            return {
                "resposta": (
                    f"O campus {campus.nome} está indisponível para "
                    f"{self.formatar_data_br(sessao['data'])}.\n"
                    f"Motivo: {motivo}\n\n"
                    "Escolha outro campus disponível."
                ),
                **self.resposta_campus(db, sessao),
            }

        sessao["idCampus"] = id_campus
        sessao["nomeCampus"] = campus.nome
        sessao["step"] = "horario_inicio"

        return self.resposta_horario_inicio(db, sessao)

    def resposta_horario_inicio(self, db: Session, sessao: Dict[str, Any]):
        return {
            "resposta": (
                f"No campus {sessao['nomeCampus']}, ainda temos salas livres em "
                f"{self.formatar_data_br(sessao['data'])}.\n\n"
                f"{self.montar_resumo_dados_informados(sessao)}\n\n"
                "Agora informe o horário de início da reserva.\n"
                "Digite no formato HH:MM. Exemplo: 08:00\n\n"
                "Horário permitido: 08:00 até 22:30."
            ),
            "tipoInteracao": "horario-manual",
            "campoHorario": "inicio",
            "placeholder": "Ex: 08:00",
            "horarios": self.montar_horarios_inicio_disponiveis(db, sessao),
        }

    def resposta_horario_fim(self, db: Session, sessao: Dict[str, Any]):
        return {
            "resposta": (
                f"{self.montar_resumo_dados_informados(sessao)}\n\n"
                "Agora informe o horário de término da reserva.\n"
                "Digite no formato HH:MM. Exemplo: 10:30\n\n"
                "O horário final precisa ser maior que o horário inicial e no máximo 22:30."
            ),
            "tipoInteracao": "horario-manual",
            "campoHorario": "fim",
            "placeholder": "Ex: 10:30",
            "horarios": self.montar_horarios_fim_disponiveis(db, sessao),
        }

    def etapa_horario_inicio(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        horario = self.normalizar_horario_digitado(mensagem)

        if not horario:
            return {
                "resposta": (
                    "Horário inicial inválido. Digite no formato HH:MM.\n\n"
                    "Exemplo: 08:00"
                ),
                **self.resposta_horario_inicio(db, sessao),
            }

        if not self.horario_dentro_do_periodo_permitido(horario):
            return {
                "resposta": (
                    "Horário inicial fora do período permitido.\n"
                    "Use um horário entre 08:00 e 22:30."
                ),
                **self.resposta_horario_inicio(db, sessao),
            }

        sessao["horaInicio"] = horario
        sessao["step"] = "horario_fim"

        return self.resposta_horario_fim(db, sessao)

    def etapa_horario_fim(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        horario = self.normalizar_horario_digitado(mensagem)

        if not horario:
            return {
                "resposta": (
                    "Horário final inválido. Digite no formato HH:MM.\n\n"
                    "Exemplo: 10:30"
                ),
                **self.resposta_horario_fim(db, sessao),
            }

        if not self.horario_dentro_do_periodo_permitido(horario):
            return {
                "resposta": (
                    "Horário final fora do período permitido.\n"
                    "Use um horário entre 08:00 e 22:30."
                ),
                **self.resposta_horario_fim(db, sessao),
            }

        hora_inicio = sessao.get("horaInicio")

        if not hora_inicio:
            sessao["step"] = "horario_inicio"
            return self.resposta_horario_inicio(db, sessao)

        if self.minutos_do_dia(horario) <= self.minutos_do_dia(hora_inicio):
            return {
                "resposta": (
                    "O horário final precisa ser maior que o horário inicial.\n\n"
                    f"Horário inicial informado: {hora_inicio}\n"
                    "Digite novamente o horário final. Exemplo: 10:30"
                ),
                **self.resposta_horario_fim(db, sessao),
            }

        sessao["horaFim"] = horario

        if not self.existem_salas_para_filtros(db, sessao):
            sessao.pop("horaInicio", None)
            sessao.pop("horaFim", None)
            sessao["step"] = "horario_inicio"

            return self.montar_resposta_ajuste_fluxo(
                (
                    "Não encontrei salas disponíveis nesse campus, data e horário.\n\n"
                    "Escolha uma das opções abaixo para continuar."
                ),
                self.opcoes_ajuste_horario_data_campus(),
            )

        sessao["step"] = "tipo_sala"
        return self.resposta_tipo_sala(db, sessao)

    def resposta_tipo_sala(self, db: Session, sessao: Dict[str, Any]):
        tipos = self.get_tipos_disponiveis(db, sessao)

        if not tipos:
            sessao["step"] = "horario_inicio"
            return self.montar_resposta_ajuste_fluxo(
                (
                    "Não encontrei tipos de sala disponíveis para os dados informados.\n\n"
                    "Escolha uma das opções abaixo para continuar."
                ),
                self.opcoes_ajuste_horario_data_campus(),
            )

        return {
            "resposta": (
                f"{self.montar_resumo_dados_informados(sessao)}\n\n"
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

        try:
            id_tipo_sala = int(mensagem.replace("TIPO_SALA:", ""))
        except ValueError:
            return self.resposta_tipo_sala(db, sessao)

        tipo = db.query(TipoSala).filter(TipoSala.id == id_tipo_sala).first()

        if not tipo:
            return self.resposta_tipo_sala(db, sessao)

        sessao["idTipoSala"] = id_tipo_sala
        sessao["nomeTipoSala"] = tipo.nome
        sessao["step"] = "faixa_capacidade"

        return self.resposta_faixa_capacidade(db, sessao)

    def resposta_faixa_capacidade(self, db: Session, sessao: Dict[str, Any]):
        faixas = self.get_faixas_capacidade_disponiveis(db, sessao)

        if not faixas:
            sessao["step"] = "tipo_sala"
            return self.montar_resposta_ajuste_fluxo(
                (
                    f"Não encontrei faixas de capacidade disponíveis para "
                    f"{sessao.get('nomeTipoSala', 'esse tipo de sala')} "
                    "com os dados informados.\n\n"
                    "Escolha uma das opções abaixo para continuar."
                ),
                self.opcoes_ajuste_tipo_horario_data(),
            )

        sessao["faixasCapacidade"] = faixas

        return {
            "resposta": (
                f"{self.montar_resumo_dados_informados(sessao)}\n\n"
                f"Ótimo. Para {sessao.get('nomeTipoSala', 'esse tipo de sala')}, encontrei salas disponíveis.\n\n"
                "Agora escolha a faixa de capacidade da turma.\n"
                "As faixas abaixo foram montadas automaticamente com base somente nas salas disponíveis para os filtros informados."
            ),
            "tipoInteracao": "faixas-capacidade",
            "faixasCapacidade": faixas,
        }

    def etapa_faixa_capacidade(self, mensagem: str, sessao: Dict[str, Any], db: Session):
        if not mensagem.startswith("FAIXA_CAPACIDADE:"):
            return self.resposta_faixa_capacidade(db, sessao)

        try:
            payload = mensagem.replace("FAIXA_CAPACIDADE:", "").strip()

            if ":" in payload:
                inicio_texto, fim_texto = payload.split(":", 1)
            elif "-" in payload:
                inicio_texto, fim_texto = payload.split("-", 1)
            else:
                return self.resposta_faixa_capacidade(db, sessao)

            faixa_inicio = int(inicio_texto)
            faixa_fim = int(fim_texto)
        except ValueError:
            return self.resposta_faixa_capacidade(db, sessao)

        faixas = self.get_faixas_capacidade_disponiveis(db, sessao)
        faixa_escolhida = next(
            (
                faixa
                for faixa in faixas
                if int(faixa["inicio"]) == faixa_inicio
                and int(faixa["fim"]) == faixa_fim
            ),
            None,
        )

        if not faixa_escolhida:
            return self.montar_resposta_ajuste_fluxo(
                (
                    "Essa faixa não está mais disponível para os dados informados.\n\n"
                    "Escolha uma das opções abaixo para continuar."
                ),
                self.opcoes_ajuste_tipo_horario_data(),
            )

        sessao["faixaCapacidadeInicio"] = faixa_inicio
        sessao["faixaCapacidadeFim"] = faixa_fim
        sessao["faixaCapacidadeLabel"] = faixa_escolhida["label"]
        sessao["quantidade"] = faixa_fim

        salas = self.get_salas_disponiveis_filtradas(db, sessao)

        if not salas:
            sessao.pop("faixaCapacidadeInicio", None)
            sessao.pop("faixaCapacidadeFim", None)
            sessao.pop("faixaCapacidadeLabel", None)
            sessao.pop("quantidade", None)
            sessao["step"] = "tipo_sala"

            return self.montar_resposta_ajuste_fluxo(
                (
                    "Não encontrei salas disponíveis nessa faixa de capacidade.\n\n"
                    "Escolha uma das opções abaixo para continuar."
                ),
                self.opcoes_ajuste_tipo_horario_data(),
            )

        sessao["salasDisponiveisReserva"] = [sala.idSala for sala in salas]
        sessao["step"] = "escolher_sala"

        return {
            "resposta": (
                f"{self.montar_resumo_dados_informados(sessao)}\n\n"
                f"Encontrei {len(salas)} sala(s) disponível(is) na faixa {faixa_escolhida['label']}.\n\n"
                "Escolha uma das opções abaixo para continuar com a reserva."
            ),
            "tipoInteracao": "lista-salas",
            "salas": [
                self.montar_card_sala(db, sala, indice)
                for indice, sala in enumerate(salas, start=1)
            ],
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
                    "Você pode digitar menu para recomeçar e tentar outra data, campus, horário ou tipo de sala."
                )
            }

        sessao["salasDisponiveisReserva"] = [sala.idSala for sala in salas]
        sessao["step"] = "escolher_sala"

        return {
            "resposta": (
                f"{self.montar_resumo_dados_informados(sessao)}\n\n"
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
                f"{self.montar_resumo_dados_informados(sessao)}\n"
                f"Sala: {sala.nome} | nº {sala.numero}\n\n"
                "Deseja criar esta reserva?"
            ),
            "tipoInteracao": "confirmacao",
            "opcoes": [
                {"label": "Sim, criar reserva", "valor": "sim"},
                {"label": "Não, cancelar", "valor": "nao"},
            ],
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
            return {
                "resposta": "Escolha uma opção para continuar.",
                "tipoInteracao": "confirmacao",
                "opcoes": [
                    {"label": "Sim, criar reserva", "valor": "sim"},
                    {"label": "Não, cancelar", "valor": "nao"},
                ],
            }

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

        conflito = self.buscar_conflito_sala(
            db=db,
            id_sala=id_sala,
            inicio_novo=inicio,
            fim_novo=fim,
        )

        if conflito:
            self.limpar_fluxo_reserva(sessao)
            sessao["step"] = "menu"
            return {
                "resposta": (
                    "Essa sala ficou indisponível antes da confirmação.\n\n"
                    f"Conflito encontrado com a reserva #{conflito.idReserva}: "
                    f"{self.formatar_data_br(conflito.dataInicio)} das "
                    f"{conflito.horaInicio} às {conflito.horaFim}.\n\n"
                    "Digite menu e tente novamente com outro horário ou outra sala."
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
            idCursoReserva=sessao.get("idCursoReserva"),
            cursoUsuarioReserva=sessao.get("cursoUsuarioReserva"),
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

        self.enviar_email_reserva_pendente_chatbot(
            db=db,
            reserva=nova_reserva,
        )

        reservas_criadas = sessao.get("reservasCriadasFluxo", [])

        if nova_reserva.idReserva not in reservas_criadas:
            reservas_criadas.append(nova_reserva.idReserva)

        self.limpar_fluxo_reserva(sessao)
        sessao["reservasCriadasFluxo"] = reservas_criadas
        sessao["step"] = "reservar_outra_sala"

        return {
            "resposta": (
                "Reserva criada com sucesso no banco de dados!\n\n"
                f"{self.montar_texto_reserva(db, nova_reserva)}\n\n"
                "Ela foi criada como Pendente e aguarda aprovação.\n\n"
                "Deseja reservar outra sala?"
            ),
            "tipoInteracao": "confirmacao",
            "opcoes": [
                {"label": "Sim, reservar outra sala", "valor": "sim"},
                {"label": "Não, finalizar", "valor": "nao"},
            ],
        }

    def etapa_reservar_outra_sala(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
        id_usuario: int | None,
    ):
        resposta = str(mensagem or "").strip().lower()

        if resposta not in {"sim", "s", "não", "nao", "n"}:
            return {
                "resposta": "Deseja reservar outra sala?",
                "tipoInteracao": "confirmacao",
                "opcoes": [
                    {"label": "Sim, reservar outra sala", "valor": "sim"},
                    {"label": "Não, finalizar", "valor": "nao"},
                ],
            }

        reservas_criadas = sessao.get("reservasCriadasFluxo", [])

        if resposta in {"sim", "s"}:
            sessao.clear()
            sessao["reservasCriadasFluxo"] = reservas_criadas
            return self.iniciar_fluxo_reserva(
                db=db,
                sessao=sessao,
                id_usuario=id_usuario,
            )

        reservas = []

        if reservas_criadas:
            reservas = (
                db.query(Reserva)
                .filter(Reserva.idReserva.in_(reservas_criadas))
                .order_by(Reserva.idReserva.asc())
                .all()
            )

        texto_reservas = ""

        if reservas:
            texto_reservas = "\n\n".join(
                self.montar_texto_reserva(db, reserva) for reserva in reservas
            )
        else:
            texto_reservas = "Nenhuma reserva encontrada nesta sessão."

        sessao.clear()
        sessao["step"] = "menu"

        return {
            "resposta": (
                "Obrigado por utilizar o SIGSAS!\n\n"
                "Estas foram as reservas realizadas nesta sessão:\n\n"
                f"{texto_reservas}\n\n"
                "Quando precisar, digite menu para voltar ao início."
            )
        }

    def montar_card_reserva_interacao(self, db: Session, reserva: Reserva, indice: int):
        return {
            "numeroLista": indice,
            "idReserva": reserva.idReserva,
            "sala": self.get_nome_sala(db, reserva.idSala),
            "solicitante": reserva.nomeUsuarioReserva or "Não informado",
            "matricula": reserva.matriculaUsuarioReserva or "Não informada",
            "cargo": reserva.cargoUsuarioReserva or "Não informado",
            "instituicao": reserva.instituicaoUsuarioReserva or "Não informada",
            "curso": reserva.cursoUsuarioReserva or "Não informado",
            "status": STATUS_RESERVA.get(reserva.idStatusReserva, "Desconhecido"),
            "data": self.formatar_data_br(reserva.dataInicio),
            "horaInicio": reserva.horaInicio,
            "horaFim": reserva.horaFim,
            "motivo": reserva.motivo,
            "pessoas": reserva.qtdPessoas,
            "texto": self.montar_texto_reserva(db, reserva),
        }

    def extrair_ids_reservas_mensagem(self, mensagem: str):
        texto = str(mensagem or "").strip()

        if texto.upper().startswith("RESERVAS:"):
            texto = texto.split(":", 1)[1]

        ids = []

        for parte in texto.replace(";", ",").split(","):
            parte = parte.strip()

            if not parte:
                continue

            try:
                id_reserva = int(parte)
            except ValueError:
                continue

            if id_reserva not in ids:
                ids.append(id_reserva)

        return ids

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

        usuario = self.get_usuario_logado(db, id_usuario)
        perfil = self.normalizar_perfil(usuario.perfil) if usuario else None

        query = db.query(Reserva).filter(Reserva.idStatusReserva.in_([1, 2]))

        if perfil != "Administrador":
            query = query.filter(Reserva.idUsuarioReserva == id_usuario)

        reservas = query.order_by(Reserva.dataInicio.asc(), Reserva.horaInicio.asc()).all()

        if not reservas:
            sessao["step"] = "menu"

            if perfil == "Administrador":
                return {
                    "resposta": "Não existe nenhuma reserva pendente ou aprovada disponível para cancelar."
                }

            return {
                "resposta": "Você não possui reservas pendentes ou aprovadas para cancelar."
            }

        if len(reservas) == 1:
            reserva = reservas[0]
            sessao["idReservaCancelar"] = reserva.idReserva
            sessao["idsReservasCancelar"] = [reserva.idReserva]
            sessao["step"] = "cancelar_confirmacao"

            return {
                "resposta": (
                    "Encontrei somente uma reserva disponível para cancelamento:\n\n"
                    f"{self.montar_texto_reserva(db, reserva)}\n\n"
                    "Deseja cancelar esta reserva?"
                ),
                "tipoInteracao": "confirmacao",
                "opcoes": [
                    {"label": "Sim, cancelar", "valor": "sim"},
                    {"label": "Não, voltar", "valor": "nao"},
                ],
            }

        sessao["reservasCancelamento"] = [r.idReserva for r in reservas]
        sessao["step"] = "cancelar_escolher_reserva"

        return {
            "resposta": (
                "Estas são as reservas que podem ser canceladas.\n\n"
                "Selecione uma ou mais reservas e confirme para continuar."
            ),
            "tipoInteracao": "checkbox-reservas",
            "acaoReservas": "cancelar",
            "textoBotaoReservas": "Cancelar reservas selecionadas",
            "reservas": [
                self.montar_card_reserva_interacao(db, reserva, indice)
                for indice, reserva in enumerate(reservas, start=1)
            ],
        }

    def etapa_cancelar_escolher_reserva(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
    ):
        ids_permitidos = sessao.get("reservasCancelamento", [])
        ids_recebidos = self.extrair_ids_reservas_mensagem(mensagem)

        if not ids_recebidos:
            try:
                indice = int(mensagem)
            except ValueError:
                return {"resposta": "Selecione pelo menos uma reserva para cancelar."}

            if indice < 1 or indice > len(ids_permitidos):
                return {"resposta": f"Digite um número entre 1 e {len(ids_permitidos)}."}

            ids_recebidos = [ids_permitidos[indice - 1]]

        ids_validos = [
            id_reserva for id_reserva in ids_recebidos if id_reserva in ids_permitidos
        ]

        if not ids_validos:
            return {"resposta": "Nenhuma reserva selecionada é válida para cancelamento."}

        reservas = (
            db.query(Reserva)
            .filter(Reserva.idReserva.in_(ids_validos))
            .order_by(Reserva.dataInicio.asc(), Reserva.horaInicio.asc())
            .all()
        )

        if not reservas:
            sessao["step"] = "menu"
            return {"resposta": "Reservas não encontradas."}

        sessao["idsReservasCancelar"] = [reserva.idReserva for reserva in reservas]
        sessao["idReservaCancelar"] = (
            reservas[0].idReserva if len(reservas) == 1 else None
        )
        sessao["step"] = "cancelar_confirmacao"

        texto_reservas = "\n\n".join(
            self.montar_texto_reserva(db, reserva) for reserva in reservas
        )

        return {
            "resposta": (
                "Confira as reservas selecionadas para cancelamento:\n\n"
                f"{texto_reservas}\n\n"
                "Deseja cancelar as reservas selecionadas?"
            ),
            "tipoInteracao": "confirmacao",
            "opcoes": [
                {"label": "Sim, cancelar", "valor": "sim"},
                {"label": "Não, voltar", "valor": "nao"},
            ],
        }

    def etapa_cancelar_confirmacao(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
    ):
        resposta = mensagem.lower().strip()

        if resposta not in {"sim", "s", "não", "nao", "n"}:
            return {
                "resposta": "Escolha uma opção para continuar.",
                "tipoInteracao": "confirmacao",
                "opcoes": [
                    {"label": "Sim, cancelar", "valor": "sim"},
                    {"label": "Não, voltar", "valor": "nao"},
                ],
            }

        if resposta in {"não", "nao", "n"}:
            sessao["step"] = "menu"
            sessao.pop("idReservaCancelar", None)
            sessao.pop("idsReservasCancelar", None)
            sessao.pop("reservasCancelamento", None)
            return {"resposta": "Cancelamento interrompido."}

        ids_cancelar = sessao.get("idsReservasCancelar") or []

        if not ids_cancelar and sessao.get("idReservaCancelar"):
            ids_cancelar = [sessao.get("idReservaCancelar")]

        if not ids_cancelar:
            sessao["step"] = "menu"
            return {"resposta": "Nenhuma reserva foi selecionada para cancelamento."}

        reservas = (
            db.query(Reserva)
            .filter(Reserva.idReserva.in_(ids_cancelar))
            .all()
        )

        if not reservas:
            sessao["step"] = "menu"
            return {"resposta": "Reservas não encontradas."}

        for reserva in reservas:
            reserva.idStatusReserva = 4
            reserva.justificativa = "Cancelada pelo chatbot"

        db.commit()

        for reserva in reservas:
            db.refresh(reserva)

        for reserva in reservas:
            self.enviar_email_reserva_cancelada_chatbot(
                db=db,
                reserva=reserva,
            )

        sessao["step"] = "menu"
        sessao.pop("idReservaCancelar", None)
        sessao.pop("idsReservasCancelar", None)
        sessao.pop("reservasCancelamento", None)

        texto_reservas = "\n\n".join(
            self.montar_texto_reserva(db, reserva) for reserva in reservas
        )

        return {
            "resposta": (
                f"{len(reservas)} reserva(s) cancelada(s) com sucesso no banco de dados.\n\n"
                f"{texto_reservas}"
            )
        }

    def listar_reservas_para_confirmacao(
        self,
        db: Session,
        sessao: Dict[str, Any],
        id_usuario: int | None,
    ):
        reservas = self.get_reservas_pendentes_para_confirmar(
            db=db,
            id_usuario=id_usuario,
        )

        if not reservas:
            sessao["step"] = "menu"
            return {
                "resposta": "Não existe nenhuma reserva pendente disponível para confirmar."
            }

        if len(reservas) == 1:
            reserva = reservas[0]
            sessao["idReservaConfirmar"] = reserva.idReserva
            sessao["idsReservasConfirmar"] = [reserva.idReserva]
            sessao["step"] = "confirmar_confirmacao"

            return {
                "resposta": (
                    "Encontrei somente uma reserva pendente para confirmação:\n\n"
                    f"{self.montar_texto_reserva(db, reserva)}\n\n"
                    "Deseja confirmar/aprovar esta reserva?"
                ),
                "tipoInteracao": "confirmacao",
                "opcoes": [
                    {"label": "Sim, confirmar", "valor": "sim"},
                    {"label": "Não, voltar", "valor": "nao"},
                ],
            }

        sessao["reservasConfirmacao"] = [reserva.idReserva for reserva in reservas]
        sessao["step"] = "confirmar_escolher_reserva"

        return {
            "resposta": (
                "Estas são as reservas pendentes que você pode confirmar.\n\n"
                "Selecione uma ou mais reservas e confirme para continuar."
            ),
            "tipoInteracao": "checkbox-reservas",
            "acaoReservas": "confirmar",
            "textoBotaoReservas": "Confirmar reservas selecionadas",
            "reservas": [
                self.montar_card_reserva_interacao(db, reserva, indice)
                for indice, reserva in enumerate(reservas, start=1)
            ],
        }

    def etapa_confirmar_escolher_reserva(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
    ):
        ids_permitidos = sessao.get("reservasConfirmacao", [])
        ids_recebidos = self.extrair_ids_reservas_mensagem(mensagem)

        if not ids_recebidos:
            try:
                indice = int(mensagem)
            except ValueError:
                return {"resposta": "Selecione pelo menos uma reserva para confirmar."}

            if indice < 1 or indice > len(ids_permitidos):
                return {"resposta": f"Digite um número entre 1 e {len(ids_permitidos)}."}

            ids_recebidos = [ids_permitidos[indice - 1]]

        ids_validos = [
            id_reserva for id_reserva in ids_recebidos if id_reserva in ids_permitidos
        ]

        if not ids_validos:
            return {"resposta": "Nenhuma reserva selecionada é válida para confirmação."}

        reservas = (
            db.query(Reserva)
            .filter(Reserva.idReserva.in_(ids_validos))
            .order_by(Reserva.dataInicio.asc(), Reserva.horaInicio.asc())
            .all()
        )

        if not reservas:
            sessao["step"] = "menu"
            return {"resposta": "Reservas não encontradas."}

        sessao["idsReservasConfirmar"] = [reserva.idReserva for reserva in reservas]
        sessao["idReservaConfirmar"] = (
            reservas[0].idReserva if len(reservas) == 1 else None
        )
        sessao["step"] = "confirmar_confirmacao"

        texto_reservas = "\n\n".join(
            self.montar_texto_reserva(db, reserva) for reserva in reservas
        )

        return {
            "resposta": (
                "Confira as reservas selecionadas para confirmação:\n\n"
                f"{texto_reservas}\n\n"
                "Deseja confirmar/aprovar as reservas selecionadas?"
            ),
            "tipoInteracao": "confirmacao",
            "opcoes": [
                {"label": "Sim, confirmar", "valor": "sim"},
                {"label": "Não, voltar", "valor": "nao"},
            ],
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
                "Deseja confirmar/aprovar esta reserva?"
            ),
            "tipoInteracao": "confirmacao",
            "opcoes": [
                {"label": "Sim, confirmar", "valor": "sim"},
                {"label": "Não, voltar", "valor": "nao"},
            ],
        }

    def etapa_confirmar_confirmacao(
        self,
        mensagem: str,
        sessao: Dict[str, Any],
        db: Session,
    ):
        resposta = mensagem.lower().strip()

        if resposta not in {"sim", "s", "não", "nao", "n"}:
            return {
                "resposta": "Escolha uma opção para continuar.",
                "tipoInteracao": "confirmacao",
                "opcoes": [
                    {"label": "Sim, confirmar", "valor": "sim"},
                    {"label": "Não, voltar", "valor": "nao"},
                ],
            }

        if resposta in {"não", "nao", "n"}:
            sessao["step"] = "menu"
            sessao.pop("idReservaConfirmar", None)
            sessao.pop("idsReservasConfirmar", None)
            sessao.pop("reservasConfirmacao", None)
            return {"resposta": "Confirmação interrompida."}

        ids_confirmar = sessao.get("idsReservasConfirmar") or []

        if not ids_confirmar and sessao.get("idReservaConfirmar"):
            ids_confirmar = [sessao.get("idReservaConfirmar")]

        if not ids_confirmar:
            sessao["step"] = "menu"
            return {"resposta": "Nenhuma reserva foi selecionada para confirmação."}

        reservas = (
            db.query(Reserva)
            .filter(Reserva.idReserva.in_(ids_confirmar))
            .all()
        )

        if not reservas:
            sessao["step"] = "menu"
            return {"resposta": "Reservas não encontradas."}

        for reserva in reservas:
            reserva.idStatusReserva = 2
            reserva.justificativa = "Confirmada pelo chatbot"

        db.commit()

        for reserva in reservas:
            db.refresh(reserva)

        for reserva in reservas:
            self.enviar_email_reserva_aprovada_chatbot(
                db=db,
                reserva=reserva,
            )

        sessao["step"] = "menu"
        sessao.pop("idReservaConfirmar", None)
        sessao.pop("idsReservasConfirmar", None)
        sessao.pop("reservasConfirmacao", None)

        texto_reservas = "\n\n".join(
            self.montar_texto_reserva(db, reserva) for reserva in reservas
        )

        return {
            "resposta": (
                f"{len(reservas)} reserva(s) confirmada(s)/aprovada(s) com sucesso no banco de dados.\n\n"
                f"{texto_reservas}"
            )
        }

    def dia_tem_alguma_sala_disponivel(self, db: Session, dia: date):
        if dia.weekday() == 6 or self.esta_em_ferias_academicas(dia):
            return False

        salas = db.query(Sala).filter(Sala.ativo == True).all()

        for sala in salas:
            for turno in TURNOS.values():
                inicio = self.montar_datetime_reserva(dia.isoformat(), turno["inicio"])
                fim = self.montar_datetime_reserva(dia.isoformat(), turno["fim"])

                if self.sala_esta_disponivel(db, sala.idSala, inicio, fim):
                    return True

        return False

    def campus_tem_disponibilidade_na_data(
        self,
        db: Session,
        id_campus: int,
        data: str,
    ):
        salas = self.get_salas_por_campus(db, id_campus)

        if not salas:
            return False, "Não há salas ativas cadastradas neste campus."

        for sala in salas:
            for turno in TURNOS.values():
                inicio = self.montar_datetime_reserva(data, turno["inicio"])
                fim = self.montar_datetime_reserva(data, turno["fim"])

                if self.sala_esta_disponivel(db, sala.idSala, inicio, fim):
                    return True, "Disponível para reserva."

        return False, "Todas as salas deste campus estão ocupadas nesta data."

    def get_campi_com_status(self, db: Session, sessao: Dict[str, Any]):
        data = sessao["data"]
        query = db.query(Campus)

        if sessao.get("idInstituicaoReserva"):
            query = query.filter(Campus.idInstituicao == sessao["idInstituicaoReserva"])

        campi = query.order_by(Campus.nome.asc()).all()
        resultado = []

        for campus in campi:
            disponivel, motivo = self.campus_tem_disponibilidade_na_data(
                db=db,
                id_campus=campus.id,
                data=data,
            )

            resultado.append(
                {
                    "id": campus.id,
                    "idCampus": campus.id,
                    "idInstituicao": getattr(campus, "idInstituicao", None),
                    "nome": campus.nome,
                    "disponivel": disponivel,
                    "motivo": motivo,
                    "motivoIndisponivel": motivo,
                    "valor": f"CAMPUS:{campus.id}",
                }
            )

        return resultado

    def get_campi_disponiveis(self, db: Session, sessao: Dict[str, Any]):
        campi_status = self.get_campi_com_status(db, sessao)
        ids_disponiveis = [
            campus["id"]
            for campus in campi_status
            if campus["disponivel"]
        ]

        if not ids_disponiveis:
            return []

        return (
            db.query(Campus)
            .filter(Campus.id.in_(ids_disponiveis))
            .order_by(Campus.nome.asc())
            .all()
        )

    def gerar_horarios_intervalo(
        self,
        inicio: str = "08:00",
        fim: str = "22:30",
        intervalo_minutos: int = 15,
    ):
        horarios = []
        minuto_atual = self.minutos_do_dia(inicio)
        minuto_limite = self.minutos_do_dia(fim)

        while minuto_atual <= minuto_limite:
            horas = str(minuto_atual // 60).zfill(2)
            minutos = str(minuto_atual % 60).zfill(2)
            horarios.append(f"{horas}:{minutos}")
            minuto_atual += intervalo_minutos

        return horarios

    def existe_sala_disponivel_no_intervalo(
        self,
        db: Session,
        sessao: Dict[str, Any],
        hora_inicio: str,
        hora_fim: str,
    ):
        id_campus = sessao.get("idCampus")
        data = sessao.get("data")

        if not id_campus or not data:
            return False

        salas = self.get_salas_por_campus(db, int(id_campus))

        if not salas:
            return False

        inicio = self.montar_datetime_reserva(data, hora_inicio)
        fim = self.montar_datetime_reserva(data, hora_fim)

        return any(
            self.sala_esta_disponivel(db, sala.idSala, inicio, fim)
            for sala in salas
        )

    def montar_horarios_inicio_disponiveis(self, db: Session, sessao: Dict[str, Any]):
        horarios = self.gerar_horarios_intervalo("08:00", "22:15", 15)
        resultado = []

        for horario in horarios:
            disponivel = False

            for horario_fim in self.gerar_horarios_intervalo(
                self.formatar_minutos_como_horario(self.minutos_do_dia(horario) + 15),
                "22:30",
                15,
            ):
                if self.existe_sala_disponivel_no_intervalo(
                    db=db,
                    sessao=sessao,
                    hora_inicio=horario,
                    hora_fim=horario_fim,
                ):
                    disponivel = True
                    break

            resultado.append(
                {
                    "horario": horario,
                    "valor": horario,
                    "label": horario,
                    "disponivel": disponivel,
                    "bloqueado": not disponivel,
                    "motivo": "Disponível"
                    if disponivel
                    else "Não há salas livres para iniciar reserva neste horário.",
                }
            )

        return resultado

    def montar_horarios_fim_disponiveis(self, db: Session, sessao: Dict[str, Any]):
        hora_inicio = sessao.get("horaInicio")

        if not hora_inicio:
            return []

        minuto_inicio = self.minutos_do_dia(hora_inicio)
        primeiro_fim = self.formatar_minutos_como_horario(minuto_inicio + 15)
        horarios = self.gerar_horarios_intervalo(primeiro_fim, "22:30", 15)
        resultado = []

        for horario in horarios:
            disponivel = self.existe_sala_disponivel_no_intervalo(
                db=db,
                sessao=sessao,
                hora_inicio=hora_inicio,
                hora_fim=horario,
            )

            resultado.append(
                {
                    "horario": horario,
                    "valor": horario,
                    "label": horario,
                    "disponivel": disponivel,
                    "bloqueado": not disponivel,
                    "motivo": "Disponível"
                    if disponivel
                    else "Não há salas livres para este intervalo.",
                }
            )

        return resultado

    def formatar_minutos_como_horario(self, total_minutos: int):
        horas = str(total_minutos // 60).zfill(2)
        minutos = str(total_minutos % 60).zfill(2)
        return f"{horas}:{minutos}"

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
            if self.sala_esta_disponivel(db, sala.idSala, inicio, fim):
                ids_tipos.add(sala.idTipoSala)

        if not ids_tipos:
            return []

        return (
            db.query(TipoSala)
            .filter(TipoSala.id.in_(list(ids_tipos)))
            .order_by(TipoSala.nome.asc())
            .all()
        )

    def get_capacidades_disponiveis_distintas(self, db: Session, sessao: Dict[str, Any]):
        id_tipo_sala = sessao.get("idTipoSala")

        if not id_tipo_sala:
            return []

        salas = (
            db.query(Sala)
            .join(Edificio, Sala.idEdificio == Edificio.id)
            .filter(
                Sala.ativo == True,
                Edificio.idCampus == sessao["idCampus"],
                Sala.idTipoSala == id_tipo_sala,
            )
            .order_by(Sala.capacidade.asc())
            .all()
        )

        inicio = self.montar_datetime_reserva(sessao["data"], sessao["horaInicio"])
        fim = self.montar_datetime_reserva(sessao["data"], sessao["horaFim"])

        capacidades = []

        for sala in salas:
            capacidade = int(sala.capacidade or 0)

            if capacidade <= 0:
                continue

            if not self.sala_esta_disponivel(db, sala.idSala, inicio, fim):
                continue

            if capacidade not in capacidades:
                capacidades.append(capacidade)

        return sorted(capacidades)

    def get_faixas_capacidade_disponiveis(self, db: Session, sessao: Dict[str, Any]):
        capacidades = self.get_capacidades_disponiveis_distintas(db, sessao)

        faixas = []
        inicio = 0

        for capacidade in capacidades:
            fim = int(capacidade)

            if fim < inicio:
                continue

            label = f"{inicio} a {fim} pessoas"

            faixas.append(
                {
                    "inicio": inicio,
                    "fim": fim,
                    "minimo": inicio,
                    "maximo": fim,
                    "label": label,
                    "valor": f"FAIXA_CAPACIDADE:{inicio}:{fim}",
                }
            )

            inicio = fim + 1

        return faixas

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
            if self.sala_esta_disponivel(db, sala.idSala, inicio, fim)
        ]

        if not salas_disponiveis:
            return QUANTIDADE_MINIMA_PADRAO, None

        maior_capacidade = max(int(sala.capacidade or 0) for sala in salas_disponiveis)

        return QUANTIDADE_MINIMA_PADRAO, maior_capacidade

    def get_salas_disponiveis_filtradas(self, db: Session, sessao: Dict[str, Any]):
        query = (
            db.query(Sala)
            .join(Edificio, Sala.idEdificio == Edificio.id)
            .filter(
                Sala.ativo == True,
                Edificio.idCampus == sessao["idCampus"],
                Sala.idTipoSala == sessao["idTipoSala"],
            )
        )

        faixa_inicio = sessao.get("faixaCapacidadeInicio")
        faixa_fim = sessao.get("faixaCapacidadeFim")

        if faixa_inicio is not None and faixa_fim is not None:
            query = query.filter(
                Sala.capacidade >= int(faixa_inicio),
                Sala.capacidade <= int(faixa_fim),
            )
        elif sessao.get("quantidade") is not None:
            query = query.filter(Sala.capacidade >= int(sessao["quantidade"]))

        salas = query.order_by(Sala.capacidade.asc(), Sala.nome.asc()).all()

        inicio = self.montar_datetime_reserva(sessao["data"], sessao["horaInicio"])
        fim = self.montar_datetime_reserva(sessao["data"], sessao["horaFim"])

        return [
            sala
            for sala in salas
            if self.sala_esta_disponivel(db, sala.idSala, inicio, fim)
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

    def buscar_conflito_sala(
        self,
        db: Session,
        id_sala: int,
        inicio_novo: datetime,
        fim_novo: datetime,
        ignorar_id_reserva: int | None = None,
    ):
        query = db.query(Reserva).filter(
            Reserva.idSala == id_sala,
            Reserva.idStatusReserva.in_([1, 2]),
        )

        if ignorar_id_reserva is not None:
            query = query.filter(Reserva.idReserva != ignorar_id_reserva)

        reservas = query.all()

        for reserva in reservas:
            try:
                inicio_existente = self.montar_datetime_reserva(
                    reserva.dataInicio,
                    reserva.horaInicio,
                )
                fim_existente = self.montar_datetime_reserva(
                    reserva.dataFim or reserva.dataInicio,
                    reserva.horaFim,
                )
            except Exception:
                continue

            if inicio_novo < fim_existente and fim_novo > inicio_existente:
                return reserva

        return None

    def sala_esta_disponivel(
        self,
        db: Session,
        id_sala: int,
        inicio_novo: datetime,
        fim_novo: datetime,
    ):
        conflito = self.buscar_conflito_sala(
            db=db,
            id_sala=id_sala,
            inicio_novo=inicio_novo,
            fim_novo=fim_novo,
        )

        return conflito is None

    def minutos_do_dia(self, horario: str):
        hora, minuto = horario.split(":")
        return int(hora) * 60 + int(minuto)

    def normalizar_horario_digitado(self, mensagem: str):
        texto = str(mensagem or "").strip()

        if texto.upper().startswith("HORARIO_INICIO:"):
            texto = texto.split(":", 1)[1].strip()

        if texto.upper().startswith("HORARIO_FIM:"):
            texto = texto.split(":", 1)[1].strip()

        texto = texto.replace("h", ":").replace("H", ":")

        partes = texto.split(":")

        if len(partes) != 2:
            return None

        try:
            hora = int(partes[0])
            minuto = int(partes[1])
        except ValueError:
            return None

        if hora < 0 or hora > 23 or minuto < 0 or minuto > 59:
            return None

        return f"{str(hora).zfill(2)}:{str(minuto).zfill(2)}"

    def horario_dentro_do_periodo_permitido(self, horario: str):
        minutos = self.minutos_do_dia(horario)
        return self.minutos_do_dia("08:00") <= minutos <= self.minutos_do_dia("22:30")

    def montar_resumo_dados_informados(self, sessao: Dict[str, Any]):
        linhas = ["Dados informados até agora:"]

        if sessao.get("nomeInstituicaoReserva"):
            linhas.append(f"Instituição: {sessao['nomeInstituicaoReserva']}")

        if sessao.get("cursoUsuarioReserva"):
            linhas.append(f"Curso: {sessao['cursoUsuarioReserva']}")

        if sessao.get("data"):
            linhas.append(f"Data: {self.formatar_data_br(sessao['data'])}")

        if sessao.get("nomeCampus"):
            linhas.append(f"Campus: {sessao['nomeCampus']}")

        if sessao.get("horaInicio") and sessao.get("horaFim"):
            linhas.append(f"Horário: {sessao['horaInicio']} às {sessao['horaFim']}")
        elif sessao.get("horaInicio"):
            linhas.append(f"Horário inicial: {sessao['horaInicio']}")

        if sessao.get("nomeTipoSala"):
            linhas.append(f"Tipo/Motivo: {sessao['nomeTipoSala']}")

        if sessao.get("faixaCapacidadeLabel"):
            linhas.append(f"Faixa de capacidade: {sessao['faixaCapacidadeLabel']}")
        elif sessao.get("quantidade"):
            linhas.append(f"Quantidade de pessoas: {sessao['quantidade']}")

        return "\n".join(linhas)

    def calcular_intervalo_turnos(self, turnos: list[str]):
        inicios = [TURNOS[t]["inicio"] for t in turnos]
        fins = [TURNOS[t]["fim"] for t in turnos]

        return min(inicios), max(fins)

    def montar_datetime_reserva(self, data: str | date | datetime, hora: str):
        if isinstance(data, datetime):
            data_texto = data.date().isoformat()
        elif isinstance(data, date):
            data_texto = data.isoformat()
        else:
            data_texto = str(data or "").strip()[:10]

        hora_texto = str(hora or "").strip()

        if len(hora_texto) == 5:
            hora_texto = f"{hora_texto}:00"

        return datetime.fromisoformat(f"{data_texto}T{hora_texto}")

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
        recursos = self.get_recursos_sala(db, sala.idSala)

        return {
            "numeroLista": numero_lista,
            "idSala": sala.idSala,
            "nome": sala.nome,
            "numero": sala.numero,
            "tipo": tipo,
            "capacidade": sala.capacidade,
            "andar": sala.andar,
            "instituicao": localizacao["instituicao"],
            "campus": localizacao["campus"],
            "edificio": localizacao["edificio"],
            "recursos": recursos,
            "recursosResumo": recursos[:3],
            "recursosRestantes": max(len(recursos) - 3, 0),
        }

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

    def montar_texto_reserva(self, db: Session, reserva: Reserva):
        return (
            f"Reserva #{reserva.idReserva}\n"
            f"Sala: {self.get_nome_sala(db, reserva.idSala)}\n"
            f"Solicitante: {reserva.nomeUsuarioReserva or 'Não informado'}\n"
            f"Matrícula: {reserva.matriculaUsuarioReserva or 'Não informada'}\n"
            f"Cargo: {reserva.cargoUsuarioReserva or 'Não informado'}\n"
            f"Instituição: {reserva.instituicaoUsuarioReserva or 'Não informada'}\n"
            f"Curso: {reserva.cursoUsuarioReserva or 'Não informado'}\n"
            f"Status: {STATUS_RESERVA.get(reserva.idStatusReserva, 'Desconhecido')}\n"
            f"Data: {self.formatar_data_br(reserva.dataInicio)} das "
            f"{reserva.horaInicio} às {reserva.horaFim}\n"
            f"Motivo/Tipo: {reserva.motivo}\n"
            f"Pessoas: {reserva.qtdPessoas}"
        )

    def limpar_fluxo_reserva(self, sessao: Dict[str, Any]):
        campos = [
            "data",
            "idInstituicaoReserva",
            "nomeInstituicaoReserva",
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
            "faixasCapacidade",
            "faixaCapacidadeInicio",
            "faixaCapacidadeFim",
            "faixaCapacidadeLabel",
            "salasDisponiveisReserva",
            "idSalaReserva",
            "idCursoReserva",
            "cursoUsuarioReserva",
            "cursosReserva",
            "cursosReservaOpcoes",
            "reservasConfirmacao",
            "idReservaConfirmar",
        ]

        for campo in campos:
            sessao.pop(campo, None)