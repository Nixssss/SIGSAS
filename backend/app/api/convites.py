import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.convite import Convite
from app.models.convite_curso import ConviteCurso
from app.models.curso import Curso
from app.models.usuario import Usuario
from app.schemas.convite import (
    ConviteCreate,
    ConviteRead,
    ConviteValidacaoRead,
)
from app.services.email_resend_service import enviar_email_convite


router = APIRouter(prefix="/convites", tags=["Convites"])


def obter_frontend_cadastro_url():
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    frontend_url = frontend_url.rstrip("/")

    return f"{frontend_url}/cadastro"


PERFIS_PERMITIDOS = {
    "Administrador",
    "Coordenador",
    "Professor",
}


def normalizar_perfil(perfil: str):
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
    curso = (
        db.query(Curso)
        .filter(Curso.nome.ilike("DONO"))
        .first()
    )

    if not curso:
        curso = Curso(nome="DONO")
        db.add(curso)
        db.flush()

    return curso


def montar_curso_convite_read(vinculo: ConviteCurso):
    return {
        "id": vinculo.id,
        "idCurso": vinculo.idCurso,
        "nomeCurso": vinculo.curso.nome if vinculo.curso else None,
        "tipoVinculo": vinculo.tipoVinculo,
    }


def montar_convite_read(convite: Convite):
    frontend_cadastro_url = obter_frontend_cadastro_url()

    return {
        "idConvite": convite.idConvite,
        "email": convite.email,
        "token": convite.token,
        "usado": convite.usado,
        "criadoEm": convite.criadoEm,
        "expiraEm": convite.expiraEm,
        "usadoEm": convite.usadoEm,
        "criadoPor": convite.criadoPor,
        "perfilConvidado": convite.perfilConvidado,
        "cursos": [
            montar_curso_convite_read(vinculo)
            for vinculo in convite.cursos_vinculados
        ],
        "linkCadastro": f"{frontend_cadastro_url}?token={convite.token}",
    }


def validar_cursos_convite(db: Session, dados: ConviteCreate, perfil: str):
    cursos_validados = []

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
        if len(dados.cursos) != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coordenador deve estar vinculado a exatamente um curso.",
            )

    if perfil == "Professor":
        if not dados.cursos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Professor deve estar vinculado a pelo menos um curso.",
            )

    chaves = set()

    for item in dados.cursos:
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
                detail="Tipo de vínculo inválido.",
            )

        if perfil == "Coordenador" and tipo_vinculo != "Coordenador":
            tipo_vinculo = "Coordenador"

        if perfil == "Professor" and tipo_vinculo != "Professor":
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


def substituir_cursos_convite(
    db: Session,
    convite: Convite,
    cursos_validados: list[dict],
):
    db.query(ConviteCurso).filter(
        ConviteCurso.idConvite == convite.idConvite
    ).delete()

    for item in cursos_validados:
        db.add(
            ConviteCurso(
                idConvite=convite.idConvite,
                idCurso=item["idCurso"],
                tipoVinculo=item["tipoVinculo"],
            )
        )


def buscar_convite_com_cursos(db: Session, id_convite: int):
    return (
        db.query(Convite)
        .options(
            joinedload(Convite.cursos_vinculados).joinedload(ConviteCurso.curso)
        )
        .filter(Convite.idConvite == id_convite)
        .first()
    )


def buscar_convite_por_token_com_cursos(db: Session, token: str):
    return (
        db.query(Convite)
        .options(
            joinedload(Convite.cursos_vinculados).joinedload(ConviteCurso.curso)
        )
        .filter(Convite.token == token)
        .first()
    )


def tentar_enviar_email_convite(convite: Convite):
    try:
        enviar_email_convite(
            email=convite.email,
            token=convite.token,
            link_cadastro=montar_convite_read(convite)["linkCadastro"],
        )
    except Exception as error:
        print("Erro ao enviar convite pelo Resend:", str(error))


@router.get("", response_model=list[ConviteRead])
def listar_convites(db: Session = Depends(get_db)):
    convites = (
        db.query(Convite)
        .options(
            joinedload(Convite.cursos_vinculados).joinedload(ConviteCurso.curso)
        )
        .order_by(Convite.idConvite.desc())
        .all()
    )

    return [montar_convite_read(convite) for convite in convites]


