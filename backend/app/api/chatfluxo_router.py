from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.chatfluxo_service import ChatbotFluxoService


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
    return service.processar_mensagem(
        texto=dados.texto,
        session_id=dados.session_id,
        db=db,
        id_usuario=dados.idUsuario,
        request=request,
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

    return service.menu()