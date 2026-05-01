from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.peso_palavra import PesoPalavra, PesoPalavraCreate, PesoPalavraUpdate
from app.services.peso_palavra_service import PesoPalavraService

router = APIRouter(prefix="/pesos_palavra", tags=["pesos_palavra"])

service = PesoPalavraService()

@router.get("/", response_model=List[PesoPalavra])
def list_pesos_palavra(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=PesoPalavra)
def get_peso_palavra(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="PesoPalavra not found")
    return db_obj

@router.post("/", response_model=PesoPalavra, status_code=201)
def create_peso_palavra(obj_in: PesoPalavraCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=PesoPalavra)
def update_peso_palavra(id: int, obj_in: PesoPalavraUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="PesoPalavra not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_peso_palavra(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="PesoPalavra not found")
    service.delete(db, id=id)