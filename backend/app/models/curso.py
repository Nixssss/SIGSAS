from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)

    id_area_curso = Column(Integer, ForeignKey("areas_curso.id"), nullable=True)

    usuarios_cursos = relationship(
        "UsuarioCurso",
        back_populates="curso",
        cascade="all, delete-orphan",
    )

    reservas = relationship(
        "Reserva",
        back_populates="curso",
    )