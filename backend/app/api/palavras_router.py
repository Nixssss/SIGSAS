from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.palavras import Palavra, PalavraCreate, PalavraUpdate
from app.services.palavra_service import PalavraService

router = APIRouter(prefix="/palavras", tags=["palavras"])

service = PalavraService()

@router.get("/", response_model=List[Palavra])
def list_palavras(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=Palavra)
def get_palavra(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Palavra not found")
    return db_obj

@router.post("/", response_model=Palavra, status_code=201)
def create_palavra(obj_in: PalavraCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=Palavra)
def update_palavra(id: int, obj_in: PalavraUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Palavra not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_palavra(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Palavra not found")
    service.delete(db, id=id)
