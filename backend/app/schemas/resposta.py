from pydantic import BaseModel, ConfigDict, Field


class RespostaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    codigo: str = Field(..., min_length=1)
    texto: str = Field(..., min_length=1)

class RespostaCreate(RespostaBase):
    pass


class RespostaResponse(RespostaBase):
    id: int

class RespostaUpdate(BaseModel):
    codigo: str | None = None
    texto: str | None = None
