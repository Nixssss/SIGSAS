from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.app.db.session import get_db
from backend.app.services.ia_service import LocalAIProcessor

class MensagemChat(BaseModel):
    texto: str

router = APIRouter()

# Nota: O modelo será carregado na memória na primeira vez que a API for chamada
ia_processor = LocalAIProcessor()

@router.post("/perguntar")
async def chat_inteligente(solicitacao: MensagemChat, db: Session = Depends(get_db)):
    """
    Endpoint principal para o chat do SIGSAS. 
    Recebe o texto do professor e retorna a interpretação da IA.
    """
    try:
        # Chama o serviço de IA para processar a linguagem natural
        resultado = ia_processor.processar_agendamento(solicitacao.texto)
        
        if resultado["status"] == "erro":
            raise HTTPException(status_code=500, detail=resultado["detalhes"])
            
        return {
            "sucesso": True,
            "ia_resposta": resultado["resposta_estruturada"],
            "mensagem_amigavel": resultado["mensagem_usuario"]
        }
        
    except Exception as e:
        raise HTTPException( # type: ignore
            status_code=500, 
            detail=f"Erro interno no motor de IA: {str(e)}"
        )