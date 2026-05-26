from pydantic import BaseModel


class EdificioBase(BaseModel):
    nome: str
    idCampus: int


class EdificioCreate(EdificioBase):
    pass


class EdificioUpdate(BaseModel):
    nome: str | None = None
    idCampus: int | None = None


class EdificioRead(EdificioBase):
    id: int

    class Config:
        from_attributes = True