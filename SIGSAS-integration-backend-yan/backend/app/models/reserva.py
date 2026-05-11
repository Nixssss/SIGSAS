from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Reserva(Base):
    __tablename__ = 'reservas'

    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    sala_id = Column(Integer, ForeignKey('salas.id'), nullable=False)
    data_inicio = Column(DateTime, nullable=False)
    data_fim = Column(DateTime, nullable=False)
    status_reserva_id = Column(Integer, ForeignKey('status_reservas.id'))
