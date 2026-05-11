from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.session import Base

class Sala(Base):
    __tablename__ = 'salas'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    capacidade = Column(Integer, nullable=False)
    tipo_sala_id = Column(Integer, ForeignKey('tipos_sala.id'))