from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.tipo_sala import TipoSala, TipoSalaCreate, TipoSalaUpdate
from app.services.tipo_sala_service import TipoSalaService

router = APIRouter(prefix="/tipos_sala", tags=["tipos_sala"])

service = TipoSalaService()

@router.get("/", response_model=List[TipoSala])
def list_tipos_sala(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=TipoSala)
def get_tipo_sala(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="TipoSala not found")
    return db_obj

@router.post("/", response_model=TipoSala, status_code=201)
def create_tipo_sala(obj_in: TipoSalaCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=TipoSala)
def update_tipo_sala(id: int, obj_in: TipoSalaUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="TipoSala not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_tipo_sala(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="TipoSala not found")
    service.delete(db, id=id)