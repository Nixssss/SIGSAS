from sqlalchemy import Column, Integer, ForeignKey
from app.db.base import Base

class SalaRecurso(Base):
    __tablename__ = 'salas_recursos'

    id = Column(Integer, primary_key=True)
    sala_id = Column(Integer, ForeignKey('salas.id'), nullable=False)
    recurso_id = Column(Integer, ForeignKey('recursos.id'), nullable=False)