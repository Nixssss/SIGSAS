from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.instituicao import Instituicao
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserRead,
    RedefinirSenhaRequest,
)
from app.core.security import (
    verify_password,
    create_access_token,
    get_password_hash,
)
from app.services.auditoria_service import registrar_log


router = APIRouter()


def buscar_nome_instituicao(db: Session, id_instituicao: int | None):
    if not id_instituicao:
        return None

    instituicao = (
        db.query(Instituicao)
        .filter(Instituicao.id == id_instituicao)
        .first()
    )

    return instituicao.nome if instituicao else None


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        user = db.query(Usuario).filter(Usuario.email == data.email).first()

        if not user:
            registrar_log(
                db=db,
                acao="LOGIN_ERRO",
                modulo="Autenticação",
                etapa="login",
                descricao=f"Tentativa de login com e-mail não cadastrado: {data.email}",
                status="erro",
                erro="E-mail não encontrado",
                email_usuario=data.email,
                request=request,
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos",
            )

        if not verify_password(data.senha, user.senha_hash):
            registrar_log(
                db=db,
                acao="LOGIN_ERRO",
                modulo="Autenticação",
                etapa="login",
                descricao=f"Usuário {user.nome} tentou entrar com senha inválida",
                status="erro",
                erro="Senha inválida",
                id_usuario=user.id,
                request=request,
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos",
            )

        nome_instituicao = buscar_nome_instituicao(db, user.idInstituicao)

        token = create_access_token(
            {
                "sub": str(user.id),
                "id": user.id,
                "idUsuario": user.id,
                "nome": user.nome,
                "email": user.email,
                "perfil": user.perfil,
                "matricula": user.matricula,
                "cargo": user.cargo,
                "idInstituicao": user.idInstituicao,
                "instituicao": nome_instituicao,
            }
        )

        registrar_log(
            db=db,
            acao="LOGIN_SUCESSO",
            modulo="Autenticação",
            etapa="login",
            descricao=f"Usuário {user.nome} entrou no sistema",
            status="sucesso",
            id_usuario=user.id,
            request=request,
        )

        return {
            "access_token": token,
            "token_type": "bearer",
        }

    except HTTPException:
        raise

    except Exception as error:
        registrar_log(
            db=db,
            acao="LOGIN_ERRO_INTERNO",
            modulo="Autenticação",
            etapa="login",
            descricao="Erro interno ao realizar login",
            status="erro",
            erro=str(error),
            email_usuario=data.email,
            request=request,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao realizar login",
        )


@router.post(
    "/registrar",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def registrar_usuario(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        existing_user = db.query(Usuario).filter(Usuario.email == user_in.email).first()

        if existing_user:
            registrar_log(
                db=db,
                acao="CADASTRO_ERRO",
                modulo="Autenticação",
                etapa="cadastro",
                descricao=f"Tentativa de cadastro com e-mail já registrado: {user_in.email}",
                status="erro",
                erro="E-mail já registrado",
                email_usuario=user_in.email,
                request=request,
            )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email já registrado",
            )

        if user_in.idInstituicao is not None:
            instituicao = (
                db.query(Instituicao)
                .filter(Instituicao.id == user_in.idInstituicao)
                .first()
            )

            if not instituicao:
                registrar_log(
                    db=db,
                    acao="CADASTRO_ERRO",
                    modulo="Autenticação",
                    etapa="cadastro",
                    descricao=f"Tentativa de cadastro com instituição inexistente: {user_in.idInstituicao}",
                    status="erro",
                    erro="Instituição não encontrada",
                    email_usuario=user_in.email,
                    request=request,
                )

                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Instituição não encontrada",
                )

        hashed_password = get_password_hash(user_in.senha)

        db_user = Usuario(
            nome=user_in.nome.strip(),
            email=user_in.email.lower().strip(),
            senha_hash=hashed_password,
            perfil=user_in.perfil,
            matricula=user_in.matricula.strip() if user_in.matricula else None,
            cargo=user_in.cargo.strip() if user_in.cargo else None,
            idInstituicao=user_in.idInstituicao,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        nome_instituicao = buscar_nome_instituicao(db, db_user.idInstituicao)

        registrar_log(
            db=db,
            acao="CADASTRO_USUARIO",
            modulo="Autenticação",
            etapa="cadastro",
            descricao=f"Usuário {db_user.nome} realizou cadastro no sistema",
            status="sucesso",
            id_usuario=db_user.id,
            request=request,
        )

        return {
            "id": db_user.id,
            "nome": db_user.nome,
            "email": db_user.email,
            "perfil": db_user.perfil,
            "matricula": db_user.matricula,
            "cargo": db_user.cargo,
            "idInstituicao": db_user.idInstituicao,
            "instituicao": nome_instituicao,
        }

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="CADASTRO_ERRO_INTERNO",
            modulo="Autenticação",
            etapa="cadastro",
            descricao="Erro interno ao cadastrar usuário",
            status="erro",
            erro=str(error),
            email_usuario=user_in.email,
            request=request,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao cadastrar usuário",
        )


@router.post("/redefinir-senha")
def redefinir_senha(
    data: RedefinirSenhaRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        if not data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email não informado",
            )

        if not data.nova_senha:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nova senha não informada",
            )

        if len(data.nova_senha) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A senha deve ter no mínimo 6 caracteres",
            )

        user = db.query(Usuario).filter(Usuario.email == data.email).first()

        if not user:
            registrar_log(
                db=db,
                acao="REDEFINIR_SENHA_ERRO",
                modulo="Autenticação",
                etapa="redefinir_senha",
                descricao=f"Tentativa de redefinir senha de usuário inexistente: {data.email}",
                status="erro",
                erro="Usuário não encontrado",
                email_usuario=data.email,
                request=request,
            )

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        user.senha_hash = get_password_hash(data.nova_senha)

        db.commit()
        db.refresh(user)

        registrar_log(
            db=db,
            acao="REDEFINIR_SENHA",
            modulo="Autenticação",
            etapa="redefinir_senha",
            descricao=f"Senha do usuário {user.nome} foi redefinida",
            status="sucesso",
            id_usuario=user.id,
            request=request,
        )

        return {
            "detail": "Senha redefinida com sucesso",
            "email": user.email,
        }

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="REDEFINIR_SENHA_ERRO_INTERNO",
            modulo="Autenticação",
            etapa="redefinir_senha",
            descricao="Erro interno ao redefinir senha",
            status="erro",
            erro=str(error),
            email_usuario=data.email,
            request=request,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao redefinir senha",
        )