from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.instituicao import Instituicao
from app.schemas.instituicao import (
    InstituicaoCreate,
    InstituicaoUpdate,
    InstituicaoRead,
)
from app.services.auditoria_service import registrar_log


router = APIRouter(prefix="/instituicoes", tags=["Instituições"])


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


@router.get("", response_model=list[InstituicaoRead])
def listar_instituicoes(db: Session = Depends(get_db)):
    try:
        return db.query(Instituicao).order_by(Instituicao.nome.asc()).all()

    except Exception as error:
        registrar_log(
            db=db,
            acao="LISTAR_INSTITUICOES_ERRO",
            modulo="Instituições",
            descricao="Erro ao listar instituições",
            status="erro",
            erro=str(error),
        )
        raise HTTPException(status_code=500, detail="Erro ao listar instituições")


@router.post("", response_model=InstituicaoRead)
def criar_instituicao(
    dados: InstituicaoCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        nome = dados.nome.strip()
        motivo_inativo = normalizar_motivo_inativo(
            ativo=dados.ativo,
            motivo=dados.motivoInativo,
        )

        nova = Instituicao(
            nome=nome,
            ativo=dados.ativo,
            motivoInativo=motivo_inativo,
        )

        db.add(nova)
        db.commit()
        db.refresh(nova)

        registrar_log(
            db=db,
            acao="CRIAR_INSTITUICAO",
            modulo="Instituições",
            etapa="criar",
            descricao=f"Instituição {nova.nome} foi criada com status {'ativo' if nova.ativo else 'inativo'}",
            status="sucesso",
            request=request,
        )

        return nova

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="CRIAR_INSTITUICAO_ERRO",
            modulo="Instituições",
            etapa="criar",
            descricao=f"Erro ao criar instituição: {dados.nome}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao criar instituição")


@router.put("/{instituicao_id}", response_model=InstituicaoRead)
def atualizar_instituicao(
    instituicao_id: int,
    dados: InstituicaoUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        instituicao = (
            db.query(Instituicao)
            .filter(Instituicao.id == instituicao_id)
            .first()
        )

        if not instituicao:
            registrar_log(
                db=db,
                acao="ATUALIZAR_INSTITUICAO_ERRO",
                modulo="Instituições",
                etapa="atualizar",
                descricao=f"Tentativa de atualizar instituição inexistente #{instituicao_id}",
                status="erro",
                erro="Instituição não encontrada",
                request=request,
            )
            raise HTTPException(status_code=404, detail="Instituição não encontrada")

        nome_anterior = instituicao.nome
        status_anterior = "ativo" if instituicao.ativo else "inativo"

        if dados.nome is not None:
            instituicao.nome = dados.nome.strip()

        novo_ativo = instituicao.ativo if dados.ativo is None else dados.ativo
        novo_motivo = (
            instituicao.motivoInativo
            if dados.motivoInativo is None
            else dados.motivoInativo
        )

        instituicao.ativo = novo_ativo
        instituicao.motivoInativo = normalizar_motivo_inativo(
            ativo=novo_ativo,
            motivo=novo_motivo,
        )

        db.commit()
        db.refresh(instituicao)

        status_atual = "ativo" if instituicao.ativo else "inativo"

        registrar_log(
            db=db,
            acao="ATUALIZAR_INSTITUICAO",
            modulo="Instituições",
            etapa="atualizar",
            descricao=(
                f"Instituição #{instituicao.id} alterada de {nome_anterior} para {instituicao.nome}. "
                f"Status: {status_anterior} -> {status_atual}."
            ),
            status="sucesso",
            request=request,
        )

        return instituicao

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="ATUALIZAR_INSTITUICAO_ERRO_INTERNO",
            modulo="Instituições",
            etapa="atualizar",
            descricao=f"Erro interno ao atualizar instituição #{instituicao_id}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao atualizar instituição")


@router.delete("/{instituicao_id}")
def excluir_instituicao(
    instituicao_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        instituicao = (
            db.query(Instituicao)
            .filter(Instituicao.id == instituicao_id)
            .first()
        )

        if not instituicao:
            registrar_log(
                db=db,
                acao="EXCLUIR_INSTITUICAO_ERRO",
                modulo="Instituições",
                etapa="excluir",
                descricao=f"Tentativa de excluir instituição inexistente #{instituicao_id}",
                status="erro",
                erro="Instituição não encontrada",
                request=request,
            )
            raise HTTPException(status_code=404, detail="Instituição não encontrada")

        nome = instituicao.nome

        db.delete(instituicao)
        db.commit()

        registrar_log(
            db=db,
            acao="EXCLUIR_INSTITUICAO",
            modulo="Instituições",
            etapa="excluir",
            descricao=f"Instituição {nome} foi excluída",
            status="sucesso",
            request=request,
        )

        return {"message": "Instituição excluída com sucesso"}

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="EXCLUIR_INSTITUICAO_ERRO_INTERNO",
            modulo="Instituições",
            etapa="excluir",
            descricao=f"Erro interno ao excluir instituição #{instituicao_id}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao excluir instituição")
