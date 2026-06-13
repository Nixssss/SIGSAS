from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.db.session import Base


class ChatbotBMensagem(Base):
    __tablename__ = "chatbotb_mensagens"

    id = Column(Integer, primary_key=True, index=True)

    id_conversa = Column(
        Integer,
        ForeignKey("chatbotb_conversas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    autor = Column(String(30), nullable=False, index=True)
    mensagem = Column(Text, nullable=False)

    etapa = Column(String(100), nullable=True)
    tipo_interacao = Column(String(100), nullable=True)

    dados_contexto = Column(JSONB, nullable=True)

    data_hora = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    conversa = relationship("ChatbotBConversa", back_populates="mensagens")
