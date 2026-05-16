from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ia_service import processar_mensagem_usuario

router = APIRouter()

@router.post("/", response_model=ChatResponse)
def conversar_com_ia(chat_in: ChatRequest):
    """
    Recebe a mensagem do usuário e envia para o motor de Inteligência Artificial.
    """
    # Envia o texto para o nosso "motor"
    resposta_ia = processar_mensagem_usuario(chat_in.mensagem)
    
  
    return ChatResponse(resposta=resposta_ia)