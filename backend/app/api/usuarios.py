from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.instituicao import Instituicao
from app.schemas.usuario_admin import (
    UsuarioAdminCreate,
    UsuarioAdminUpdate,
    UsuarioAdminRead,
)
from app.core.security import get_password_hash
from app.services.auditoria_service import registrar_log


router = APIRouter(prefix="/usuarios", tags=["Usuários"])


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

    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "perfil": usuario.perfil,
        "matricula": usuario.matricula,
        "cargo": usuario.cargo,
        "idInstituicao": usuario.idInstituicao,
        "instituicao": nome_instituicao,
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
    db: Session = Depends(get_db),
):
    try:
        email_existente = db.query(Usuario).filter(Usuario.email == dados.email).first()

        if email_existente:
            registrar_log(
                db=db,
                acao="CRIAR_USUARIO_ERRO",
                modulo="Usuários",
                descricao=f"Tentativa de criar usuário com e-mail já existente: {dados.email}",
                status="erro",
                erro="E-mail já existente",
                email_usuario=dados.email,
            )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um usuário com este e-mail",
            )

        if dados.idInstituicao is not None:
            instituicao = (
                db.query(Instituicao)
                .filter(Instituicao.id == dados.idInstituicao)
                .first()
            )

            if not instituicao:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Instituição não encontrada",
                )

        if len(dados.senha) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A senha deve ter no mínimo 6 caracteres",
            )

        usuario = Usuario(
            nome=dados.nome,
            email=dados.email,
            senha_hash=get_password_hash(dados.senha),
            perfil=dados.perfil,
            matricula=dados.matricula,
            cargo=dados.cargo,
            idInstituicao=dados.idInstituicao,
        )

        db.add(usuario)
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
    db: Session = Depends(get_db),
):
    try:
        usuario = db.query(Usuario).filter(Usuario.id == idUsuario).first()

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        if dados.email is not None:
            email_existente = (
                db.query(Usuario)
                .filter(
                    Usuario.email == dados.email,
                    Usuario.id != idUsuario,
                )
                .first()
            )

            if email_existente:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Já existe outro usuário com este e-mail",
                )

            usuario.email = dados.email

        if dados.idInstituicao is not None:
            instituicao = (
                db.query(Instituicao)
                .filter(Instituicao.id == dados.idInstituicao)
                .first()
            )

            if not instituicao:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Instituição não encontrada",
                )

            usuario.idInstituicao = dados.idInstituicao

        if dados.idInstituicao is None and "idInstituicao" in dados.model_fields_set:
            usuario.idInstituicao = None

        if dados.nome is not None:
            usuario.nome = dados.nome

        if dados.perfil is not None:
            usuario.perfil = dados.perfil

        if dados.matricula is not None:
            usuario.matricula = dados.matricula

        if dados.cargo is not None:
            usuario.cargo = dados.cargo

        if dados.senha is not None and dados.senha.strip():
            if len(dados.senha) < 6:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A senha deve ter no mínimo 6 caracteres",
                )

            usuario.senha_hash = get_password_hash(dados.senha)

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