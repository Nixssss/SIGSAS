from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.recurso import Recurso
from app.schemas.recurso import RecursoCreate, RecursoUpdate


class RecursoService:

    @staticmethod
    def get_all(db: Session) -> List[Recurso]:
        return db.query(Recurso).all()

    @staticmethod
    def get_by_id(db: Session, id: int) -> Optional[Recurso]:
        return db.query(Recurso).filter(Recurso.id == id).first()

    @staticmethod
    def create(db: Session, obj_in: RecursoCreate) -> Recurso:
        db_obj = Recurso(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, id: int, obj_in: RecursoUpdate) -> Optional[Recurso]:
        db_obj = db.query(Recurso).filter(Recurso.id == id).first()

        if not db_obj:
            return None

        update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.commit()
        db.refresh(db_obj)

        return db_obj

    @staticmethod
    def delete(db: Session, id: int) -> bool:
        obj = db.query(Recurso).filter(Recurso.id == id).first()

        if not obj:
            return False

        db.delete(obj)
        db.commit()

        return True