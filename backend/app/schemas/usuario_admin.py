from pydantic import BaseModel, EmailStr
from typing import Optional


class UsuarioAdminCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    perfil: str = "usuario"
    matricula: Optional[str] = None
    cargo: Optional[str] = None
    idInstituicao: Optional[int] = None


class UsuarioAdminUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None
    perfil: Optional[str] = None
    matricula: Optional[str] = None
    cargo: Optional[str] = None
    idInstituicao: Optional[int] = None


class UsuarioAdminRead(BaseModel):
    id: int
    nome: str
    email: str
    perfil: str
    matricula: Optional[str] = None
    cargo: Optional[str] = None
    idInstituicao: Optional[int] = None
    instituicao: Optional[str] = None