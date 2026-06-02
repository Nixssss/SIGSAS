from sqlalchemy import Column, Integer, String
from app.db.session import Base

class TipoSala(Base):
    __tablename__ = 'tipo_salas'

    id = Column(Integer, primary_key=True)
    nome = Column(String(50), nullable=False)
