from pydantic import BaseModel


class CampusBase(BaseModel):
    nome: str
    endereco: str | None = None
    idInstituicao: int


class CampusCreate(CampusBase):
    pass


class CampusUpdate(BaseModel):
    nome: str | None = None
    endereco: str | None = None
    idInstituicao: int | None = None


class CampusRead(CampusBase):
    id: int

    class Config:
        from_attributes = True