from sqlalchemy import Column, Integer, String
from app.db.session import Base

class Palavra(Base):
    __tablename__ = 'palavras'

    id = Column(Integer, primary_key=True)
    palavra = Column(String(100), unique=True, nullable=False)
    