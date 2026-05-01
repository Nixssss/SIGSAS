from pydantic import BaseModel, ConfigDict, Field


class PesoPalavraBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    palavra_id: int
    peso: float


class PesoPalavraCreate(PesoPalavraBase):
    pass


class PesoPalavraResponse(PesoPalavraBase):
    id: int