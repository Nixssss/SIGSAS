from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.erro_palavra import ErroPalavra, ErroPalavraCreate, ErroPalavraUpdate
from app.services.erro_palavra_service import ErroPalavraService

router = APIRouter(prefix="/erros_palavra", tags=["erros_palavra"])

service = ErroPalavraService()

@router.get("/", response_model=List[ErroPalavra])
def list_erros_palavra(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=ErroPalavra)
def get_erro_palavra(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="ErroPalavra not found")
    return db_obj

@router.post("/", response_model=ErroPalavra, status_code=201)
def create_erro_palavra(obj_in: ErroPalavraCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=ErroPalavra)
def update_erro_palavra(id: int, obj_in: ErroPalavraUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="ErroPalavra not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_erro_palavra(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="ErroPalavra not found")
    service.delete(db, id=id)