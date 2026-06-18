from sqlalchemy import Column, Integer, Text, String
from app.db.session import Base

class Resposta(Base):
    __tablename__ = "respostas"

    id = Column(Integer, primary_key=True)
    codigo = Column(String(100), unique=True, nullable=False)
    texto = Column(Text, nullable=False)
    