from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.session import Base


class Usuario(Base):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    cargo_id = Column(Integer, ForeignKey('cargos.id'))
    curso_id = Column(Integer, ForeignKey('cursos.id'))