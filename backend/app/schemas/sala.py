from pydantic import BaseModel


class SalaBase(BaseModel):
    idTipoSala: int
    idEdificio: int
    nome: str
    numero: str
    capacidade: int
    metragem: int
    andar: int
    ativo: bool = True
    recursos: list[int] = []


class SalaCreate(SalaBase):
    pass


class SalaUpdate(BaseModel):
    idTipoSala: int | None = None
    idEdificio: int | None = None
    nome: str | None = None
    numero: str | None = None
    capacidade: int | None = None
    metragem: int | None = None
    andar: int | None = None
    ativo: bool | None = None
    recursos: list[int] | None = None


class SalaRead(BaseModel):
    idSala: int
    idTipoSala: int
    idEdificio: int
    nome: str
    numero: str
    capacidade: int
    metragem: int
    andar: int
    ativo: bool
    recursos: list[int] = []

    class Config:
        from_attributes = True