from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.frase import (
    FraseCreate,
    FraseUpdate,
    FraseResponse
)

from app.services.frase_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete
)

router = APIRouter(prefix="/frases", tags=["frases"])


@router.get("/", response_model=List[FraseResponse])
def list_frases(db: Session = Depends(get_db)):
    return get_all(db)


@router.get("/{id}", response_model=FraseResponse)
def get_frase(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Frase not found")
    return obj


@router.post("/", response_model=FraseResponse, status_code=201)
def create_frase(obj_in: FraseCreate, db: Session = Depends(get_db)):
    return create(db, obj_in=obj_in)


@router.put("/{id}", response_model=FraseResponse)
def update_frase(id: int, obj_in: FraseUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Frase not found")
    return update(db, id=id, obj_in=obj_in)


@router.delete("/{id}", status_code=204)
def delete_frase(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Frase not found")
    delete(db, id=id)