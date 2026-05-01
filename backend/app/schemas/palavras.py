from pydantic import BaseModel, ConfigDict, Field


class PalavraBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    palavra: str = Field(..., min_length=1)


class PalavraCreate(PalavraBase):
    pass


class PalavraResponse(PalavraBase):
    id: int


