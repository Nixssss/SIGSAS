from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import traceback
from app.db.session import get_db
from app.services.chat_service import processar_mensagem


router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/")
def chat(payload: dict, db: Session = Depends(get_db)):

    print("PAYLOAD RECEBIDO:", payload)

    user_id = payload.get("idUsuario") or payload.get("user_id")
    message = payload.get("message")

    if not message:
        raise HTTPException(
            status_code=400,
            detail="message não enviada"
        )

    message = str(message).strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Mensagem vazia"
        )

    try:
        response = processar_mensagem(message, db, user_id)
        return response

    except Exception:
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail="Erro ao processar mensagem"
        )