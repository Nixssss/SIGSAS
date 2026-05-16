from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.convite import Convite
from app.models.usuario import Usuario
from app.schemas.convite import (
    ConviteCreate,
    ConviteRead,
    ConviteValidacaoRead,
)


router = APIRouter(prefix="/convites", tags=["Convites"])


FRONTEND_CADASTRO_URL = "http://localhost:5173/cadastro"


def montar_convite_read(convite: Convite):
    return {
        "idConvite": convite.idConvite,
        "email": convite.email,
        "token": convite.token,
        "usado": convite.usado,
        "criadoEm": convite.criadoEm,
        "expiraEm": convite.expiraEm,
        "usadoEm": convite.usadoEm,
        "criadoPor": convite.criadoPor,
        "linkCadastro": f"{FRONTEND_CADASTRO_URL}?token={convite.token}",
    }


@router.get("", response_model=list[ConviteRead])
def listar_convites(db: Session = Depends(get_db)):
    convites = db.query(Convite).order_by(Convite.idConvite.desc()).all()
    return [montar_convite_read(convite) for convite in convites]


@router.post("", response_model=ConviteRead, status_code=status.HTTP_201_CREATED)
def criar_convite(dados: ConviteCreate, db: Session = Depends(get_db)):
    email = dados.email.lower().strip()

    usuario_existente = db.query(Usuario).filter(Usuario.email == email).first()

    if usuario_existente:
        raise HTTPException(
            status_code=409,
            detail="Já existe um usuário cadastrado com este email",
        )

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
        return montar_convite_read(convite_ativo)

    convite = Convite(
        email=email,
        token=Convite.gerar_token(),
        expiraEm=Convite.gerar_data_expiracao(dados.validadeHoras),
        criadoPor=dados.criadoPor,
    )

    db.add(convite)
    db.commit()
    db.refresh(convite)

    return montar_convite_read(convite)


@router.get("/validar/{token}", response_model=ConviteValidacaoRead)
def validar_convite(token: str, db: Session = Depends(get_db)):
    convite = db.query(Convite).filter(Convite.token == token).first()

    if not convite:
        return {
            "valido": False,
            "mensagem": "Convite inválido ou não encontrado.",
            "email": None,
            "token": None,
        }

    if convite.usado:
        return {
            "valido": False,
            "mensagem": "Este convite já foi utilizado.",
            "email": convite.email,
            "token": convite.token,
        }

    if convite.expiraEm < datetime.utcnow():
        return {
            "valido": False,
            "mensagem": "Este convite expirou. Solicite um novo convite ao administrador.",
            "email": convite.email,
            "token": convite.token,
        }

    return {
        "valido": True,
        "mensagem": "Convite válido.",
        "email": convite.email,
        "token": convite.token,
    }


@router.patch("/{token}/usar", response_model=ConviteRead)
def marcar_convite_como_usado(token: str, db: Session = Depends(get_db)):
    convite = db.query(Convite).filter(Convite.token == token).first()

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

    return montar_convite_read(convite)


@router.delete("/{idConvite}")
def excluir_convite(idConvite: int, db: Session = Depends(get_db)):
    convite = db.query(Convite).filter(Convite.idConvite == idConvite).first()

    if not convite:
        raise HTTPException(status_code=404, detail="Convite não encontrado")

    db.delete(convite)
    db.commit()

    return {"message": "Convite excluído com sucesso"}