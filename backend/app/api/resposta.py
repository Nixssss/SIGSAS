from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.resposta import (
    RespostaCreate,
    RespostaUpdate,
    RespostaResponse
)

from app.services.resposta_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete
)

router = APIRouter(prefix="/respostas", tags=["respostas"])


@router.get("/", response_model=List[RespostaResponse])
def list_respostas(db: Session = Depends(get_db)):
    return get_all(db)


@router.get("/{id}", response_model=RespostaResponse)
def get_resposta(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Resposta not found")
    return obj


@router.post("/", response_model=RespostaResponse, status_code=201)
def create_resposta(obj_in: RespostaCreate, db: Session = Depends(get_db)):
    return create(db, obj_in=obj_in)


@router.put("/{id}", response_model=RespostaResponse)
def update_resposta(id: int, obj_in: RespostaUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Resposta not found")
    return update(db, id=id, obj_in=obj_in)


@router.delete("/{id}", status_code=204)
def delete_resposta(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Resposta not found")
    delete(db, id=id)