from sqlalchemy import Column, Integer, String
from app.db.session import Base

class Assunto(Base):
    __tablename__ = 'assuntos'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    