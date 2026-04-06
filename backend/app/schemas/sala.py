from pydantic import BaseModel, Field

class SalaCreate(BaseModel):
    nome: str
    capacidade: int = Field(gt=0)
    tipo: str
    edificio: str

class SalaRead(SalaCreate):
    id: int

    class Config:
        from_attributes = True