from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.sala_recurso import SalaRecursoCreate, SalaRecursoResponse
from app.services.sala_recurso_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete
)

router = APIRouter(prefix="/sala_recursos", tags=["sala_recursos"])


@router.get("/", response_model=List[SalaRecursoResponse])
def list_sala_recursos(db: Session = Depends(get_db)):
    return get_all(db)


@router.get("/{id}", response_model=SalaRecursoResponse)
def get_sala_recurso(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="SalaRecurso not found")
    return obj


@router.post("/", response_model=SalaRecursoResponse, status_code=201)
def create_sala_recurso(obj_in: SalaRecursoCreate, db: Session = Depends(get_db)):
    return create(db, obj_in=obj_in)


@router.put("/{id}", response_model=SalaRecursoResponse)
def update_sala_recurso(id: int, obj_in: SalaRecursoCreate, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="SalaRecurso not found")
    return update(db, id=id, obj_in=obj_in)


@router.delete("/{id}", status_code=204)
def delete_sala_recurso(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="SalaRecurso not found")
    delete(db, id=id)