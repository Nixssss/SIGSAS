import re
from datetime import datetime
from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.models.chatbotb_conversa import ChatbotBConversa
from app.models.chatbotb_mensagem import ChatbotBMensagem


STATUS_EM_ANDAMENTO = "em_andamento"
STATUS_CONCLUIDA_COM_RESERVA = "concluida_com_reserva"
STATUS_FINALIZADA_SEM_RESERVA = "finalizada_sem_reserva"
STATUS_ABANDONADA = "abandonada"
STATUS_ERRO = "erro"


class ChatbotBHistoricoService:
    def get_ip_request(self, request: Any | None):
        if request is None:
            return None

        forwarded_for = request.headers.get("x-forwarded-for")

        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        if request.client:
            return request.client.host

        return None

    def get_usuario(self, db: Session, id_usuario: int | None):
        if not id_usuario:
            return None

        return db.query(Usuario).filter(Usuario.id == id_usuario).first()

    def obter_conversa_ativa(
        self,
        db: Session,
        session_id: str,
        id_usuario: int | None = None,
    ):
        query = db.query(ChatbotBConversa).filter(
            ChatbotBConversa.session_id == session_id,
            ChatbotBConversa.status == STATUS_EM_ANDAMENTO,
        )

        if id_usuario:
            query = query.filter(
                or_(
                    ChatbotBConversa.id_usuario == id_usuario,
                    ChatbotBConversa.id_usuario.is_(None),
                )
            )

        return query.order_by(ChatbotBConversa.id.desc()).first()

    def obter_ou_criar_conversa(
        self,
        db: Session,
        session_id: str,
        id_usuario: int | None = None,
        request: Any | None = None,
    ):
        conversa = self.obter_conversa_ativa(
            db=db,
            session_id=session_id,
            id_usuario=id_usuario,
        )

        usuario = self.get_usuario(db, id_usuario)

        if conversa:
            alterou = False

            if usuario and not conversa.id_usuario:
                conversa.id_usuario = usuario.id
                conversa.nome_usuario = usuario.nome
                conversa.email_usuario = usuario.email
                conversa.perfil_usuario = usuario.perfil
                alterou = True

            if alterou:
                db.commit()
                db.refresh(conversa)

            return conversa

        conversa = ChatbotBConversa(
            id_usuario=usuario.id if usuario else id_usuario,
            nome_usuario=usuario.nome if usuario else None,
            email_usuario=usuario.email if usuario else None,
            perfil_usuario=usuario.perfil if usuario else None,
            session_id=session_id,
            status=STATUS_EM_ANDAMENTO,
            total_mensagens=0,
        )

        db.add(conversa)
        db.commit()
        db.refresh(conversa)

        return conversa

    def normalizar_json(self, valor: Any):
        if valor is None:
            return None

        if isinstance(valor, (str, int, float, bool)):
            return valor

        if isinstance(valor, list):
            return [self.normalizar_json(item) for item in valor]

        if isinstance(valor, dict):
            return {
                str(chave): self.normalizar_json(item)
                for chave, item in valor.items()
            }

        if isinstance(valor, datetime):
            return valor.isoformat()

        return str(valor)

    def montar_contexto_resposta(self, resposta: dict[str, Any] | None):
        if not isinstance(resposta, dict):
            return None

        contexto: dict[str, Any] = {}

        campos_simples = [
            "tipoInteracao",
            "campoHorario",
            "placeholder",
            "acaoReservas",
            "textoBotaoReservas",
        ]

        for campo in campos_simples:
            if resposta.get(campo) is not None:
                contexto[campo] = resposta.get(campo)

        campos_lista = [
            "opcoes",
            "instituicoes",
            "campi",
            "salas",
            "reservas",
            "faixasCapacidade",
            "horarios",
            "meses",
            "dias",
        ]

        for campo in campos_lista:
            valor = resposta.get(campo)

            if not isinstance(valor, list):
                continue

            contexto[f"total_{campo}"] = len(valor)

            if len(valor) <= 30:
                contexto[campo] = valor
            else:
                contexto[campo] = valor[:30]
                contexto[f"{campo}_truncado"] = True

        return self.normalizar_json(contexto)

    def extrair_etapa_resposta(self, resposta: dict[str, Any] | None):
        if not isinstance(resposta, dict):
            return None

        tipo_interacao = resposta.get("tipoInteracao")
        campo_horario = resposta.get("campoHorario")

        if tipo_interacao == "instituicoes":
            return "instituicao"

        if tipo_interacao == "calendario":
            return "data"

        if tipo_interacao == "campi":
            return "campus"

        if tipo_interacao == "horario-manual":
            if campo_horario == "fim":
                return "horario_fim"

            return "horario_inicio"

        if tipo_interacao == "faixas-capacidade":
            return "faixa_capacidade"

        if tipo_interacao == "lista-salas":
            return "escolher_sala"

        if tipo_interacao == "checkbox-reservas":
            return str(resposta.get("acaoReservas") or "reservas")

        if tipo_interacao == "confirmacao":
            return "confirmacao"

        if tipo_interacao == "menu":
            return "menu"

        return tipo_interacao

    def extrair_id_reserva_texto(self, texto: str | None):
        if not texto:
            return None

        padroes = [
            r"reserva\s*#\s*(\d+)",
            r"reserva\s+n[ºo]\s*(\d+)",
            r"id\s*da\s*reserva\s*[:#]?\s*(\d+)",
        ]

        for padrao in padroes:
            encontrado = re.search(padrao, texto, flags=re.IGNORECASE)

            if encontrado:
                try:
                    return int(encontrado.group(1))
                except ValueError:
                    return None

        return None

    def detectar_status_resposta(self, resposta: dict[str, Any] | None):
        if not isinstance(resposta, dict):
            return None

        texto = str(resposta.get("resposta") or "").lower()

        if "erro" in texto and (
            "não consegui" in texto
            or "erro:" in texto
            or "erro interno" in texto
            or "banco de dados" in texto
        ):
            return STATUS_ERRO

        if "obrigado por utilizar o sigsas" in texto:
            if "reserva #" in texto or "reserva criada" in texto:
                return STATUS_CONCLUIDA_COM_RESERVA

            return STATUS_FINALIZADA_SEM_RESERVA

        if "quando precisar, digite menu para voltar ao início" in texto:
            if "reserva #" in texto or "reserva criada" in texto:
                return STATUS_CONCLUIDA_COM_RESERVA

            return STATUS_FINALIZADA_SEM_RESERVA

        return None

    def registrar_mensagem(
        self,
        db: Session,
        session_id: str,
        autor: str,
        mensagem: str,
        id_usuario: int | None = None,
        etapa: str | None = None,
        tipo_interacao: str | None = None,
        dados_contexto: dict[str, Any] | None = None,
        request: Any | None = None,
        status_conversa: str | None = None,
        id_reserva_gerada: int | None = None,
    ):
        try:
            texto_mensagem = str(mensagem or "").strip()

            if not texto_mensagem:
                return None

            conversa = self.obter_ou_criar_conversa(
                db=db,
                session_id=session_id,
                id_usuario=id_usuario,
                request=request,
            )

            contexto = self.normalizar_json(dados_contexto) or {}

            if request is not None:
                contexto.setdefault("ip", self.get_ip_request(request))

            nova_mensagem = ChatbotBMensagem(
                id_conversa=conversa.id,
                autor=autor,
                mensagem=texto_mensagem,
                etapa=etapa,
                tipo_interacao=tipo_interacao,
                dados_contexto=contexto or None,
            )

            conversa.total_mensagens = int(conversa.total_mensagens or 0) + 1

            if id_reserva_gerada:
                conversa.id_reserva_gerada = id_reserva_gerada

            if status_conversa:
                conversa.status = status_conversa

                if status_conversa != STATUS_EM_ANDAMENTO:
                    conversa.data_fim = datetime.utcnow()

            db.add(nova_mensagem)
            db.commit()
            db.refresh(nova_mensagem)

            return nova_mensagem

        except Exception as error:
            db.rollback()
            print("[CHATBOTB HISTÓRICO] Erro ao registrar mensagem:", str(error), flush=True)
            return None

    def atualizar_status_conversa(
        self,
        db: Session,
        session_id: str,
        status: str,
        id_usuario: int | None = None,
        id_reserva_gerada: int | None = None,
    ):
        try:
            conversa = self.obter_conversa_ativa(
                db=db,
                session_id=session_id,
                id_usuario=id_usuario,
            )

            if not conversa:
                return None

            conversa.status = status

            if id_reserva_gerada:
                conversa.id_reserva_gerada = id_reserva_gerada

            if status != STATUS_EM_ANDAMENTO:
                conversa.data_fim = datetime.utcnow()

            db.commit()
            db.refresh(conversa)

            return conversa

        except Exception as error:
            db.rollback()
            print("[CHATBOTB HISTÓRICO] Erro ao atualizar status:", str(error), flush=True)
            return None

    def serializar_conversa(self, conversa: ChatbotBConversa):
        return {
            "id": conversa.id,
            "id_usuario": conversa.id_usuario,
            "nome_usuario": conversa.nome_usuario,
            "email_usuario": conversa.email_usuario,
            "perfil_usuario": conversa.perfil_usuario,
            "session_id": conversa.session_id,
            "status": conversa.status,
            "data_inicio": conversa.data_inicio.isoformat() if conversa.data_inicio else None,
            "data_fim": conversa.data_fim.isoformat() if conversa.data_fim else None,
            "total_mensagens": conversa.total_mensagens,
            "id_reserva_gerada": conversa.id_reserva_gerada,
            "criado_em": conversa.criado_em.isoformat() if conversa.criado_em else None,
            "atualizado_em": conversa.atualizado_em.isoformat() if conversa.atualizado_em else None,
        }

    def serializar_mensagem(self, mensagem: ChatbotBMensagem):
        return {
            "id": mensagem.id,
            "id_conversa": mensagem.id_conversa,
            "autor": mensagem.autor,
            "mensagem": mensagem.mensagem,
            "etapa": mensagem.etapa,
            "tipo_interacao": mensagem.tipo_interacao,
            "dados_contexto": mensagem.dados_contexto,
            "data_hora": mensagem.data_hora.isoformat() if mensagem.data_hora else None,
        }

    def montar_txt_conversa(self, conversa: ChatbotBConversa):
        linhas = [
            "HISTÓRICO DO ASSISTENTE DE RESERVAS - SIGSAS",
            "=" * 60,
            "",
            f"Conversa: #{conversa.id}",
            f"Usuário: {conversa.nome_usuario or 'Não informado'}",
            f"Email: {conversa.email_usuario or 'Não informado'}",
            f"Perfil: {conversa.perfil_usuario or 'Não informado'}",
            f"ID do usuário: {conversa.id_usuario or 'Não informado'}",
            f"Session ID: {conversa.session_id}",
            f"Status: {conversa.status}",
            f"Reserva gerada: {conversa.id_reserva_gerada or 'Não vinculada'}",
            f"Início: {conversa.data_inicio.strftime('%d/%m/%Y %H:%M:%S') if conversa.data_inicio else 'Não informado'}",
            f"Fim: {conversa.data_fim.strftime('%d/%m/%Y %H:%M:%S') if conversa.data_fim else 'Em andamento'}",
            f"Total de mensagens: {conversa.total_mensagens or 0}",
            "",
            "MENSAGENS",
            "=" * 60,
            "",
        ]

        for mensagem in conversa.mensagens:
            data_hora = (
                mensagem.data_hora.strftime("%d/%m/%Y %H:%M:%S")
                if mensagem.data_hora
                else "Data não informada"
            )

            autor = "Usuário" if mensagem.autor == "usuario" else "SIGSAS"

            linhas.append(f"[{data_hora}] {autor}")
            linhas.append("-" * 60)
            linhas.append(mensagem.mensagem or "")
            linhas.append("")

        return "\n".join(linhas)
