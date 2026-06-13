from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.chatfluxo_service import ChatbotFluxoService
from app.services.auditoria_service import registrar_log
from app.services.chatbotb_historico_service import (
    ChatbotBHistoricoService,
    STATUS_ABANDONADA,
    STATUS_ERRO,
)


router = APIRouter(prefix="/chatbot-fluxo", tags=["Chatbot Fluxo"])

service = ChatbotFluxoService()
historico_service = ChatbotBHistoricoService()


class ChatFluxoRequest(BaseModel):
    texto: str
    session_id: str
    idUsuario: int | None = None


class ChatFluxoResetRequest(BaseModel):
    session_id: str
    idUsuario: int | None = None


@router.post("/mensagem")
def mensagem_chatbot(
    dados: ChatFluxoRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    historico_service.registrar_mensagem(
        db=db,
        session_id=dados.session_id,
        id_usuario=dados.idUsuario,
        autor="usuario",
        mensagem=dados.texto,
        etapa="entrada",
        tipo_interacao="mensagem",
        dados_contexto={
            "origem": "chatbot-fluxo",
            "rota": "/chatbot-fluxo/mensagem",
        },
        request=request,
    )

    try:
        resposta = service.processar_mensagem(
            texto=dados.texto,
            session_id=dados.session_id,
            db=db,
            id_usuario=dados.idUsuario,
            request=request,
        )

        texto_resposta = str(resposta.get("resposta") or "Sem resposta do servidor.")
        status_detectado = historico_service.detectar_status_resposta(resposta)
        id_reserva_gerada = historico_service.extrair_id_reserva_texto(texto_resposta)

        historico_service.registrar_mensagem(
            db=db,
            session_id=dados.session_id,
            id_usuario=dados.idUsuario,
            autor="bot",
            mensagem=texto_resposta,
            etapa=historico_service.extrair_etapa_resposta(resposta),
            tipo_interacao=resposta.get("tipoInteracao"),
            dados_contexto=historico_service.montar_contexto_resposta(resposta),
            request=request,
            status_conversa=status_detectado,
            id_reserva_gerada=id_reserva_gerada,
        )

        return resposta

    except Exception as error:
        historico_service.registrar_mensagem(
            db=db,
            session_id=dados.session_id,
            id_usuario=dados.idUsuario,
            autor="bot",
            mensagem="Erro interno ao processar mensagem do chatbot.",
            etapa="erro",
            tipo_interacao="erro",
            dados_contexto={
                "erro": str(error),
                "mensagem_recebida": str(dados.texto or "")[:180],
            },
            request=request,
            status_conversa=STATUS_ERRO,
        )

        registrar_log(
            db=db,
            acao="CHATBOT_ERRO_INTERNO",
            modulo="Chatbot",
            etapa="mensagem",
            descricao=(
                "Erro interno ao processar mensagem do chatbot. "
                f"Mensagem recebida: {str(dados.texto or '')[:180]}"
            ),
            status="erro",
            erro=str(error),
            id_usuario=dados.idUsuario,
            session_id=dados.session_id,
            request=request,
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao processar mensagem do chatbot",
        )


@router.post("/reset")
def resetar_chatbot(
    dados: ChatFluxoResetRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    service.registrar_abandono_se_precisar(
        db=db,
        session_id=dados.session_id,
        id_usuario=dados.idUsuario,
        request=request,
        motivo="Usuário reiniciou o chatbot antes de concluir o fluxo",
    )

    historico_service.atualizar_status_conversa(
        db=db,
        session_id=dados.session_id,
        id_usuario=dados.idUsuario,
        status=STATUS_ABANDONADA,
    )

    historico_service.registrar_mensagem(
        db=db,
        session_id=dados.session_id,
        id_usuario=dados.idUsuario,
        autor="usuario",
        mensagem="Reiniciou o chatbot.",
        etapa="reset",
        tipo_interacao="reset",
        dados_contexto={
            "origem": "chatbot-fluxo",
            "rota": "/chatbot-fluxo/reset",
        },
        request=request,
    )

    service.resetar_sessao(dados.session_id)

    registrar_log(
        db=db,
        acao="CHATBOT_RESET",
        modulo="Chatbot",
        etapa="reset",
        descricao="Usuário reiniciou o chatbot e voltou ao menu inicial",
        status="sucesso",
        id_usuario=dados.idUsuario,
        session_id=dados.session_id,
        request=request,
    )

    resposta = service.menu(
        db=db,
        id_usuario=dados.idUsuario,
    )

    historico_service.registrar_mensagem(
        db=db,
        session_id=dados.session_id,
        id_usuario=dados.idUsuario,
        autor="bot",
        mensagem=str(resposta.get("resposta") or "Menu inicial do chatbot."),
        etapa="menu",
        tipo_interacao=resposta.get("tipoInteracao"),
        dados_contexto=historico_service.montar_contexto_resposta(resposta),
        request=request,
    )

    return resposta
