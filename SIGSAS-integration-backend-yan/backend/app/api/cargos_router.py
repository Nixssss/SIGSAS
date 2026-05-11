from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.cargos import Cargo, CargoCreate, CargoUpdate
from app.services.cargo_service import CargoService

router = APIRouter(prefix="/cargos", tags=["cargos"])

service = CargoService()

@router.get("/", response_model=List[Cargo])
def list_cargos(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=Cargo)
def get_cargo(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Cargo not found")
    return db_obj

@router.post("/", response_model=Cargo, status_code=201)
def create_cargo(obj_in: CargoCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=Cargo)
def update_cargo(id: int, obj_in: CargoUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Cargo not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_cargo(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Cargo not found")
    service.delete(db, id=id)
