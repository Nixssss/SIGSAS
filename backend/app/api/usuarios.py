from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.instituicao import Instituicao
from app.models.curso import Curso
from app.models.usuario_curso import UsuarioCurso
from app.schemas.usuario_admin import (
    UsuarioAdminCreate,
    UsuarioAdminUpdate,
    UsuarioAdminRead,
)
from app.core.security import get_password_hash
from app.services.auditoria_service import registrar_log


router = APIRouter(prefix="/usuarios", tags=["Usuários"])


PERFIS_PERMITIDOS = {
    "Administrador",
    "Coordenador",
    "Professor",
}


def normalizar_perfil(perfil: str | None):
    texto = str(perfil or "").strip().lower()

    if texto in {"administrador", "admin", "dono"}:
        return "Administrador"

    if texto in {"coordenador", "coord"}:
        return "Coordenador"

    if texto in {"professor", "docente", "usuario", "usuário"}:
        return "Professor"

    return str(perfil or "").strip()


def normalizar_tipo_vinculo(tipo: str | None, perfil: str):
    if not tipo:
        return perfil

    texto = str(tipo or "").strip().lower()

    if texto in {"administrador", "admin", "dono"}:
        return "Administrador"

    if texto in {"coordenador", "coord"}:
        return "Coordenador"

    if texto in {"professor", "docente", "usuario", "usuário"}:
        return "Professor"

    return str(tipo or "").strip()


def buscar_curso_dono(db: Session):
    curso = db.query(Curso).filter(Curso.nome.ilike("DONO")).first()

    if not curso:
        curso = Curso(nome="DONO")
        db.add(curso)
        db.flush()

    return curso


def validar_instituicao(db: Session, id_instituicao: int | None):
    if id_instituicao is None:
        return None

    instituicao = (
        db.query(Instituicao)
        .filter(Instituicao.id == id_instituicao)
        .first()
    )

    if not instituicao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instituição não encontrada",
        )

    return instituicao


def validar_cursos_usuario(db: Session, perfil: str, cursos_recebidos: list):
    if perfil not in PERFIS_PERMITIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Perfil inválido. Use Administrador, Coordenador ou Professor.",
        )

    if perfil == "Administrador":
        curso_dono = buscar_curso_dono(db)

        return [
            {
                "idCurso": curso_dono.id,
                "tipoVinculo": "Administrador",
            }
        ]

    if perfil == "Coordenador":
        if len(cursos_recebidos) != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coordenador deve estar vinculado a exatamente um curso.",
            )

    if perfil == "Professor":
        if not cursos_recebidos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Professor deve estar vinculado a pelo menos um curso.",
            )

    cursos_validados = []
    chaves = set()

    for item in cursos_recebidos:
        curso = db.query(Curso).filter(Curso.id == item.idCurso).first()

        if not curso:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Curso #{item.idCurso} não encontrado.",
            )

        tipo_vinculo = normalizar_tipo_vinculo(item.tipoVinculo, perfil)

        if tipo_vinculo not in PERFIS_PERMITIDOS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de vínculo inválido. Use Administrador, Coordenador ou Professor.",
            )

        if perfil == "Coordenador":
            tipo_vinculo = "Coordenador"

        if perfil == "Professor":
            tipo_vinculo = "Professor"

        chave = (item.idCurso, tipo_vinculo)

        if chave in chaves:
            continue

        chaves.add(chave)

        cursos_validados.append(
            {
                "idCurso": item.idCurso,
                "tipoVinculo": tipo_vinculo,
            }
        )

    return cursos_validados


def substituir_cursos_usuario(
    db: Session,
    usuario: Usuario,
    cursos_validados: list[dict],
):
    db.query(UsuarioCurso).filter(
        UsuarioCurso.idUsuario == usuario.id
    ).delete()

    for item in cursos_validados:
        db.add(
            UsuarioCurso(
                idUsuario=usuario.id,
                idCurso=item["idCurso"],
                tipoVinculo=item["tipoVinculo"],
            )
        )


