from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime, timedelta
import secrets

from app.db.session import Base


class Convite(Base):
    __tablename__ = "convites"

    idConvite = Column(Integer, primary_key=True, index=True)

    email = Column(String, nullable=False, index=True)
    token = Column(String, unique=True, index=True, nullable=False)

    usado = Column(Boolean, default=False, nullable=False)

    criadoEm = Column(DateTime, default=datetime.utcnow, nullable=False)
    expiraEm = Column(DateTime, nullable=False)
    usadoEm = Column(DateTime, nullable=True)

    criadoPor = Column(Integer, nullable=True)

    @staticmethod
    def gerar_token():
        return secrets.token_urlsafe(32)

    @staticmethod
    def gerar_data_expiracao(validade_horas: int = 48):
        return datetime.utcnow() + timedelta(hours=validade_horas)