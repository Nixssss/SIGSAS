from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.erro_palavra import ErroPalavra

from app.schemas.erro_palavra import ErroPalavraCreate, ErroPalavraUpdate


def get_all(db: Session) -> List[ErroPalavra]:
    return db.query(ErroPalavra).all()


def get_by_id(db: Session, id: int) -> Optional[ErroPalavra]:
    return db.query(ErroPalavra).filter(ErroPalavra.id == id).first()


def create(db: Session, obj_in: ErroPalavraCreate) -> ErroPalavra:
    db_obj = ErroPalavra(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, id: int, obj_in: ErroPalavraUpdate) -> Optional[ErroPalavra]:
    db_obj = db.query(ErroPalavra).filter(ErroPalavra.id == id).first()
    if db_obj:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete(db: Session, id: int) -> bool:
    obj = db.query(ErroPalavra).filter(ErroPalavra.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False