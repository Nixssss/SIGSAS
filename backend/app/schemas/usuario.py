from pydantic import BaseModel, EmailStr, validator
import re

class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    confirmacao_senha: str

    @validator('senha')
    def validar_senha(cls, v):
        if len(v) < 8:
            raise ValueError('A senha deve ter no mínimo 8 caracteres.')
        if not re.search(r"[A-Z]", v):
            raise ValueError('A senha deve conter uma letra maiúscula.')
        if not re.search(r"[!@#$%^&*]", v):
            raise ValueError('A senha deve conter um caractere especial.')
        return v

    @validator('confirmacao_senha')
    def senhas_iguais(cls, v, values):
        if 'senha' in values and v != values['senha']:
            raise ValueError('As senhas não coincidem.')
        return v

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr

    class Config:
        from_attributes = True