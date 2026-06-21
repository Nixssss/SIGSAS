from sqlalchemy import Boolean, Column, Integer, String, text
from sqlalchemy.orm import relationship

from app.db.session import Base


class Instituicao(Base):
    __tablename__ = "instituicoes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    ativo = Column(Boolean, nullable=False, default=True, server_default=text("true"))
    motivoInativo = Column("motivo_inativo", String, nullable=True)

    campi = relationship(
        "Campus",
        back_populates="instituicao",
        cascade="all, delete-orphan"
    )
