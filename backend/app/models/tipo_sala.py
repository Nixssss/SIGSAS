from sqlalchemy import Column, Integer, String
from app.db.base import Base

class TipoSala(Base):
    __tablename__ = 'tipos_sala'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)