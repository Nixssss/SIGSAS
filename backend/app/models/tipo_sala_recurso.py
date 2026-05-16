from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class TipoSalaRecurso(Base):
    __tablename__ = "tipo_sala_recursos"

    id = Column(Integer, primary_key=True, index=True)
    idTipoSala = Column(Integer, ForeignKey("tipos_sala.id"), nullable=False)
    idRecurso = Column(Integer, ForeignKey("recursos.id"), nullable=False)

    tipo_sala = relationship("TipoSala", back_populates="recursos")
    recurso = relationship("Recurso", back_populates="tipos_sala")