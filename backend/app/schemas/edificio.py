from pydantic import BaseModel


class EdificioBase(BaseModel):
    nome: str
    idCampus: int
    ativo: bool = True
    motivoInativo: str | None = None


class EdificioCreate(EdificioBase):
    pass


class EdificioUpdate(BaseModel):
    nome: str | None = None
    idCampus: int | None = None
    ativo: bool | None = None
    motivoInativo: str | None = None


class EdificioRead(EdificioBase):
    id: int

    class Config:
        from_attributes = True
