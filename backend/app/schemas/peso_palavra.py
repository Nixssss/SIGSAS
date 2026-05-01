from pydantic import BaseModel, ConfigDict


class PesoPalavraBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    palavra_id: int
    peso: float


class PesoPalavraCreate(PesoPalavraBase):
    pass


class PesoPalavraUpdate(BaseModel):
    palavra_id: int | None = None
    peso: float | None = None


class PesoPalavraResponse(PesoPalavraBase):
    id: int