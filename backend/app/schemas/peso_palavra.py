from pydantic import BaseModel, ConfigDict
from typing import Optional

class PesoPalavraBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    palavra_id: int
    peso: float

class PesoPalavraCreate(PesoPalavraBase):
    pass

class PesoPalavraUpdate(BaseModel):
    palavra_id: Optional[int] = None
    peso: Optional[float] = None

class PesoPalavra(PesoPalavraBase):
    id: int
