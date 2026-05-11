from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class SalaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome: str = Field(..., min_length=1, max_length=100)
    capacidade: int = Field(..., ge=1)
    tipo_sala_id: int


class SalaCreate(SalaBase):
    pass


class SalaResponse(SalaBase):
    id: int
    ativo: bool = True