from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.curso import Curso
from app.models.usuario_curso import UsuarioCurso


router = APIRouter(prefix="/usuario-cursos", tags=["Usuários - Cursos"])


TIPOS_VINCULO_PERMITIDOS = {
    "Administrador",
    "Coordenador",
    "Professor",
}


class UsuarioCursoCreate(BaseModel):
    idCurso: int
    tipoVinculo: str


class UsuarioCursoReplace(BaseModel):
    vinculos: list[UsuarioCursoCreate]


class UsuarioCursoResponse(BaseModel):
    id: int
    idUsuario: int
    idCurso: int
    tipoVinculo: str
    nomeCurso: str | None = None


def normalizar_tipo_vinculo(tipo: str):
    texto = str(tipo or "").strip().lower()

    if texto in {"administrador", "admin", "dono"}:
        return "Administrador"

    if texto in {"coordenador", "coord"}:
        return "Coordenador"

    if texto in {"professor", "docente"}:
        return "Professor"

    return str(tipo or "").strip()


def montar_response(vinculo: UsuarioCurso):
    return {
        "id": vinculo.id,
        "idUsuario": vinculo.idUsuario,
        "idCurso": vinculo.idCurso,
        "tipoVinculo": vinculo.tipoVinculo,
        "nomeCurso": vinculo.curso.nome if vinculo.curso else None,
    }


def validar_usuario(db: Session, id_usuario: int):
    usuario = db.query(Usuario).filter(Usuario.id == id_usuario).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return usuario


def validar_curso(db: Session, id_curso: int):
    curso = db.query(Curso).filter(Curso.id == id_curso).first()

    if not curso:
        raise HTTPException(status_code=404, detail="Curso não encontrado")

    return curso


def validar_tipo_vinculo(tipo: str):
    tipo_normalizado = normalizar_tipo_vinculo(tipo)

    if tipo_normalizado not in TIPOS_VINCULO_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Tipo de vínculo inválido. Use: "
                "Administrador, Coordenador ou Professor"
            ),
        )

    return tipo_normalizado


@router.get("/usuario/{id_usuario}", response_model=list[UsuarioCursoResponse])
def listar_cursos_do_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
):
    validar_usuario(db, id_usuario)

    vinculos = (
        db.query(UsuarioCurso)
        .options(joinedload(UsuarioCurso.curso))
        .filter(UsuarioCurso.idUsuario == id_usuario)
        .order_by(UsuarioCurso.tipoVinculo.asc(), UsuarioCurso.idCurso.asc())
        .all()
    )

    return [montar_response(v) for v in vinculos]


@router.post("/usuario/{id_usuario}", response_model=UsuarioCursoResponse)
def adicionar_curso_ao_usuario(
    id_usuario: int,
    dados: UsuarioCursoCreate,
    db: Session = Depends(get_db),
):
    validar_usuario(db, id_usuario)
    validar_curso(db, dados.idCurso)

    tipo_vinculo = validar_tipo_vinculo(dados.tipoVinculo)

    vinculo_existente = (
        db.query(UsuarioCurso)
        .filter(
            UsuarioCurso.idUsuario == id_usuario,
            UsuarioCurso.idCurso == dados.idCurso,
            UsuarioCurso.tipoVinculo == tipo_vinculo,
        )
        .first()
    )

    if vinculo_existente:
        raise HTTPException(
            status_code=400,
            detail="Este vínculo já existe para o usuário",
        )

    novo_vinculo = UsuarioCurso(
        idUsuario=id_usuario,
        idCurso=dados.idCurso,
        tipoVinculo=tipo_vinculo,
    )

    db.add(novo_vinculo)
    db.commit()
    db.refresh(novo_vinculo)

    novo_vinculo = (
        db.query(UsuarioCurso)
        .options(joinedload(UsuarioCurso.curso))
        .filter(UsuarioCurso.id == novo_vinculo.id)
        .first()
    )

    return montar_response(novo_vinculo)


@router.put("/usuario/{id_usuario}", response_model=list[UsuarioCursoResponse])
def substituir_cursos_do_usuario(
    id_usuario: int,
    dados: UsuarioCursoReplace,
    db: Session = Depends(get_db),
):
    validar_usuario(db, id_usuario)

    novos_vinculos = []
    chaves = set()

    for item in dados.vinculos:
        validar_curso(db, item.idCurso)

        tipo_vinculo = validar_tipo_vinculo(item.tipoVinculo)
        chave = (item.idCurso, tipo_vinculo)

        if chave in chaves:
            continue

        chaves.add(chave)

        novos_vinculos.append(
            UsuarioCurso(
                idUsuario=id_usuario,
                idCurso=item.idCurso,
                tipoVinculo=tipo_vinculo,
            )
        )

    db.query(UsuarioCurso).filter(UsuarioCurso.idUsuario == id_usuario).delete()

    for vinculo in novos_vinculos:
        db.add(vinculo)

    db.commit()

    vinculos_salvos = (
        db.query(UsuarioCurso)
        .options(joinedload(UsuarioCurso.curso))
        .filter(UsuarioCurso.idUsuario == id_usuario)
        .order_by(UsuarioCurso.tipoVinculo.asc(), UsuarioCurso.idCurso.asc())
        .all()
    )

    return [montar_response(v) for v in vinculos_salvos]


@router.delete("/{id_vinculo}")
def remover_vinculo_usuario_curso(
    id_vinculo: int,
    db: Session = Depends(get_db),
):
    vinculo = (
        db.query(UsuarioCurso)
        .filter(UsuarioCurso.id == id_vinculo)
        .first()
    )

    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")

    db.delete(vinculo)
    db.commit()

    return {
        "message": "Vínculo removido com sucesso"
    }


@router.delete("/usuario/{id_usuario}/curso/{id_curso}/tipo/{tipo_vinculo}")
def remover_vinculo_por_usuario_curso_tipo(
    id_usuario: int,
    id_curso: int,
    tipo_vinculo: str,
    db: Session = Depends(get_db),
):
    tipo_vinculo_normalizado = validar_tipo_vinculo(tipo_vinculo)

    vinculo = (
        db.query(UsuarioCurso)
        .filter(
            UsuarioCurso.idUsuario == id_usuario,
            UsuarioCurso.idCurso == id_curso,
            UsuarioCurso.tipoVinculo == tipo_vinculo_normalizado,
        )
        .first()
    )

    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")

    db.delete(vinculo)
    db.commit()

    return {
        "message": "Vínculo removido com sucesso"
    }