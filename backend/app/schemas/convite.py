from datetime import datetime
from pydantic import BaseModel, EmailStr


class ConviteCreate(BaseModel):
    email: EmailStr
    validadeHoras: int = 48
    criadoPor: int | None = None


class ConviteRead(BaseModel):
    idConvite: int
    email: EmailStr
    token: str
    usado: bool
    criadoEm: datetime
    expiraEm: datetime
    usadoEm: datetime | None = None
    criadoPor: int | None = None
    linkCadastro: str | None = None

    class Config:
        from_attributes = True


class ConviteValidacaoRead(BaseModel):
    valido: bool
    mensagem: str
    email: EmailStr | None = None
    token: str | None = None