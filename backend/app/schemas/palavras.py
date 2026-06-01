from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class PalavraBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    palavra: str = Field(..., min_length=1)

class PalavraCreate(PalavraBase):
    pass

class PalavraUpdate(BaseModel):
    palavra: Optional[str] = Field(None, min_length=1)

class Palavra(PalavraBase):
    id: int
