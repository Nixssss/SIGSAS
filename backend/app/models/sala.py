from sqlalchemy import Column, Integer, String
from app.db.session import Base

class Sala(Base):
    __tablename__ = "salas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    capacidade = Column(Integer, nullable=False)