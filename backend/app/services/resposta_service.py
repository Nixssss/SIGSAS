from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.resposta import Resposta

from app.schemas.resposta import RespostaCreate, RespostaUpdate


def get_all(db: Session) -> List[Resposta]:
    return db.query(Resposta).all()


def get_by_id(db: Session, id: int) -> Optional[Resposta]:
    return db.query(Resposta).filter(Resposta.id == id).first()


def create(db: Session, obj_in: RespostaCreate) -> Resposta:
    db_obj = Resposta(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, id: int, obj_in: RespostaUpdate) -> Optional[Resposta]:
    db_obj = db.query(Resposta).filter(Resposta.id == id).first()
    if db_obj:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete(db: Session, id: int) -> bool:
    obj = db.query(Resposta).filter(Resposta.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False