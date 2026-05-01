from sqlalchemy import Column, Integer, String
from app.db.session import Base

class Tabela(Base):
    __tablename__ = 'tabelas'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)