def montar_curso_usuario_response(vinculo: UsuarioCurso):
    return {
        "id": vinculo.id,
        "idCurso": vinculo.idCurso,
        "nomeCurso": vinculo.curso.nome if vinculo.curso else None,
        "tipoVinculo": vinculo.tipoVinculo,
    }


def montar_usuario_response(db: Session, usuario: Usuario):
    nome_instituicao = None

    if usuario.idInstituicao:
        instituicao = (
            db.query(Instituicao)
            .filter(Instituicao.id == usuario.idInstituicao)
            .first()
        )

        if instituicao:
            nome_instituicao = instituicao.nome

    vinculos = (
        db.query(UsuarioCurso)
        .options(joinedload(UsuarioCurso.curso))
        .filter(UsuarioCurso.idUsuario == usuario.id)
        .order_by(UsuarioCurso.tipoVinculo.asc(), UsuarioCurso.idCurso.asc())
        .all()
    )

    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "perfil": usuario.perfil,
        "matricula": usuario.matricula,
        "cargo": usuario.cargo,
        "idInstituicao": usuario.idInstituicao,
        "instituicao": nome_instituicao,
        "cursos": [montar_curso_usuario_response(vinculo) for vinculo in vinculos],
    }


@router.get("", response_model=list[UsuarioAdminRead])
def listar_usuarios(db: Session = Depends(get_db)):
    try:
        usuarios = db.query(Usuario).order_by(Usuario.nome.asc()).all()
        return [montar_usuario_response(db, usuario) for usuario in usuarios]

    except Exception as error:
        registrar_log(
            db=db,
            acao="LISTAR_USUARIOS_ERRO",
            modulo="Usuários",
            descricao="Erro ao listar usuários",
            status="erro",
            erro=str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao listar usuários",
        )


@router.get("/{idUsuario}", response_model=UsuarioAdminRead)
def buscar_usuario(idUsuario: int, db: Session = Depends(get_db)):
    try:
        usuario = db.query(Usuario).filter(Usuario.id == idUsuario).first()

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        return montar_usuario_response(db, usuario)

    except HTTPException:
        raise

    except Exception as error:
        registrar_log(
            db=db,
            acao="BUSCAR_USUARIO_ERRO",
            modulo="Usuários",
            descricao=f"Erro ao buscar usuário #{idUsuario}",
            status="erro",
            erro=str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar usuário",
        )


@router.post(
    "",
    response_model=UsuarioAdminRead,
    status_code=status.HTTP_201_CREATED,
)
def criar_usuario_admin(
    dados: UsuarioAdminCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        email = dados.email.lower().strip()
        perfil = normalizar_perfil(dados.perfil)

        email_existente = db.query(Usuario).filter(Usuario.email == email).first()

        if email_existente:
            registrar_log(
                db=db,
                acao="CRIAR_USUARIO_ERRO",
                modulo="Usuários",
                descricao=f"Tentativa de criar usuário com e-mail já existente: {email}",
                status="erro",
                erro="E-mail já existente",
                email_usuario=email,
            )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um usuário com este e-mail",
            )

        validar_instituicao(db, dados.idInstituicao)

        if len(dados.senha) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A senha deve ter no mínimo 6 caracteres",
            )

        cursos_validados = validar_cursos_usuario(
            db=db,
            perfil=perfil,
            cursos_recebidos=dados.cursos,
        )

        usuario = Usuario(
            nome=dados.nome.strip(),
            email=email,
            senha_hash=get_password_hash(dados.senha),
            perfil=perfil,
            matricula=dados.matricula.strip() if dados.matricula else None,
            cargo=dados.cargo.strip() if dados.cargo else None,
            idInstituicao=dados.idInstituicao,
        )

        db.add(usuario)
        db.flush()

        substituir_cursos_usuario(
            db=db,
            usuario=usuario,
            cursos_validados=cursos_validados,
        )

        db.commit()
        db.refresh(usuario)

        registrar_log(
            db=db,
            acao="CRIAR_USUARIO",
            modulo="Usuários",
            descricao=f"Usuário {usuario.nome} foi criado pela administração",
            status="sucesso",
            id_usuario=usuario.id,
        )

        return montar_usuario_response(db, usuario)

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="CRIAR_USUARIO_ERRO_INTERNO",
            modulo="Usuários",
            descricao="Erro interno ao criar usuário",
            status="erro",
            erro=str(error),
            email_usuario=dados.email,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao criar usuário",
        )


