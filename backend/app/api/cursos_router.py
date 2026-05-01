from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.cursos import Curso, CursoCreate, CursoUpdate
from app.services.curso_service import CursoService

router = APIRouter(prefix="/cursos", tags=["cursos"])

service = CursoService()

@router.get("/", response_model=List[Curso])
def list_cursos(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=Curso)
def get_curso(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Curso not found")
    return db_obj

@router.post("/", response_model=Curso, status_code=201)
def create_curso(obj_in: CursoCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=Curso)
def update_curso(id: int, obj_in: CursoUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Curso not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_curso(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Curso not found")
    service.delete(db, id=id)