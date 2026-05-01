from pydantic import BaseModel, ConfigDict, Field


class FraseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    texto: str = Field(..., min_length=1)


class FraseCreate(FraseBase):
    pass


class FraseResponse(FraseBase):
    id: int
