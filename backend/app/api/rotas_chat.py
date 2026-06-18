from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
#from app.services.ia_service import LocalAIProcessor

#router = APIRouter()

@router.post("/", response_model=ChatResponse)
def conversar_com_ia(chat_in: ChatRequest):
    """Recebe a mensagem do usuário e envia para a IA."""

    ia = LocalAIProcessor()
    resposta_ia = ia.process(chat_in.mensagem)

    return ChatResponse(resposta=resposta_ia)