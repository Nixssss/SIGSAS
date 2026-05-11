from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class TabelaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome: str = Field(..., min_length=1, max_length=100)
    descricao: Optional[str] = None


class TabelaCreate(TabelaBase):
    pass


class TabelaUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    descricao: Optional[str] = None
    ativo: Optional[bool] = None


class Tabela(TabelaBase):
    id: int
    ativo: bool = True