from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.sala import Sala

from app.schemas.sala import SalaCreate, SalaUpdate


def get_all(db: Session) -> List[Sala]:
    return db.query(Sala).all()


def get_by_id(db: Session, id: int) -> Optional[Sala]:
    return db.query(Sala).filter(Sala.id == id).first()


def create(db: Session, obj_in: SalaCreate) -> Sala:
    db_obj = Sala(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, id: int, obj_in: SalaUpdate) -> Optional[Sala]:
    db_obj = db.query(Sala).filter(Sala.id == id).first()
    if db_obj:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete(db: Session, id: int) -> bool:
    obj = db.query(Sala).filter(Sala.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False
