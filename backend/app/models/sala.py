from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Sala(Base):
    __tablename__ = "salas"

    idSala = Column(Integer, primary_key=True, index=True)

    idTipoSala = Column(Integer, ForeignKey("tipos_sala.id"), nullable=False)
    idEdificio = Column(Integer, ForeignKey("edificios.id"), nullable=False)

    nome = Column(String, nullable=False)
    numero = Column(String, nullable=False)
    capacidade = Column(Integer, nullable=False)
    metragem = Column(Integer, nullable=False)
    andar = Column(Integer, nullable=False)
    ativo = Column(Boolean, default=True)

    tipo_sala = relationship("TipoSala", back_populates="salas")
    edificio = relationship("Edificio")

    recursos = relationship(
        "SalaRecurso",
        back_populates="sala",
        cascade="all, delete-orphan",
    )