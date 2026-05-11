from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.erro_palavra import (
    ErroPalavraCreate,
    ErroPalavraUpdate,
    ErroPalavraResponse
)

from app.services.erro_palavra_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete
)

router = APIRouter(prefix="/erros_palavra", tags=["erros_palavra"])


@router.get("/", response_model=List[ErroPalavraResponse])
def list_erros_palavra(db: Session = Depends(get_db)):
    return get_all(db)


@router.get("/{id}", response_model=ErroPalavraResponse)
def get_erro_palavra(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="ErroPalavra not found")
    return obj


@router.post("/", response_model=ErroPalavraResponse, status_code=201)
def create_erro_palavra(obj_in: ErroPalavraCreate, db: Session = Depends(get_db)):
    return create(db, obj_in=obj_in)


@router.put("/{id}", response_model=ErroPalavraResponse)
def update_erro_palavra(id: int, obj_in: ErroPalavraUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="ErroPalavra not found")
    return update(db, id=id, obj_in=obj_in)


@router.delete("/{id}", status_code=204)
def delete_erro_palavra(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="ErroPalavra not found")
    delete(db, id=id)