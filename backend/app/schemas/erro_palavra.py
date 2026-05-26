from pydantic import BaseModel, ConfigDict, Field


class ErroPalavraBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    palavra: str = Field(..., min_length=1)
    quantidade_erros: int = Field(..., ge=0)


class ErroPalavraCreate(ErroPalavraBase):
    pass


class ErroPalavraUpdate(BaseModel):
    palavra: str | None = None
    quantidade_erros: int | None = None


class ErroPalavraResponse(ErroPalavraBase):
    id: int