from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.assunto import Assunto, AssuntoCreate, AssuntoUpdate
from app.services.assunto_service import AssuntoService

router = APIRouter(prefix="/assuntos", tags=["assuntos"])

service = AssuntoService()

@router.get("/", response_model=List[Assunto])
def list_assuntos(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=Assunto)
def get_assunto(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Assunto not found")
    return db_obj

@router.post("/", response_model=Assunto, status_code=201)
def create_assunto(obj_in: AssuntoCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=Assunto)
def update_assunto(id: int, obj_in: AssuntoUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Assunto not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_assunto(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Assunto not found")
    service.delete(db, id=id)
