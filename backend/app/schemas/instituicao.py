from pydantic import BaseModel


class InstituicaoBase(BaseModel):
    nome: str


class InstituicaoCreate(InstituicaoBase):
    pass


class InstituicaoUpdate(BaseModel):
    nome: str | None = None


class InstituicaoRead(InstituicaoBase):
    id: int

    class Config:
        from_attributes = True