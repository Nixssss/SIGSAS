from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class Instituicao(Base):
    __tablename__ = "instituicoes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)

    campi = relationship(
        "Campus",
        back_populates="instituicao",
        cascade="all, delete-orphan"
    )