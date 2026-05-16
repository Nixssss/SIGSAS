from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class Recurso(Base):
    __tablename__ = "recursos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False, unique=True)

    tipos_sala = relationship(
        "TipoSalaRecurso",
        back_populates="recurso",
        cascade="all, delete-orphan",
    )

    salas = relationship(
        "SalaRecurso",
        back_populates="recurso",
        cascade="all, delete-orphan",
    )