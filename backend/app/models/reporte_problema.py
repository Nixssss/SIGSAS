from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime

from app.db.session import Base


class ReporteProblema(Base):
    __tablename__ = "reportes_problemas"

    id = Column(Integer, primary_key=True, index=True)

    idUsuario = Column(Integer, nullable=True)
    nomeUsuario = Column(String, nullable=True)
    emailUsuario = Column(String, nullable=True)

    titulo = Column(String, nullable=False)
    descricao = Column(Text, nullable=False)
    modulo = Column(String, nullable=True)
    prioridade = Column(String, default="Média", nullable=False)
    status = Column(String, default="Aberto", nullable=False)

    respostaAdmin = Column(Text, nullable=True)

    dataCriacao = Column(DateTime, default=datetime.utcnow, nullable=False)
    dataAtualizacao = Column(DateTime, default=datetime.utcnow, nullable=False)