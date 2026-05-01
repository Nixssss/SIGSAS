from sqlalchemy import Column, Integer, Text
from app.db.session import Base

class Frase(Base):
    __tablename__ = 'frases'

    id = Column(Integer, primary_key=True)
    texto = Column(Text, nullable=False)
    