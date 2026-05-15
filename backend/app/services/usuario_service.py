from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate


class UsuarioService:

    @staticmethod
    def get_all(db: Session) -> List[Usuario]:
        return db.query(Usuario).all()

    @staticmethod
    def get_by_id(db: Session, id: int) -> Optional[Usuario]:
        return db.query(Usuario).filter(Usuario.id == id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[Usuario]:
        return db.query(Usuario).filter(Usuario.email == email).first()

    @staticmethod
    def criar_usuario(db: Session, obj_in: UsuarioCreate) -> Usuario:
        db_obj = Usuario(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def listar_usuarios(db: Session) -> List[Usuario]:
        return db.query(Usuario).all()

    @staticmethod
    def obter_usuario(db: Session, id: int) -> Optional[Usuario]:
        return db.query(Usuario).filter(Usuario.id == id).first()

    @staticmethod
    def atualizar_usuario(db: Session, id: int, obj_in: UsuarioUpdate) -> Optional[Usuario]:
        db_obj = db.query(Usuario).filter(Usuario.id == id).first()
        if db_obj:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_obj, field, value)
            db.commit()
            db.refresh(db_obj)
        return db_obj

    @staticmethod
    def deletar_usuario(db: Session, id: int) -> bool:
        obj = db.query(Usuario).filter(Usuario.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False