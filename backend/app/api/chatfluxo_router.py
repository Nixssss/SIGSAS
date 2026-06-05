from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.chatfluxo_service import ChatbotFluxoService
from app.services.auditoria_service import registrar_log


router = APIRouter(prefix="/chatbot-fluxo", tags=["Chatbot Fluxo"])

service = ChatbotFluxoService()


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
    try:
        return service.processar_mensagem(
            texto=dados.texto,
            session_id=dados.session_id,
            db=db,
            id_usuario=dados.idUsuario,
            request=request,
        )

    except Exception as error:
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

    return service.menu(
        db=db,
        id_usuario=dados.idUsuario,
    )
