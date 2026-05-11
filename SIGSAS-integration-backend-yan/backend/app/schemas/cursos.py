from pydantic import BaseModel, ConfigDict
from typing import Optional

class CursoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    carga_horaria: int

class CursoCreate(CursoBase):
    pass

class CursoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    carga_horaria: Optional[int] = None

class Curso(CursoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)