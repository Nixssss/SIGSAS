from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.edificio import Edificio
from app.models.campus import Campus
from app.schemas.edificio import EdificioCreate, EdificioUpdate, EdificioRead
from app.services.auditoria_service import registrar_log


router = APIRouter(prefix="/edificios", tags=["Edifícios"])


def normalizar_motivo_inativo(ativo: bool, motivo: str | None):
    if ativo:
        return None

    motivo_limpo = str(motivo or "").strip()

    if not motivo_limpo:
        raise HTTPException(
            status_code=400,
            detail="Informe o motivo da inatividade.",
        )

    return motivo_limpo


@router.get("", response_model=list[EdificioRead])
def listar_edificios(db: Session = Depends(get_db)):
    try:
        return db.query(Edificio).order_by(Edificio.nome.asc()).all()

    except Exception as error:
        registrar_log(
            db=db,
            acao="LISTAR_EDIFICIOS_ERRO",
            modulo="Edifícios",
            descricao="Erro ao listar edifícios",
            status="erro",
            erro=str(error),
        )
        raise HTTPException(status_code=500, detail="Erro ao listar edifícios")


@router.post("", response_model=EdificioRead)
def criar_edificio(
    dados: EdificioCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        campus = db.query(Campus).filter(Campus.id == dados.idCampus).first()

        if not campus:
            raise HTTPException(status_code=404, detail="Campus não encontrado")

        motivo_inativo = normalizar_motivo_inativo(
            ativo=dados.ativo,
            motivo=dados.motivoInativo,
        )

        novo = Edificio(
            nome=dados.nome.strip(),
            idCampus=dados.idCampus,
            ativo=dados.ativo,
            motivoInativo=motivo_inativo,
        )

        db.add(novo)
        db.commit()
        db.refresh(novo)

        registrar_log(
            db=db,
            acao="CRIAR_EDIFICIO",
            modulo="Edifícios",
            etapa="criar",
            descricao=f"Edifício {novo.nome} foi criado no campus {campus.nome} com status {'ativo' if novo.ativo else 'inativo'}",
            status="sucesso",
            request=request,
        )

        return novo

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="CRIAR_EDIFICIO_ERRO_INTERNO",
            modulo="Edifícios",
            etapa="criar",
            descricao=f"Erro interno ao criar edifício {dados.nome}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao criar edifício")


@router.put("/{edificio_id}", response_model=EdificioRead)
def atualizar_edificio(
    edificio_id: int,
    dados: EdificioUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()

        if not edificio:
            raise HTTPException(status_code=404, detail="Edifício não encontrado")

        nome_anterior = edificio.nome
        status_anterior = "ativo" if edificio.ativo else "inativo"

        if dados.idCampus is not None:
            campus = db.query(Campus).filter(Campus.id == dados.idCampus).first()

            if not campus:
                raise HTTPException(status_code=404, detail="Campus não encontrado")

            edificio.idCampus = dados.idCampus

        if dados.nome is not None:
            edificio.nome = dados.nome.strip()

        novo_ativo = edificio.ativo if dados.ativo is None else dados.ativo
        novo_motivo = (
            edificio.motivoInativo
            if dados.motivoInativo is None
            else dados.motivoInativo
        )

        edificio.ativo = novo_ativo
        edificio.motivoInativo = normalizar_motivo_inativo(
            ativo=novo_ativo,
            motivo=novo_motivo,
        )

        db.commit()
        db.refresh(edificio)

        status_atual = "ativo" if edificio.ativo else "inativo"

        registrar_log(
            db=db,
            acao="ATUALIZAR_EDIFICIO",
            modulo="Edifícios",
            etapa="atualizar",
            descricao=(
                f"Edifício #{edificio.id} alterado de {nome_anterior} para {edificio.nome}. "
                f"Status: {status_anterior} -> {status_atual}."
            ),
            status="sucesso",
            request=request,
        )

        return edificio

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="ATUALIZAR_EDIFICIO_ERRO_INTERNO",
            modulo="Edifícios",
            etapa="atualizar",
            descricao=f"Erro interno ao atualizar edifício #{edificio_id}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao atualizar edifício")


@router.delete("/{edificio_id}")
def excluir_edificio(
    edificio_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        edificio = db.query(Edificio).filter(Edificio.id == edificio_id).first()

        if not edificio:
            raise HTTPException(status_code=404, detail="Edifício não encontrado")

        nome = edificio.nome

        db.delete(edificio)
        db.commit()

        registrar_log(
            db=db,
            acao="EXCLUIR_EDIFICIO",
            modulo="Edifícios",
            etapa="excluir",
            descricao=f"Edifício {nome} foi excluído",
            status="sucesso",
            request=request,
        )

        return {"message": "Edifício excluído com sucesso"}

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="EXCLUIR_EDIFICIO_ERRO_INTERNO",
            modulo="Edifícios",
            etapa="excluir",
            descricao=f"Erro interno ao excluir edifício #{edificio_id}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao excluir edifício")
