from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.services.ia_service import LocalAIProcessor

class MensagemChat(BaseModel):
    texto: str

router = APIRouter(
    prefix="/api/v1/ia",
    tags=["IA"]
)

# Modelo carregado na primeira chamada
ia_processor = LocalAIProcessor()

@router.post("/perguntar")
async def chat_inteligente(solicitacao: MensagemChat, db: Session = Depends(get_db)):
    """
    Endpoint do Chat Inteligente do SIGSAS.
    Recebe o texto e retorna a interpretação estruturada feita pela IA.
    """
    try:
        resultado = ia_processor.processar_agendamento(solicitacao.texto)

        if resultado["status"] == "erro":
            raise HTTPException(status_code=500, detail=resultado["detalhes"])

        return {
            "sucesso": True,
            "ia_resposta": resultado["resposta_estruturada"],
            "mensagem_amigavel": resultado["mensagem_usuario"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno no motor de IA: {str(e)}"
        )