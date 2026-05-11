from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.resposta import Resposta, RespostaCreate, RespostaUpdate
from app.services.resposta_service import RespostaService

router = APIRouter(prefix="/respostas", tags=["respostas"])

service = RespostaService()

@router.get("/", response_model=List[Resposta])
def list_respostas(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=Resposta)
def get_resposta(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Resposta not found")
    return db_obj

@router.post("/", response_model=Resposta, status_code=201)
def create_resposta(obj_in: RespostaCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=Resposta)
def update_resposta(id: int, obj_in: RespostaUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Resposta not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_resposta(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Resposta not found")
    service.delete(db, id=id)