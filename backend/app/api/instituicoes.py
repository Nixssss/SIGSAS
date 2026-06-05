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
        nova = Instituicao(nome=nome)

        db.add(nova)
        db.commit()
        db.refresh(nova)

        registrar_log(
            db=db,
            acao="CRIAR_INSTITUICAO",
            modulo="Instituições",
            etapa="criar",
            descricao=f"Instituição {nova.nome} foi criada",
            status="sucesso",
            request=request,
        )

        return nova

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

        if dados.nome is not None:
            instituicao.nome = dados.nome.strip()

        db.commit()
        db.refresh(instituicao)

        registrar_log(
            db=db,
            acao="ATUALIZAR_INSTITUICAO",
            modulo="Instituições",
            etapa="atualizar",
            descricao=f"Instituição #{instituicao.id} alterada de {nome_anterior} para {instituicao.nome}",
            status="sucesso",
            request=request,
        )

        return instituicao

    except HTTPException:
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
