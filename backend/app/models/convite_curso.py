from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class ConviteCurso(Base):
    __tablename__ = "convite_cursos"

    id = Column(Integer, primary_key=True, index=True)

    idConvite = Column(
        Integer,
        ForeignKey("convites.idConvite", ondelete="CASCADE"),
        nullable=False,
    )

    idCurso = Column(
        Integer,
        ForeignKey("cursos.id", ondelete="CASCADE"),
        nullable=False,
    )

    tipoVinculo = Column(String, nullable=False)

    convite = relationship(
        "Convite",
        back_populates="cursos_vinculados",
    )

    curso = relationship("Curso")