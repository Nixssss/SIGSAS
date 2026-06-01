from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class FraseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    texto: str = Field(..., min_length=1)

class FraseCreate(FraseBase):
    pass

class FraseUpdate(BaseModel):
    texto: Optional[str] = Field(None, min_length=1)

class Frase(FraseBase):
    id: int
