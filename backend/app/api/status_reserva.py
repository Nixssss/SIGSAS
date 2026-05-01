from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.status_reserva import StatusReserva, StatusReservaCreate, StatusReservaUpdate
from app.services.status_reserva_service import StatusReservaService

router = APIRouter(prefix="/status_reservas", tags=["status_reservas"])

service = StatusReservaService()

@router.get("/", response_model=List[StatusReserva])
def list_status_reservas(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=StatusReserva)
def get_status_reserva(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="StatusReserva not found")
    return db_obj

@router.post("/", response_model=StatusReserva, status_code=201)
def create_status_reserva(obj_in: StatusReservaCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=StatusReserva)
def update_status_reserva(id: int, obj_in: StatusReservaUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="StatusReserva not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_status_reserva(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="StatusReserva not found")
    service.delete(db, id=id)