from sqlalchemy import Column, Integer, String
from app.db.session import Base


class Tabela(Base):
    __tablename__ = "tabelas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)