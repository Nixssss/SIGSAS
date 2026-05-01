from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.frase import Frase

from app.schemas.frase import FraseCreate, FraseUpdate


def get_all(db: Session) -> List[Frase]:
    return db.query(Frase).all()


def get_by_id(db: Session, id: int) -> Optional[Frase]:
    return db.query(Frase).filter(Frase.id == id).first()


def create(db: Session, obj_in: FraseCreate) -> Frase:
    db_obj = Frase(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, id: int, obj_in: FraseUpdate) -> Optional[Frase]:
    db_obj = db.query(Frase).filter(Frase.id == id).first()
    if db_obj:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete(db: Session, id: int) -> bool:
    obj = db.query(Frase).filter(Frase.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False