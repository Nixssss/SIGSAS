from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.tipo_sala import TipoSala
from app.schemas.tipo_sala import TipoSalaCreate, TipoSalaUpdate


class TipoSalaService:

    @staticmethod
    def get_all(db: Session) -> List[TipoSala]:
        return db.query(TipoSala).all()

    @staticmethod
    def get_by_id(db: Session, id: int) -> Optional[TipoSala]:
        return db.query(TipoSala).filter(TipoSala.id == id).first()

    @staticmethod
    def create(db: Session, obj_in: TipoSalaCreate) -> TipoSala:
        db_obj = TipoSala(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, id: int, obj_in: TipoSalaUpdate) -> Optional[TipoSala]:
        db_obj = db.query(TipoSala).filter(TipoSala.id == id).first()
        if db_obj:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_obj, field, value)
            db.commit()
            db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, id: int) -> bool:
        obj = db.query(TipoSala).filter(TipoSala.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False