from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.frase import Frase, FraseCreate, FraseUpdate
from app.services.frase_service import FraseService

router = APIRouter(prefix="/frases", tags=["frases"])

service = FraseService()

@router.get("/", response_model=List[Frase])
def list_frases(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=Frase)
def get_frase(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Frase not found")
    return db_obj

@router.post("/", response_model=Frase, status_code=201)
def create_frase(obj_in: FraseCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=Frase)
def update_frase(id: int, obj_in: FraseUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Frase not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_frase(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Frase not found")
    service.delete(db, id=id)