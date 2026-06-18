from app.db.session import SessionLocal
from app.services.chat_service import processar_mensagem

db = SessionLocal()

mensagem = "quero um laboratório de informática com projetor para 60 pessoas"

resultado = processar_mensagem(
    mensagem,
    db
)

print(resultado)