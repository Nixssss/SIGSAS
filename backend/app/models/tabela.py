from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamento: Um usuário pode ter várias reservas
    reservas = relationship("Reserva", back_populates="usuario")

class Sala(Base):
    __tablename__ = "salas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False) 
    tipo = Column(String, nullable=False) 
    capacidade = Column(Integer)
    status = Column(String, default="Ativa")
    
    # sem precisar alterar a estrutura do banco!
    atributos_extras = Column(JSON, default={}) 
    
    # Relacionamento: Uma sala pode ter várias reservas
    reservas = relationship("Reserva", back_populates="sala")

class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    sala_id = Column(Integer, ForeignKey("salas.id"))
    data_hora_inicio = Column(DateTime, nullable=False)
    data_hora_fim = Column(DateTime, nullable=False)
    status = Column(String, default="Confirmada")

    # Relacionamentos bidirecionais
    usuario = relationship("Usuario", back_populates="reservas")
    sala = relationship("Sala", back_populates="reservas")