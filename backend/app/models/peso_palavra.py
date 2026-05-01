from sqlalchemy import Column, Integer, Float, ForeignKey
from app.db.base import Base

class PesoPalavra(Base):
    __tablename__ = 'pesos_palavras'

    id = Column(Integer, primary_key=True)
    palavra_id = Column(Integer, ForeignKey('palavras.id'), nullable=False)
    peso = Column(Float, nullable=False)
    