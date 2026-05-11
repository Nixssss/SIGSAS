from sqlalchemy import Column, Integer, Text, ForeignKey
from app.db.base import Base

class Resposta(Base):
    __tablename__ = 'respostas'

    id = Column(Integer, primary_key=True)
    frase_id = Column(Integer, ForeignKey('frases.id'), nullable=False)
    texto = Column(Text, nullable=False)
    