from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, text
from sqlalchemy.orm import relationship

from app.db.session import Base


class Edificio(Base):
    __tablename__ = "edificios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    idCampus = Column(Integer, ForeignKey("campi.id"), nullable=False)
    ativo = Column(Boolean, nullable=False, default=True, server_default=text("true"))
    motivoInativo = Column("motivo_inativo", String, nullable=True)

    campus = relationship("Campus", back_populates="edificios")
