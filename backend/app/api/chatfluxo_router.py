from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.chatfluxo_service import ChatbotFluxoService

router = APIRouter()

chatbot_service = ChatbotFluxoService()

class MensagemRequest(BaseModel):
    texto: str
    session_id: str

@router.post("/mensagem")
async def enviar_mensagem(
    dados: MensagemRequest,
    db: Session = Depends(get_db)
):

    resposta = chatbot_service.processar_mensagem(
        dados.texto,
        dados.session_id,
        db
    )

    return resposta