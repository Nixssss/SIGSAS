from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class SalaRecurso(Base):
    __tablename__ = "sala_recursos"

    id = Column(Integer, primary_key=True, index=True)
    idSala = Column(Integer, ForeignKey("salas.idSala"), nullable=False)
    idRecurso = Column(Integer, ForeignKey("recursos.id"), nullable=False)

    sala = relationship("Sala", back_populates="recursos")
    recurso = relationship("Recurso", back_populates="salas")