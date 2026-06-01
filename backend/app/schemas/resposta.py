from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class RespostaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    frase_id: int
    texto_resposta: str = Field(..., min_length=1)

class RespostaCreate(RespostaBase):
    pass

class RespostaUpdate(BaseModel):
    frase_id: Optional[int] = None
    texto_resposta: Optional[str] = Field(None, min_length=1)

class Resposta(RespostaBase):
    id: int
