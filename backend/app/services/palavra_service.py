from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.palavras import Palavra

from app.schemas.palavras import PalavraCreate, PalavraUpdate


def get_all(db: Session) -> List[Palavra]:
    return db.query(Palavra).all()


def get_by_id(db: Session, id: int) -> Optional[Palavra]:
    return db.query(Palavra).filter(Palavra.id == id).first()


def create(db: Session, obj_in: PalavraCreate) -> Palavra:
    db_obj = Palavra(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, id: int, obj_in: PalavraUpdate) -> Optional[Palavra]:
    db_obj = db.query(Palavra).filter(Palavra.id == id).first()
    if db_obj:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


def delete(db: Session, id: int) -> bool:
    obj = db.query(Palavra).filter(Palavra.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False