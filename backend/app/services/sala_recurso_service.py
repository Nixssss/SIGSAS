from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.sala_recurso import SalaRecurso

from app.schemas.sala_recurso import SalaRecursoCreate, SalaRecursoUpdate


def get_all(db: Session) -> List[SalaRecurso]:
    return db.query(SalaRecurso).all()


def get_by_id(db: Session, id: int) -> Optional[SalaRecurso]:
    return db.query(SalaRecurso).filter(SalaRecurso.id == id).first()


def create(db: Session, obj_in: SalaRecursoCreate) -> SalaRecurso:
    db_obj = SalaRecurso(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, id: int, obj_in: SalaRecursoUpdate) -> Optional[SalaRecurso]:
    db_obj = db.query(SalaRecurso).filter(SalaRecurso.id == id).first()
    if db_obj:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete(db: Session, id: int) -> bool:
    obj = db.query(SalaRecurso).filter(SalaRecurso.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False