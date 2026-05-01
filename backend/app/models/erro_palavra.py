from sqlalchemy import Column, Integer, ForeignKey
from app.db.base import Base

class ErroPalavra(Base):
    __tablename__ = 'erros_palavras'

    id = Column(Integer, primary_key=True)
    palavra_id = Column(Integer, ForeignKey('palavras.id'), nullable=False)
    quantidade_erros = Column(Integer, default=0)
    