from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    senha: str = Field(..., min_length=6)
    perfil: str = "usuario"

class UserRead(BaseModel):
    id: int
    nome: str
    email: EmailStr
    perfil: str

    class Config:
        from_attributes = True