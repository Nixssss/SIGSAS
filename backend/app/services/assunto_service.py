from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.assunto import Assunto

from app.schemas.assunto import AssuntoCreate, AssuntoUpdate


def get_all(db: Session) -> List[Assunto]:
    return db.query(Assunto).all()


def get_by_id(db: Session, id: int) -> Optional[Assunto]:
    return db.query(Assunto).filter(Assunto.id == id).first()


def create(db: Session, obj_in: AssuntoCreate) -> Assunto:
    db_obj = Assunto(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, id: int, obj_in: AssuntoUpdate) -> Optional[Assunto]:
    db_obj = db.query(Assunto).filter(Assunto.id == id).first()
    if db_obj:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete(db: Session, id: int) -> bool:
    obj = db.query(Assunto).filter(Assunto.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False
