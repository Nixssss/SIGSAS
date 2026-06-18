from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.nluservice import nlu
from app.services.busca_salas_service import buscar_salas


router = APIRouter(prefix="/salas", tags=["Salas Inteligente"])


@router.post("/buscar")
def buscar_salas_inteligente(payload: dict, db: Session = Depends(get_db)):

    frase = payload["frase"]

    # =========================
    # 1. NLU (NOVO PADRÃO)
    # =========================
    dados = nlu(frase, db)

    intent = dados["intent"]
    entidades = dados["entities"]

    # =========================
    # 2. SÓ BUSCA SE FOR CONSULTA/RESERVA
    # =========================
    if intent not in ["consultar", "reservar"]:
        return {
            "nlu": dados,
            "salas": [],
            "message": "Intenção não relacionada a busca de salas."
        }

    # =========================
    # 3. BUSCA NO BANCO
    # =========================
    salas = buscar_salas(entidades, db)

    # =========================
    # 4. RESPOSTA FINAL
    # =========================
    return {
        "nlu": dados,
        "salas": [
            {
                "id": s.idSala,
                "nome": s.nome,
                "capacidade": s.capacidade,
                "tipo_sala": s.tipo_sala.nome if s.tipo_sala else None
            }
            for s in salas
        ]
    }