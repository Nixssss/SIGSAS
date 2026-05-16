from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.chatfluxo_service import ChatbotFluxoService

router = APIRouter(prefix="/chatbot-fluxo", tags=["Chatbot Fluxo"])
chatbot_service = ChatbotFluxoService()


class MensagemRequest(BaseModel):
    texto: str
    session_id: str = "default"


@router.post("/mensagem")
def enviar_mensagem(dados: MensagemRequest, db: Session = Depends(get_db)):
    return chatbot_service.processar_mensagem(dados.texto, dados.session_id, db)


@router.post("/reset")
def resetar_fluxo(dados: MensagemRequest):
    chatbot_service.resetar_sessao(dados.session_id)
    return {
        "resposta": (
            "Fluxo reiniciado.\n\n"
            "1 - Reservar\n"
            "2 - Cancelar reserva\n"
            "3 - Confirmar reserva"
        )
    }
