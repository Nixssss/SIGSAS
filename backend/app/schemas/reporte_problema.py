from datetime import datetime
from pydantic import BaseModel


class ReporteProblemaCreate(BaseModel):
    idUsuario: int | None = None
    nomeUsuario: str | None = None
    emailUsuario: str | None = None

    titulo: str
    descricao: str
    modulo: str | None = None
    prioridade: str = "Média"


class ReporteProblemaUpdate(BaseModel):
    titulo: str | None = None
    descricao: str | None = None
    modulo: str | None = None
    prioridade: str | None = None
    status: str | None = None
    respostaAdmin: str | None = None


class ReporteProblemaRead(BaseModel):
    id: int

    idUsuario: int | None = None
    nomeUsuario: str | None = None
    emailUsuario: str | None = None

    titulo: str
    descricao: str
    modulo: str | None = None
    prioridade: str
    status: str

    respostaAdmin: str | None = None

    dataCriacao: datetime
    dataAtualizacao: datetime

    class Config:
        from_attributes = True