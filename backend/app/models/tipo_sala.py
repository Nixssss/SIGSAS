from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class TipoSala(Base):
    __tablename__ = "tipos_sala"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False, unique=True)

    salas = relationship("Sala", back_populates="tipo_sala")
    recursos = relationship(
        "TipoSalaRecurso",
        back_populates="tipo_sala",
        cascade="all, delete-orphan",
    )