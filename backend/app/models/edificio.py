from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Edificio(Base):
    __tablename__ = "edificios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    idCampus = Column(Integer, ForeignKey("campi.id"), nullable=False)

    campus = relationship("Campus", back_populates="edificios")