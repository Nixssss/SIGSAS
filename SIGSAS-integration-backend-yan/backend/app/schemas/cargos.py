from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class CargoBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    salario: float = Field(..., gt=0.0)
    descricao: Optional[str] = Field(None, max_length=1000)
    ativo: bool = True

class CargoCreate(CargoBase):
    pass

class CargoUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome: Optional[str] = Field(None, min_length=3, max_length=100)
    salario: Optional[float] = Field(None, gt=0.0)
    descricao: Optional[str] = Field(None, max_length=1000)
    ativo: Optional[bool] = None

class Cargo(CargoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)