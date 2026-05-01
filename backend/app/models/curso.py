from sqlalchemy import Column, Integer, String
from app.db.session import Base

class Curso(Base):
    __tablename__ = 'cursos'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)