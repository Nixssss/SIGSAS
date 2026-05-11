from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.peso_palavra import PesoPalavra

from app.schemas.peso_palavra import PesoPalavraCreate, PesoPalavraUpdate


def get_all(db: Session) -> List[PesoPalavra]:
    return db.query(PesoPalavra).all()


def get_by_id(db: Session, id: int) -> Optional[PesoPalavra]:
    return db.query(PesoPalavra).filter(PesoPalavra.id == id).first()


def create(db: Session, obj_in: PesoPalavraCreate) -> PesoPalavra:
    db_obj = PesoPalavra(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, id: int, obj_in: PesoPalavraUpdate) -> Optional[PesoPalavra]:
    db_obj = db.query(PesoPalavra).filter(PesoPalavra.id == id).first()
    if db_obj:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete(db: Session, id: int) -> bool:
    obj = db.query(PesoPalavra).filter(PesoPalavra.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False