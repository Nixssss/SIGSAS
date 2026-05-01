from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.reserva import Reserva
from app.schemas.reserva import ReservaCreate, ReservaUpdate


class ReservaService:

    @staticmethod
    def get_all(db: Session) -> List[Reserva]:
        return db.query(Reserva).all()

    @staticmethod
    def get_by_id(db: Session, id: int) -> Optional[Reserva]:
        return db.query(Reserva).filter(Reserva.id == id).first()

    @staticmethod
    def create(db: Session, obj_in: ReservaCreate) -> Reserva:
        db_obj = Reserva(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, id: int, obj_in: ReservaUpdate) -> Optional[Reserva]:
        db_obj = db.query(Reserva).filter(Reserva.id == id).first()
        if db_obj:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_obj, field, value)
            db.commit()
            db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, id: int) -> bool:
        obj = db.query(Reserva).filter(Reserva.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False