from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime

from app.db.session import Base


class SugestaoMelhoria(Base):
    __tablename__ = "sugestoes_melhorias"

    id = Column(Integer, primary_key=True, index=True)

    idUsuario = Column(Integer, nullable=True)
    nomeUsuario = Column(String, nullable=True)
    emailUsuario = Column(String, nullable=True)

    titulo = Column(String, nullable=False)
    descricao = Column(Text, nullable=False)
    modulo = Column(String, nullable=True)
    categoria = Column(String, default="Melhoria", nullable=False)
    status = Column(String, default="Nova", nullable=False)

    respostaAdmin = Column(Text, nullable=True)

    dataCriacao = Column(DateTime, default=datetime.utcnow, nullable=False)
    dataAtualizacao = Column(DateTime, default=datetime.utcnow, nullable=False)