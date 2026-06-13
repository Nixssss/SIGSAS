from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class ChatbotBConversa(Base):
    __tablename__ = "chatbotb_conversas"

    id = Column(Integer, primary_key=True, index=True)

    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=True, index=True)
    nome_usuario = Column(String(255), nullable=True)
    email_usuario = Column(String(255), nullable=True)
    perfil_usuario = Column(String(100), nullable=True)

    session_id = Column(String(255), nullable=False, index=True)

    status = Column(String(50), nullable=False, default="em_andamento", index=True)

    data_inicio = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    data_fim = Column(DateTime(timezone=True), nullable=True)

    total_mensagens = Column(Integer, nullable=False, default=0)

    id_reserva_gerada = Column(
        Integer,
        ForeignKey("reservas.idReserva"),
        nullable=True,
        index=True,
    )

    criado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    atualizado_em = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    mensagens = relationship(
        "ChatbotBMensagem",
        back_populates="conversa",
        cascade="all, delete-orphan",
        order_by="ChatbotBMensagem.data_hora.asc()",
    )

    usuario = relationship("Usuario")
    reserva_gerada = relationship("Reserva")
