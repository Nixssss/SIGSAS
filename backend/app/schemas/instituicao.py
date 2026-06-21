from pydantic import BaseModel


class InstituicaoBase(BaseModel):
    nome: str
    ativo: bool = True
    motivoInativo: str | None = None


class InstituicaoCreate(InstituicaoBase):
    pass


class InstituicaoUpdate(BaseModel):
    nome: str | None = None
    ativo: bool | None = None
    motivoInativo: str | None = None


class InstituicaoRead(InstituicaoBase):
    id: int

    class Config:
        from_attributes = True
