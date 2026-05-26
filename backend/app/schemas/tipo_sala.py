from pydantic import BaseModel


class TipoSalaBase(BaseModel):
    nome: str


class TipoSalaCreate(TipoSalaBase):
    pass


class TipoSalaUpdate(BaseModel):
    nome: str | None = None


class TipoSalaRead(TipoSalaBase):
    id: int

    class Config:
        from_attributes = True