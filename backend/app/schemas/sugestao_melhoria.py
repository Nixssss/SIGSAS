from datetime import datetime
from pydantic import BaseModel


class SugestaoMelhoriaCreate(BaseModel):
    idUsuario: int | None = None
    nomeUsuario: str | None = None
    emailUsuario: str | None = None

    titulo: str
    descricao: str
    modulo: str | None = None
    categoria: str = "Melhoria"


class SugestaoMelhoriaUpdate(BaseModel):
    titulo: str | None = None
    descricao: str | None = None
    modulo: str | None = None
    categoria: str | None = None
    status: str | None = None
    respostaAdmin: str | None = None


class SugestaoMelhoriaRead(BaseModel):
    id: int

    idUsuario: int | None = None
    nomeUsuario: str | None = None
    emailUsuario: str | None = None

    titulo: str
    descricao: str
    modulo: str | None = None
    categoria: str
    status: str

    respostaAdmin: str | None = None

    dataCriacao: datetime
    dataAtualizacao: datetime

    class Config:
        from_attributes = True