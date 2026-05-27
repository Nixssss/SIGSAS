from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime

from app.db.session import Base


class Auditoria(Base):
    __tablename__ = "auditoria"

    id = Column(Integer, primary_key=True, index=True)

    idUsuario = Column(Integer, nullable=True)
    nomeUsuario = Column(String, nullable=True)
    emailUsuario = Column(String, nullable=True)

    ipMaquina = Column(String, nullable=True)
    sessionId = Column(String, nullable=True)

    acao = Column(String, nullable=False)
    modulo = Column(String, nullable=False)
    etapa = Column(String, nullable=True)

    descricao = Column(Text, nullable=False)

    status = Column(String, default="sucesso", nullable=False)
    erro = Column(Text, nullable=True)

    dataHora = Column(DateTime, default=datetime.utcnow, nullable=False)