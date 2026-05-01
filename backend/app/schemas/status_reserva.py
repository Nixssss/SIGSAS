from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class StatusReservaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome: str = Field(..., min_length=1, max_length=50)
    cor: str = Field(..., min_length=7, max_length=7)  # Hex color


class StatusReservaCreate(StatusReservaBase):
    pass


class StatusReservaResponse(StatusReservaBase):
    id: int
    ativo: bool = True

class StatusReservaUpdate(BaseModel):
    nome: str | None = None
    cor: str | None = None
    ativo: bool | None = None

