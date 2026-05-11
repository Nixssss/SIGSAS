from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.status_reserva import (
    StatusReservaCreate,
    StatusReservaUpdate,
    StatusReservaResponse
)

from app.services.status_reserva_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete
)

router = APIRouter(prefix="/status_reservas", tags=["status_reservas"])


@router.get("/", response_model=List[StatusReservaResponse])
def list_status_reservas(db: Session = Depends(get_db)):
    return get_all(db)


@router.get("/{id}", response_model=StatusReservaResponse)
def get_status_reserva(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="StatusReserva not found")
    return obj


@router.post("/", response_model=StatusReservaResponse, status_code=201)
def create_status_reserva(obj_in: StatusReservaCreate, db: Session = Depends(get_db)):
    return create(db, obj_in=obj_in)


@router.put("/{id}", response_model=StatusReservaResponse)
def update_status_reserva(id: int, obj_in: StatusReservaUpdate, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="StatusReserva not found")
    return update(db, id=id, obj_in=obj_in)


@router.delete("/{id}", status_code=204)
def delete_status_reserva(id: int, db: Session = Depends(get_db)):
    obj = get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="StatusReserva not found")
    delete(db, id=id)