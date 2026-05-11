from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.reserva import Reserva, ReservaCreate, ReservaUpdate
from app.services.reserva_service import ReservaService

router = APIRouter(prefix="/reservas", tags=["reservas"])

service = ReservaService()

@router.get("/", response_model=List[Reserva])
def list_reservas(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=Reserva)
def get_reserva(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Reserva not found")
    return db_obj

@router.post("/", response_model=Reserva, status_code=201)
def create_reserva(obj_in: ReservaCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=Reserva)
def update_reserva(id: int, obj_in: ReservaUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Reserva not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_reserva(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Reserva not found")
    service.delete(db, id=id)
