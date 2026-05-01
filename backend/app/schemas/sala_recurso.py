from pydantic import BaseModel, ConfigDict, Field


class SalaRecursoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sala_id: int
    recurso_id: int


class SalaRecursoCreate(SalaRecursoBase):
    pass


class SalaRecursoResponse(SalaRecursoBase):
    id: int
    
class SalaRecursoUpdate(BaseModel):
    sala_id: int | None = None
    recurso_id: int | None = None
    
class SalaRecurso(SalaRecursoBase):
    id: int