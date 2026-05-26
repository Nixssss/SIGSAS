from pydantic import BaseModel


class CargoCreate(BaseModel):
    nome: str
    ativo: bool = True


class CargoUpdate(BaseModel):
    nome: str | None = None
    ativo: bool | None = None


class CargoRead(BaseModel):
    id: int
    nome: str
    ativo: bool

    class Config:
        from_attributes = True