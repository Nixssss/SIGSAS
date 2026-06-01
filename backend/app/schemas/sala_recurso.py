from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class SalaRecursoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sala_id: int
    recurso_id: int

class SalaRecursoCreate(SalaRecursoBase):
    pass

class SalaRecursoUpdate(BaseModel):
    sala_id: Optional[int] = None
    recurso_id: Optional[int] = None

class SalaRecurso(SalaRecursoBase):
    id: int
