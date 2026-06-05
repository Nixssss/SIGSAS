from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class UsuarioCurso(Base):
    __tablename__ = "usuario_cursos"

    id = Column(Integer, primary_key=True, index=True)

    idUsuario = Column(
        Integer,
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
    )

    idCurso = Column(
        Integer,
        ForeignKey("cursos.id", ondelete="CASCADE"),
        nullable=False,
    )

    tipoVinculo = Column(String, nullable=False)

    usuario = relationship(
        "Usuario",
        back_populates="cursos_vinculados",
    )

    curso = relationship(
        "Curso",
        back_populates="usuarios_cursos",
    )