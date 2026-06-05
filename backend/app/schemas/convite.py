from datetime import datetime
from pydantic import BaseModel, EmailStr


class ConviteCursoCreate(BaseModel):
    idCurso: int
    tipoVinculo: str | None = None


class ConviteCursoRead(BaseModel):
    id: int
    idCurso: int
    nomeCurso: str | None = None
    tipoVinculo: str


class ConviteCreate(BaseModel):
    email: EmailStr
    validadeHoras: int = 48
    criadoPor: int | None = None
    perfilConvidado: str = "Professor"
    cursos: list[ConviteCursoCreate] = []


class ConviteRead(BaseModel):
    idConvite: int
    email: EmailStr
    token: str
    usado: bool
    criadoEm: datetime
    expiraEm: datetime
    usadoEm: datetime | None = None
    criadoPor: int | None = None
    perfilConvidado: str = "Professor"
    cursos: list[ConviteCursoRead] = []
    linkCadastro: str | None = None

    class Config:
        from_attributes = True


class ConviteValidacaoRead(BaseModel):
    valido: bool
    mensagem: str
    email: EmailStr | None = None
    token: str | None = None
    perfilConvidado: str | None = None
    cursos: list[ConviteCursoRead] = []