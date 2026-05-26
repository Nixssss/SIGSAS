from pydantic import BaseModel, ConfigDict, Field


class RespostaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    frase_id: int
    texto_resposta: str = Field(..., min_length=1)


class RespostaCreate(RespostaBase):
    pass


class RespostaResponse(RespostaBase):
    id: int

class RespostaUpdate(BaseModel):
    frase_id: int | None = None
    texto_resposta: str | None = None
