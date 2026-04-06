from pydantic import BaseModel, Field

# O que o usuário envia para a API
class ChatRequest(BaseModel):
    mensagem: str = Field(..., example="Quero reservar um laboratório .")

# O que a API devolve para o usuário
class ChatResponse(BaseModel):
    resposta: str