from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.assunto import (
    AssuntoCreate,
    AssuntoUpdate,
    AssuntoResponse
)

from app.services.assunto_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete
)

router = APIRouter(prefix="/assuntos", tags=["assuntos"])


@router.get("/", response_model=List[AssuntoResponse])
def list_assuntos(db: Session = Depends(get_db)):
    return get_all(db)


@router.get("/{id}", response_model=AssuntoResponse)
def get_assunto(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Assunto not found")
    return obj


@router.post("/", response_model=AssuntoResponse, status_code=201)
def create_assunto(obj_in: AssuntoCreate, db: Session = Depends(get_db)):
    return create(db, obj_in=obj_in)


@router.put("/{id}", response_model=AssuntoResponse)
def update_assunto(id: int, obj_in: AssuntoUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Assunto not found")
    return update(db, id=id, obj_in=obj_in)


@router.delete("/{id}", status_code=204)
def delete_assunto(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Assunto not found")
    delete(db, id=id)