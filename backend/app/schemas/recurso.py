from pydantic import BaseModel


class RecursoBase(BaseModel):
    nome: str


class RecursoCreate(RecursoBase):
    pass


class RecursoUpdate(BaseModel):
    nome: str | None = None


class RecursoRead(RecursoBase):
    id: int

    class Config:
        from_attributes = True