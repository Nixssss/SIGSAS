from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.status_reserva import StatusReserva

from app.schemas.status_reserva import StatusReservaCreate, StatusReservaUpdate


def get_all(db: Session) -> List[StatusReserva]:
    return db.query(StatusReserva).all()


def get_by_id(db: Session, id: int) -> Optional[StatusReserva]:
    return db.query(StatusReserva).filter(StatusReserva.id == id).first()


def create(db: Session, obj_in: StatusReservaCreate) -> StatusReserva:
    db_obj = StatusReserva(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, id: int, obj_in: StatusReservaUpdate) -> Optional[StatusReserva]:
    db_obj = db.query(StatusReserva).filter(StatusReserva.id == id).first()
    if db_obj:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete(db: Session, id: int) -> bool:
    obj = db.query(StatusReserva).filter(StatusReserva.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False
