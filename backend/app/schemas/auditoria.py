from datetime import datetime
from pydantic import BaseModel


class AuditoriaRead(BaseModel):
    id: int

    idUsuario: int | None = None
    nomeUsuario: str | None = None
    emailUsuario: str | None = None

    ipMaquina: str | None = None
    sessionId: str | None = None

    acao: str
    modulo: str
    etapa: str | None = None

    descricao: str

    status: str
    erro: str | None = None

    dataHora: datetime

    class Config:
        from_attributes = True