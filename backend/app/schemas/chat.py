from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from backend.app.db.session import get_db
from backend.app.services.ia_service import LocalAIProcessor

# Schemas
class ChatRequest(BaseModel):
    mensagem: str

class DadosExtraidos(BaseModel):
    intencao: Optional[str] = None
    sala_tipo: Optional[str] = None
    capacidade_estimada: Optional[int] = None
    data: Optional[str] = None
    horario: Optional[str] = None

class ChatResponse(BaseModel):
    sucesso: bool
    ia_resposta: DadosExtraidos
    mensagem_amigavel: str

# Router
router = APIRouter(prefix="/api/v1/ia", tags=["Chat Inteligente SIGSAS"])

# Instância única do processador
processor = LocalAIProcessor()

@router.post("/perguntar", response_model=ChatResponse)
def perguntar(request: ChatRequest, db: Session = Depends(get_db)):
    resultado = processor.processar_agendamento(mensagem=request.mensagem, db=db)
    if resultado.get("erro"):
        raise HTTPException(status_code=400, detail=resultado["erro"])
    return ChatResponse(
        sucesso=True,
        ia_resposta=DadosExtraidos(**resultado.get("dados_extraidos", {})),
        mensagem_amigavel=resultado.get("mensagem_amigavel", "")
    )



