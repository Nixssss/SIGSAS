from datetime import datetime
from pydantic import BaseModel


class ReservaBase(BaseModel):
    idSala: int

    idUsuarioReserva: int | None = None
    nomeUsuarioReserva: str | None = None
    matriculaUsuarioReserva: str | None = None
    cargoUsuarioReserva: str | None = None
    instituicaoUsuarioReserva: str | None = None

    dataInicio: str
    horaInicio: str
    dataFim: str
    horaFim: str

    motivo: str
    qtdPessoas: int


class ReservaCreate(ReservaBase):
    pass


class ReservaUpdate(BaseModel):
    idSala: int | None = None

    idUsuarioReserva: int | None = None
    nomeUsuarioReserva: str | None = None
    matriculaUsuarioReserva: str | None = None
    cargoUsuarioReserva: str | None = None
    instituicaoUsuarioReserva: str | None = None

    idStatusReserva: int | None = None

    dataInicio: str | None = None
    horaInicio: str | None = None
    dataFim: str | None = None
    horaFim: str | None = None

    motivo: str | None = None
    qtdPessoas: int | None = None

    idUsuarioAprovacao: int | None = None
    justificativa: str | None = None


class ReservaStatusUpdate(BaseModel):
    idStatusReserva: int
    idUsuarioAprovacao: int | None = None
    justificativa: str | None = None


class ReservaRead(BaseModel):
    idReserva: int
    idSala: int

    idUsuarioReserva: int | None = None
    nomeUsuarioReserva: str | None = None
    matriculaUsuarioReserva: str | None = None
    cargoUsuarioReserva: str | None = None
    instituicaoUsuarioReserva: str | None = None

    idStatusReserva: int

    dataInicio: str
    horaInicio: str
    dataFim: str
    horaFim: str

    motivo: str
    qtdPessoas: int

    dataCriacao: datetime | None = None

    idUsuarioAprovacao: int | None = None
    justificativa: str | None = None

    class Config:
        from_attributes = True