@router.put("/{idUsuario}", response_model=UsuarioAdminRead)
def atualizar_usuario_admin(
    idUsuario: int,
    dados: UsuarioAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        usuario = db.query(Usuario).filter(Usuario.id == idUsuario).first()

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        perfil_final = usuario.perfil

        if dados.perfil is not None:
            perfil_final = normalizar_perfil(dados.perfil)

            if perfil_final not in PERFIS_PERMITIDOS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Perfil inválido. Use Administrador, Coordenador ou Professor.",
                )

        if dados.email is not None:
            email = dados.email.lower().strip()

            email_existente = (
                db.query(Usuario)
                .filter(
                    Usuario.email == email,
                    Usuario.id != idUsuario,
                )
                .first()
            )

            if email_existente:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Já existe outro usuário com este e-mail",
                )

            usuario.email = email

        if dados.idInstituicao is not None:
            validar_instituicao(db, dados.idInstituicao)
            usuario.idInstituicao = dados.idInstituicao

        if dados.idInstituicao is None and "idInstituicao" in dados.model_fields_set:
            usuario.idInstituicao = None

        if dados.nome is not None:
            usuario.nome = dados.nome.strip()

        if dados.perfil is not None:
            usuario.perfil = perfil_final

        if dados.matricula is not None:
            usuario.matricula = dados.matricula.strip() if dados.matricula else None

        if dados.cargo is not None:
            usuario.cargo = dados.cargo.strip() if dados.cargo else None

        if dados.senha is not None and dados.senha.strip():
            if len(dados.senha) < 6:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A senha deve ter no mínimo 6 caracteres",
                )

            usuario.senha_hash = get_password_hash(dados.senha)

        if dados.cursos is not None:
            cursos_validados = validar_cursos_usuario(
                db=db,
                perfil=perfil_final,
                cursos_recebidos=dados.cursos,
            )

            substituir_cursos_usuario(
                db=db,
                usuario=usuario,
                cursos_validados=cursos_validados,
            )

        db.commit()
        db.refresh(usuario)

        registrar_log(
            db=db,
            acao="ATUALIZAR_USUARIO",
            modulo="Usuários",
            descricao=f"Dados do usuário {usuario.nome} foram atualizados",
            status="sucesso",
            id_usuario=usuario.id,
        )

        return montar_usuario_response(db, usuario)

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="ATUALIZAR_USUARIO_ERRO_INTERNO",
            modulo="Usuários",
            descricao=f"Erro interno ao atualizar usuário #{idUsuario}",
            status="erro",
            erro=str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao atualizar usuário",
        )


@router.delete("/{idUsuario}")
def excluir_usuario_admin(
    idUsuario: int,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        usuario = db.query(Usuario).filter(Usuario.id == idUsuario).first()

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        nome_usuario = usuario.nome
        email_usuario = usuario.email

        db.delete(usuario)
        db.commit()

        registrar_log(
            db=db,
            acao="EXCLUIR_USUARIO",
            modulo="Usuários",
            descricao=f"Usuário {nome_usuario} foi excluído pela administração",
            status="sucesso",
            nome_usuario=nome_usuario,
            email_usuario=email_usuario,
        )

        return {
            "detail": "Usuário excluído com sucesso",
            "id": idUsuario,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="EXCLUIR_USUARIO_ERRO_INTERNO",
            modulo="Usuários",
            descricao=f"Erro interno ao excluir usuário #{idUsuario}",
            status="erro",
            erro=str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao excluir usuário",
        )