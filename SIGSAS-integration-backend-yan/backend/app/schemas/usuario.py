from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class UsuarioBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=1, max_length=100)
    cargo_id: int


class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=8)


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, min_length=1, max_length=100)
    cargo_id: Optional[int] = None
    senha: Optional[str] = Field(None, min_length=8)


class Usuario(UsuarioBase):
    id: int
    ativo: bool = True