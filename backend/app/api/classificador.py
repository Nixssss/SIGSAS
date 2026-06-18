from fastapi import APIRouter
from pydantic import BaseModel

from app.services.classificador import classificar

router = APIRouter()


class FraseRequest(BaseModel):
    frase: str


@router.post("/classificar")
def classificar_frase(req: FraseRequest):

    resultado = classificar(req.frase)

    return {
        "frase": req.frase,
        "intencao": resultado
    }