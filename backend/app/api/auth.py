from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.instituicao import Instituicao
from app.models.curso import Curso
from app.models.usuario_curso import UsuarioCurso
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
from app.services.email_resend_service import enviar_email_recuperacao_senha


router = APIRouter()


PERFIS_PERMITIDOS = {
    "Administrador",
    "Coordenador",
    "Professor",
}


class RecuperacaoSenhaEmailRequest(BaseModel):
    email: str
    token: str


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


def buscar_nome_instituicao(db: Session, id_instituicao: int | None):
    if not id_instituicao:
        return None

    instituicao = (
        db.query(Instituicao)
        .filter(Instituicao.id == id_instituicao)
        .first()
    )

    return instituicao.nome if instituicao else None


def buscar_curso_dono(db: Session):
    curso = db.query(Curso).filter(Curso.nome.ilike("DONO")).first()

    if not curso:
        curso = Curso(nome="DONO")
        db.add(curso)
        db.flush()

    return curso


def montar_curso_usuario_response(vinculo: UsuarioCurso):
    return {
        "id": vinculo.id,
        "idCurso": vinculo.idCurso,
        "nomeCurso": vinculo.curso.nome if vinculo.curso else None,
        "tipoVinculo": vinculo.tipoVinculo,
    }


def buscar_cursos_usuario(db: Session, id_usuario: int):
    return (
        db.query(UsuarioCurso)
        .options(joinedload(UsuarioCurso.curso))
        .filter(UsuarioCurso.idUsuario == id_usuario)
        .order_by(UsuarioCurso.tipoVinculo.asc(), UsuarioCurso.idCurso.asc())
        .all()
    )


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


def salvar_cursos_usuario(
    db: Session,
    usuario: Usuario,
    cursos_validados: list[dict],
):
    for item in cursos_validados:
        db.add(
            UsuarioCurso(
                idUsuario=usuario.id,
                idCurso=item["idCurso"],
                tipoVinculo=item["tipoVinculo"],
            )
        )


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

        cursos_usuario = buscar_cursos_usuario(db, user.id)

        cursos_token = [
            {
                "id": vinculo.id,
                "idCurso": vinculo.idCurso,
                "nomeCurso": vinculo.curso.nome if vinculo.curso else None,
                "tipoVinculo": vinculo.tipoVinculo,
            }
            for vinculo in cursos_usuario
        ]

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
                "cursos": cursos_token,
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
        email = user_in.email.lower().strip()
        perfil = normalizar_perfil(user_in.perfil)

        existing_user = db.query(Usuario).filter(Usuario.email == email).first()

        if existing_user:
            registrar_log(
                db=db,
                acao="CADASTRO_ERRO",
                modulo="Autenticação",
                etapa="cadastro",
                descricao=f"Tentativa de cadastro com e-mail já registrado: {email}",
                status="erro",
                erro="E-mail já registrado",
                email_usuario=email,
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
                    email_usuario=email,
                    request=request,
                )

                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Instituição não encontrada",
                )

        cursos_validados = validar_cursos_usuario(
            db=db,
            perfil=perfil,
            cursos_recebidos=user_in.cursos,
        )

        hashed_password = get_password_hash(user_in.senha)

        db_user = Usuario(
            nome=user_in.nome.strip(),
            email=email,
            senha_hash=hashed_password,
            perfil=perfil,
            matricula=user_in.matricula.strip() if user_in.matricula else None,
            cargo=user_in.cargo.strip() if user_in.cargo else None,
            idInstituicao=user_in.idInstituicao,
        )

        db.add(db_user)
        db.flush()

        salvar_cursos_usuario(
            db=db,
            usuario=db_user,
            cursos_validados=cursos_validados,
        )

        db.commit()
        db.refresh(db_user)

        nome_instituicao = buscar_nome_instituicao(db, db_user.idInstituicao)
        cursos_usuario = buscar_cursos_usuario(db, db_user.id)

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
            "cursos": [
                montar_curso_usuario_response(vinculo)
                for vinculo in cursos_usuario
            ],
        }

    except HTTPException:
        db.rollback()
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


@router.post("/recuperacao-senha-email")
def enviar_email_recuperacao(
    data: RecuperacaoSenhaEmailRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        email = data.email.lower().strip()
        token = str(data.token or "").strip()

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email não informado",
            )

        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token não informado",
            )

        user = db.query(Usuario).filter(Usuario.email == email).first()

        if not user:
            registrar_log(
                db=db,
                acao="RECUPERACAO_SENHA_EMAIL_ERRO",
                modulo="Autenticação",
                etapa="recuperacao_senha_email",
                descricao=f"Tentativa de recuperação de senha para usuário inexistente: {email}",
                status="erro",
                erro="Usuário não encontrado",
                email_usuario=email,
                request=request,
            )

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        enviar_email_recuperacao_senha(
            email=email,
            token=token,
        )

        registrar_log(
            db=db,
            acao="RECUPERACAO_SENHA_EMAIL",
            modulo="Autenticação",
            etapa="recuperacao_senha_email",
            descricao=f"Email de recuperação de senha enviado para {user.email}",
            status="sucesso",
            id_usuario=user.id,
            request=request,
        )

        return {
            "detail": "Email de recuperação enviado com sucesso",
            "email": user.email,
        }

    except HTTPException:
        raise

    except Exception as error:
        registrar_log(
            db=db,
            acao="RECUPERACAO_SENHA_EMAIL_ERRO_INTERNO",
            modulo="Autenticação",
            etapa="recuperacao_senha_email",
            descricao="Erro interno ao enviar email de recuperação de senha",
            status="erro",
            erro=str(error),
            email_usuario=data.email,
            request=request,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao enviar email de recuperação de senha",
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