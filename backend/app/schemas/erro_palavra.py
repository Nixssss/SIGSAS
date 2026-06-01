from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class ErroPalavraBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    palavra: str = Field(..., min_length=1)
    quantidade_erros: int = Field(..., ge=0)

class ErroPalavraCreate(ErroPalavraBase):
    pass

class ErroPalavraUpdate(BaseModel):
    palavra: Optional[str] = Field(None, min_length=1)
    quantidade_erros: Optional[int] = Field(None, ge=0)

class ErroPalavra(ErroPalavraBase):
    id: int
