from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    perfil = Column(String, default="usuario", nullable=False)

    matricula = Column(String, nullable=True)
    cargo = Column(String, nullable=True)

    idInstituicao = Column(Integer, ForeignKey("instituicoes.id"), nullable=True)

    instituicao = relationship("Instituicao")