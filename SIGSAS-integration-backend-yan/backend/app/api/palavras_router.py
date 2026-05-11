from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.palavras import (
    PalavraCreate,
    PalavraUpdate,
    PalavraResponse
)

from app.services.palavra_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete
)

router = APIRouter(prefix="/palavras", tags=["palavras"])


@router.get("/", response_model=List[PalavraResponse])
def list_palavras(db: Session = Depends(get_db)):
    return get_all(db)


@router.get("/{id}", response_model=PalavraResponse)
def get_palavra(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Palavra not found")
    return obj


@router.post("/", response_model=PalavraResponse, status_code=201)
def create_palavra(obj_in: PalavraCreate, db: Session = Depends(get_db)):
    return create(db, obj_in=obj_in)


@router.put("/{id}", response_model=PalavraResponse)
def update_palavra(id: int, obj_in: PalavraUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Palavra not found")
    return update(db, id=id, obj_in=obj_in)


@router.delete("/{id}", status_code=204)
def delete_palavra(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Palavra not found")
    delete(db, id=id)