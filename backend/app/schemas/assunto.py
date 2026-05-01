from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class AssuntoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome: str = Field(..., min_length=1, max_length=100)


class AssuntoCreate(AssuntoBase):
    pass


class AssuntoResponse(AssuntoBase):
    id: int
    ativo: bool = True

