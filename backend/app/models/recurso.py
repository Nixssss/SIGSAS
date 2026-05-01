from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Recurso(Base):
    __tablename__ = 'recursos'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    