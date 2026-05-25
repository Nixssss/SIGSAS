from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.app.db.session import get_db
from backend.app.services.ia_service import LocalAIProcessor

class MensagemChat(BaseModel):
    texto: str

router = APIRouter()

ia_processor = LocalAIProcessor()

@router.post("/perguntar")
async def chat_inteligente(
    solicitacao: MensagemChat,
    db: Session = Depends(get_db)
):
    try:
        resultado = ia_processor.processar_agendamento(solicitacao.texto, db=db)

        if resultado.get("erro"):
            raise HTTPException(status_code=500, detail=resultado["erro"])

        return {
            "sucesso": True,
            "ia_resposta": resultado["dados_extraidos"],
            "mensagem_amigavel": resultado["mensagem_usuario"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno no motor de IA: {str(e)}"
        )
