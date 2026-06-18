from pydantic import BaseModel, ConfigDict, Field


class ErroPalavraBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    palavra_id: int
    palavraerrada: str = Field(..., min_length=1)


class ErroPalavraCreate(ErroPalavraBase):
    pass


class ErroPalavraUpdate(BaseModel):
    palavra_id: int | None = None
    palavraerrada: str | None = None


class ErroPalavraResponse(ErroPalavraBase):
    id: int