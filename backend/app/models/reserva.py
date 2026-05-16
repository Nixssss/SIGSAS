from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.session import Base


class Reserva(Base):
    __tablename__ = "reservas"

    idReserva = Column(Integer, primary_key=True, index=True)

    idSala = Column(Integer, ForeignKey("salas.idSala"), nullable=False)

    idUsuarioReserva = Column(Integer, nullable=True)
    nomeUsuarioReserva = Column(String, nullable=True)
    matriculaUsuarioReserva = Column(String, nullable=True)
    cargoUsuarioReserva = Column(String, nullable=True)
    instituicaoUsuarioReserva = Column(String, nullable=True)

    idStatusReserva = Column(Integer, nullable=False, default=1)

    dataInicio = Column(String, nullable=False)
    horaInicio = Column(String, nullable=False)
    dataFim = Column(String, nullable=False)
    horaFim = Column(String, nullable=False)

    motivo = Column(String, nullable=False)
    qtdPessoas = Column(Integer, nullable=False)

    dataCriacao = Column(DateTime, default=datetime.utcnow)

    idUsuarioAprovacao = Column(Integer, nullable=True)
    justificativa = Column(String, nullable=True)

    sala = relationship("Sala")