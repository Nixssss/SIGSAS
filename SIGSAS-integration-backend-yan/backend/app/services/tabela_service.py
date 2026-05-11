from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.tabela import Tabela
from app.schemas.tabela import TabelaCreate, TabelaUpdate


class TabelaService:

    @staticmethod
    def create(db: Session, obj_in: TabelaCreate) -> Tabela:
        db_obj = Tabela(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get(db: Session, id: int) -> Optional[Tabela]:
        return db.query(Tabela).filter(Tabela.id == id).first()

    @staticmethod
    def get_all(db: Session) -> List[Tabela]:
        return db.query(Tabela).all()

    @staticmethod
    def update(db: Session, id: int, obj_in: TabelaUpdate) -> Optional[Tabela]:
        db_obj = db.query(Tabela).filter(Tabela.id == id).first()
        if db_obj:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_obj, field, value)
            db.commit()
            db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, id: int) -> bool:
        obj = db.query(Tabela).filter(Tabela.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False