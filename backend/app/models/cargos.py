from sqlalchemy import Column, Integer, String
from app.db.session import Base

class Cargo(Base):
    __tablename__ = 'cargos'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)