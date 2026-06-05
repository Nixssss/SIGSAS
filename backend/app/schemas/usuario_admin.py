from pydantic import BaseModel, EmailStr


class UsuarioCursoAdminCreate(BaseModel):
    idCurso: int
    tipoVinculo: str | None = None


class UsuarioCursoAdminRead(BaseModel):
    id: int
    idCurso: int
    nomeCurso: str | None = None
    tipoVinculo: str


class UsuarioAdminCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    perfil: str = "Professor"
    matricula: str | None = None
    cargo: str | None = None
    idInstituicao: int | None = None
    cursos: list[UsuarioCursoAdminCreate] = []


class UsuarioAdminUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    senha: str | None = None
    perfil: str | None = None
    matricula: str | None = None
    cargo: str | None = None
    idInstituicao: int | None = None
    cursos: list[UsuarioCursoAdminCreate] | None = None


class UsuarioAdminRead(BaseModel):
    id: int
    nome: str
    email: EmailStr
    perfil: str
    matricula: str | None = None
    cargo: str | None = None
    idInstituicao: int | None = None
    instituicao: str | None = None
    cursos: list[UsuarioCursoAdminRead] = []

    class Config:
        from_attributes = True