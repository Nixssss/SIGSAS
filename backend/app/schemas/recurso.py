from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class RecursoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome: str = Field(..., min_length=1, max_length=100)
    descricao: Optional[str] = None


class RecursoCreate(RecursoBase):
    pass


class RecursoResponse(RecursoBase):
    id: int
    ativo: bool = True