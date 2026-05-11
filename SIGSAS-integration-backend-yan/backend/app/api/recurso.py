from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.recurso import RecursoCreate, RecursoUpdate, RecursoResponse
from app.services.recurso_service import RecursoService

router = APIRouter(prefix="/recursos", tags=["recursos"])

service = RecursoService()

@router.get("/", response_model=List[RecursoResponse])
def list_recursos(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=RecursoResponse)
def get_recurso(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Recurso not found")
    return db_obj

@router.post("/", response_model=RecursoResponse, status_code=201)
def create_recurso(obj_in: RecursoCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=RecursoResponse)
def update_recurso(id: int, obj_in: RecursoUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Recurso not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_recurso(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Recurso not found")
    service.delete(db, id=id)