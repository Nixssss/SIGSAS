from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Campus(Base):
    __tablename__ = "campi"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    endereco = Column(String, nullable=True)
    idInstituicao = Column(Integer, ForeignKey("instituicoes.id"), nullable=False)

    instituicao = relationship("Instituicao", back_populates="campi")

    edificios = relationship(
        "Edificio",
        back_populates="campus",
        cascade="all, delete-orphan"
    )