from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    senha: str = Field(..., min_length=6)
    perfil: str = "usuario"

    matricula: str | None = None
    cargo: str | None = None
    idInstituicao: int | None = None


class UserRead(BaseModel):
    id: int
    nome: str
    email: EmailStr
    perfil: str

    matricula: str | None = None
    cargo: str | None = None
    idInstituicao: int | None = None
    instituicao: str | None = None

    class Config:
        from_attributes = True


class RedefinirSenhaRequest(BaseModel):
    email: EmailStr
    nova_senha: str = Field(..., min_length=6)
    token: str | None = None