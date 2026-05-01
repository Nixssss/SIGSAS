from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.peso_palavra import (
    PesoPalavraCreate,
    PesoPalavraUpdate,
    PesoPalavraResponse
)

from app.services.peso_palavra_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete
)

router = APIRouter(prefix="/pesos_palavra", tags=["pesos_palavra"])


@router.get("/", response_model=List[PesoPalavraResponse])
def list_pesos_palavra(db: Session = Depends(get_db)):
    return get_all(db)


@router.get("/{id}", response_model=PesoPalavraResponse)
def get_peso_palavra(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="PesoPalavra not found")
    return obj


@router.post("/", response_model=PesoPalavraResponse, status_code=201)
def create_peso_palavra(obj_in: PesoPalavraCreate, db: Session = Depends(get_db)):
    return create(db, obj_in=obj_in)


@router.put("/{id}", response_model=PesoPalavraResponse)
def update_peso_palavra(id: int, obj_in: PesoPalavraUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="PesoPalavra not found")
    return update(db, id=id, obj_in=obj_in)


@router.delete("/{id}", status_code=204)
def delete_peso_palavra(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="PesoPalavra not found")
    delete(db, id=id)