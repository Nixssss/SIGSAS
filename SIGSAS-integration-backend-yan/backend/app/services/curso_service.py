from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.curso import Curso
from app.schemas.cursos import CursoCreate, CursoUpdate


class CursoService:

    @staticmethod
    def get_all(db: Session) -> List[Curso]:
        return db.query(Curso).all()

    @staticmethod
    def get_by_id(db: Session, id: int) -> Optional[Curso]:
        return db.query(Curso).filter(Curso.id == id).first()

    @staticmethod
    def create(db: Session, obj_in: CursoCreate) -> Curso:
        db_obj = Curso(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, id: int, obj_in: CursoUpdate) -> Optional[Curso]:
        db_obj = db.query(Curso).filter(Curso.id == id).first()
        if db_obj:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_obj, field, value)
            db.commit()
            db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, id: int) -> bool:
        obj = db.query(Curso).filter(Curso.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False