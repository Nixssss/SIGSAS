from pydantic import BaseModel, ConfigDict, Field

class SalaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome: str = Field(..., min_length=1, max_length=100)
    capacidade: int = Field(..., gt=0)
    tipo: str = Field(..., min_length=1, max_length=50)
    status: str = "disponivel"

class SalaCreate(SalaBase):
    pass

class SalaUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1, max_length=100)
    capacidade: int | None = Field(None, gt=0)
    tipo: str | None = Field(None, min_length=1, max_length=50)
    status: str | None = None

class Sala(SalaBase):
    id: int
