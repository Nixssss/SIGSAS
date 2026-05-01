from sqlalchemy import Column, Integer, String
from app.db.base import Base

class StatusReserva(Base):
    __tablename__ = 'status_reservas'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)