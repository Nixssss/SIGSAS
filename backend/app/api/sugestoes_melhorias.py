from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sugestao_melhoria import SugestaoMelhoria
from app.schemas.sugestao_melhoria import (
    SugestaoMelhoriaCreate,
    SugestaoMelhoriaUpdate,
    SugestaoMelhoriaRead,
)
from app.services.auditoria_service import registrar_log


router = APIRouter(prefix="/sugestoes-melhorias", tags=["Sugestões de Melhorias"])


@router.get("", response_model=list[SugestaoMelhoriaRead])
def listar_sugestoes(db: Session = Depends(get_db)):
    return (
        db.query(SugestaoMelhoria)
        .order_by(SugestaoMelhoria.id.desc())
        .all()
    )


@router.get("/{idSugestao}", response_model=SugestaoMelhoriaRead)
def buscar_sugestao(idSugestao: int, db: Session = Depends(get_db)):
    sugestao = (
        db.query(SugestaoMelhoria)
        .filter(SugestaoMelhoria.id == idSugestao)
        .first()
    )

    if not sugestao:
        raise HTTPException(status_code=404, detail="Sugestão não encontrada")

    return sugestao


@router.post("", response_model=SugestaoMelhoriaRead)
def criar_sugestao(
    dados: SugestaoMelhoriaCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        nova_sugestao = SugestaoMelhoria(
            idUsuario=dados.idUsuario,
            nomeUsuario=dados.nomeUsuario,
            emailUsuario=dados.emailUsuario,
            titulo=dados.titulo.strip(),
            descricao=dados.descricao.strip(),
            modulo=dados.modulo,
            categoria=dados.categoria,
            status="Nova",
        )

        db.add(nova_sugestao)
        db.commit()
        db.refresh(nova_sugestao)

        registrar_log(
            db=db,
            acao="CRIAR_SUGESTAO_MELHORIA",
            modulo="Sugestões de Melhorias",
            etapa="criar",
            descricao=f"Usuário enviou sugestão: {nova_sugestao.titulo}",
            status="sucesso",
            id_usuario=nova_sugestao.idUsuario,
            nome_usuario=nova_sugestao.nomeUsuario,
            email_usuario=nova_sugestao.emailUsuario,
            request=request,
        )

        return nova_sugestao

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="CRIAR_SUGESTAO_MELHORIA_ERRO",
            modulo="Sugestões de Melhorias",
            etapa="criar",
            descricao="Erro ao registrar sugestão de melhoria",
            status="erro",
            erro=str(error),
            id_usuario=dados.idUsuario,
            nome_usuario=dados.nomeUsuario,
            email_usuario=dados.emailUsuario,
            request=request,
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao registrar sugestão",
        )


@router.put("/{idSugestao}", response_model=SugestaoMelhoriaRead)
def atualizar_sugestao(
    idSugestao: int,
    dados: SugestaoMelhoriaUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        sugestao = (
            db.query(SugestaoMelhoria)
            .filter(SugestaoMelhoria.id == idSugestao)
            .first()
        )

        if not sugestao:
            raise HTTPException(status_code=404, detail="Sugestão não encontrada")

        campos = dados.dict(exclude_unset=True)

        for campo, valor in campos.items():
            setattr(sugestao, campo, valor)

        sugestao.dataAtualizacao = datetime.utcnow()

        db.commit()
        db.refresh(sugestao)

        registrar_log(
            db=db,
            acao="ATUALIZAR_SUGESTAO_MELHORIA",
            modulo="Sugestões de Melhorias",
            etapa="atualizar",
            descricao=f"Sugestão de melhoria #{sugestao.id} foi atualizada",
            status="sucesso",
            id_usuario=sugestao.idUsuario,
            nome_usuario=sugestao.nomeUsuario,
            email_usuario=sugestao.emailUsuario,
            request=request,
        )

        return sugestao

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="ATUALIZAR_SUGESTAO_MELHORIA_ERRO",
            modulo="Sugestões de Melhorias",
            etapa="atualizar",
            descricao=f"Erro ao atualizar sugestão de melhoria #{idSugestao}",
            status="erro",
            erro=str(error),
            request=request,
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao atualizar sugestão",
        )


@router.delete("/{idSugestao}")
def excluir_sugestao(
    idSugestao: int,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        sugestao = (
            db.query(SugestaoMelhoria)
            .filter(SugestaoMelhoria.id == idSugestao)
            .first()
        )

        if not sugestao:
            raise HTTPException(status_code=404, detail="Sugestão não encontrada")

        titulo = sugestao.titulo

        db.delete(sugestao)
        db.commit()

        registrar_log(
            db=db,
            acao="EXCLUIR_SUGESTAO_MELHORIA",
            modulo="Sugestões de Melhorias",
            etapa="excluir",
            descricao=f"Sugestão de melhoria foi excluída: {titulo}",
            status="sucesso",
            request=request,
        )

        return {"detail": "Sugestão excluída com sucesso"}

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="EXCLUIR_SUGESTAO_MELHORIA_ERRO",
            modulo="Sugestões de Melhorias",
            etapa="excluir",
            descricao=f"Erro ao excluir sugestão de melhoria #{idSugestao}",
            status="erro",
            erro=str(error),
            request=request,
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao excluir sugestão",
        )