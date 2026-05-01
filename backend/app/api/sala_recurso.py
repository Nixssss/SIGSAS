from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.sala_recurso import SalaRecurso, SalaRecursoCreate, SalaRecursoUpdate
from app.services.sala_recurso_service import SalaRecursoService

router = APIRouter(prefix="/sala_recursos", tags=["sala_recursos"])

service = SalaRecursoService()

@router.get("/", response_model=List[SalaRecurso])
def list_sala_recursos(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=SalaRecurso)
def get_sala_recurso(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="SalaRecurso not found")
    return db_obj

@router.post("/", response_model=SalaRecurso, status_code=201)
def create_sala_recurso(obj_in: SalaRecursoCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=SalaRecurso)
def update_sala_recurso(id: int, obj_in: SalaRecursoUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="SalaRecurso not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_sala_recurso(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="SalaRecurso not found")
    service.delete(db, id=id)