@router.post("", response_model=ConviteRead, status_code=status.HTTP_201_CREATED)
def criar_convite(dados: ConviteCreate, db: Session = Depends(get_db)):
    email = dados.email.lower().strip()
    perfil = normalizar_perfil(dados.perfilConvidado)

    usuario_existente = db.query(Usuario).filter(Usuario.email == email).first()

    if usuario_existente:
        raise HTTPException(
            status_code=409,
            detail="Já existe um usuário cadastrado com este email",
        )

    cursos_validados = validar_cursos_convite(db, dados, perfil)

    convite_ativo = (
        db.query(Convite)
        .filter(
            Convite.email == email,
            Convite.usado == False,
            Convite.expiraEm > datetime.utcnow(),
        )
        .first()
    )

    if convite_ativo:
        convite_ativo.perfilConvidado = perfil
        convite_ativo.expiraEm = Convite.gerar_data_expiracao(dados.validadeHoras)
        convite_ativo.criadoPor = dados.criadoPor

        substituir_cursos_convite(
            db=db,
            convite=convite_ativo,
            cursos_validados=cursos_validados,
        )

        db.commit()

        convite_ativo = buscar_convite_com_cursos(db, convite_ativo.idConvite)
        tentar_enviar_email_convite(convite_ativo)

        return montar_convite_read(convite_ativo)

    convite = Convite(
        email=email,
        token=Convite.gerar_token(),
        expiraEm=Convite.gerar_data_expiracao(dados.validadeHoras),
        criadoPor=dados.criadoPor,
        perfilConvidado=perfil,
    )

    db.add(convite)
    db.flush()

    substituir_cursos_convite(
        db=db,
        convite=convite,
        cursos_validados=cursos_validados,
    )

    db.commit()
    db.refresh(convite)

    convite = buscar_convite_com_cursos(db, convite.idConvite)
    tentar_enviar_email_convite(convite)

    return montar_convite_read(convite)


@router.get("/validar/{token}", response_model=ConviteValidacaoRead)
def validar_convite(token: str, db: Session = Depends(get_db)):
    convite = buscar_convite_por_token_com_cursos(db, token)

    if not convite:
        return {
            "valido": False,
            "mensagem": "Convite inválido ou não encontrado.",
            "email": None,
            "token": None,
            "perfilConvidado": None,
            "cursos": [],
        }

    if convite.usado:
        return {
            "valido": False,
            "mensagem": "Este convite já foi utilizado.",
            "email": convite.email,
            "token": convite.token,
            "perfilConvidado": convite.perfilConvidado,
            "cursos": [
                montar_curso_convite_read(v)
                for v in convite.cursos_vinculados
            ],
        }

    if convite.expiraEm < datetime.utcnow():
        return {
            "valido": False,
            "mensagem": "Este convite expirou. Solicite um novo convite ao administrador.",
            "email": convite.email,
            "token": convite.token,
            "perfilConvidado": convite.perfilConvidado,
            "cursos": [
                montar_curso_convite_read(v)
                for v in convite.cursos_vinculados
            ],
        }

    return {
        "valido": True,
        "mensagem": "Convite válido.",
        "email": convite.email,
        "token": convite.token,
        "perfilConvidado": convite.perfilConvidado,
        "cursos": [
            montar_curso_convite_read(v)
            for v in convite.cursos_vinculados
        ],
    }


@router.patch("/{token}/usar", response_model=ConviteRead)
def marcar_convite_como_usado(token: str, db: Session = Depends(get_db)):
    convite = buscar_convite_por_token_com_cursos(db, token)

    if not convite:
        raise HTTPException(status_code=404, detail="Convite não encontrado")

    if convite.usado:
        raise HTTPException(status_code=400, detail="Convite já utilizado")

    if convite.expiraEm < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Convite expirado")

    convite.usado = True
    convite.usadoEm = datetime.utcnow()

    db.commit()
    db.refresh(convite)

    convite = buscar_convite_com_cursos(db, convite.idConvite)
    tentar_enviar_email_convite(convite)

    return montar_convite_read(convite)


@router.delete("/{idConvite}")
def excluir_convite(idConvite: int, db: Session = Depends(get_db)):
    convite = db.query(Convite).filter(Convite.idConvite == idConvite).first()

    if not convite:
        raise HTTPException(status_code=404, detail="Convite não encontrado")

    db.delete(convite)
    db.commit()

    return {"message": "Convite excluído com sucesso"}