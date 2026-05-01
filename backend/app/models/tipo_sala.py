from sqlalchemy import Column, Integer, String
from app.db.session import Base
from app.db.session import get_db


class TipoSala(Base):
    __tablename__ = 'tipos_sala'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)