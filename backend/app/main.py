from fastapi import FastAPI
from app.api import chat

app = FastAPI(title="SIGSAS - Sistema de Gestão de Salas")

# Rota inicial para evitar o erro 404
@app.get("/")
async def root():
    return {"mensagem": "API do SIGSAS está Online. Acesse /docs para testar o Chat."}

app.include_router(chat.router, prefix="/api/v1/ia", tags=["Chat Inteligente"])

from fastapi import FastAPI
from app.api import reservas

app = FastAPI()

app.include_router(reservas.router)