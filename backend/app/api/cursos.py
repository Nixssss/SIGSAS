from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.curso import Curso
from app.models.usuario_curso import UsuarioCurso
from app.models.reserva import Reserva


router = APIRouter(prefix="/cursos", tags=["Cursos"])


class CursoCreate(BaseModel):
    nome: str


class CursoUpdate(BaseModel):
    nome: str


class CursoResponse(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True


def normalizar_nome(nome: str):
    return " ".join(str(nome or "").strip().split())


def buscar_curso_por_nome(db: Session, nome: str):
    nome_limpo = normalizar_nome(nome)

    return (
        db.query(Curso)
        .filter(Curso.nome.ilike(nome_limpo))
        .first()
    )


@router.get("", response_model=list[CursoResponse])
def listar_cursos(db: Session = Depends(get_db)):
    cursos = (
        db.query(Curso)
        .order_by(Curso.nome.asc())
        .all()
    )

    return cursos


@router.get("/{id_curso}", response_model=CursoResponse)
def buscar_curso(id_curso: int, db: Session = Depends(get_db)):
    curso = db.query(Curso).filter(Curso.id == id_curso).first()

    if not curso:
        raise HTTPException(status_code=404, detail="Curso não encontrado")

    return curso


@router.post("", response_model=CursoResponse)
def criar_curso(dados: CursoCreate, db: Session = Depends(get_db)):
    nome = normalizar_nome(dados.nome)

    if not nome:
        raise HTTPException(status_code=400, detail="Informe o nome do curso")

    curso_existente = buscar_curso_por_nome(db, nome)

    if curso_existente:
        raise HTTPException(status_code=400, detail="Este curso já está cadastrado")

    novo_curso = Curso(nome=nome)

    db.add(novo_curso)
    db.commit()
    db.refresh(novo_curso)

    return novo_curso


@router.put("/{id_curso}", response_model=CursoResponse)
def atualizar_curso(
    id_curso: int,
    dados: CursoUpdate,
    db: Session = Depends(get_db),
):
    curso = db.query(Curso).filter(Curso.id == id_curso).first()

    if not curso:
        raise HTTPException(status_code=404, detail="Curso não encontrado")

    nome = normalizar_nome(dados.nome)

    if not nome:
        raise HTTPException(status_code=400, detail="Informe o nome do curso")

    curso_existente = (
        db.query(Curso)
        .filter(Curso.id != id_curso)
        .filter(Curso.nome.ilike(nome))
        .first()
    )

    if curso_existente:
        raise HTTPException(status_code=400, detail="Já existe outro curso com este nome")

    curso.nome = nome

    db.commit()
    db.refresh(curso)

    return curso


@router.delete("/{id_curso}")
def excluir_curso(id_curso: int, db: Session = Depends(get_db)):
    curso = db.query(Curso).filter(Curso.id == id_curso).first()

    if not curso:
        raise HTTPException(status_code=404, detail="Curso não encontrado")

    if curso.nome.strip().lower() == "dono":
        raise HTTPException(
            status_code=400,
            detail="O curso DONO não pode ser excluído",
        )

    existe_usuario_vinculado = (
        db.query(UsuarioCurso)
        .filter(UsuarioCurso.idCurso == id_curso)
        .first()
    )

    if existe_usuario_vinculado:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir um curso vinculado a usuários",
        )

    existe_reserva_vinculada = (
        db.query(Reserva)
        .filter(Reserva.idCursoReserva == id_curso)
        .first()
    )

    if existe_reserva_vinculada:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir um curso vinculado a reservas",
        )

    db.delete(curso)
    db.commit()

    return {
        "message": "Curso excluído com sucesso"
    }