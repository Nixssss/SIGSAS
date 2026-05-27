from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.reporte_problema import ReporteProblema
from app.schemas.reporte_problema import (
    ReporteProblemaCreate,
    ReporteProblemaUpdate,
    ReporteProblemaRead,
)
from app.services.auditoria_service import registrar_log


router = APIRouter(prefix="/reportes-problemas", tags=["Reportes de Problemas"])


@router.get("", response_model=list[ReporteProblemaRead])
def listar_reportes(db: Session = Depends(get_db)):
    return (
        db.query(ReporteProblema)
        .order_by(ReporteProblema.id.desc())
        .all()
    )


@router.get("/{idReporte}", response_model=ReporteProblemaRead)
def buscar_reporte(idReporte: int, db: Session = Depends(get_db)):
    reporte = (
        db.query(ReporteProblema)
        .filter(ReporteProblema.id == idReporte)
        .first()
    )

    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte não encontrado")

    return reporte


@router.post("", response_model=ReporteProblemaRead)
def criar_reporte(
    dados: ReporteProblemaCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        novo_reporte = ReporteProblema(
            idUsuario=dados.idUsuario,
            nomeUsuario=dados.nomeUsuario,
            emailUsuario=dados.emailUsuario,
            titulo=dados.titulo.strip(),
            descricao=dados.descricao.strip(),
            modulo=dados.modulo,
            prioridade=dados.prioridade,
            status="Aberto",
        )

        db.add(novo_reporte)
        db.commit()
        db.refresh(novo_reporte)

        registrar_log(
            db=db,
            acao="REPORTAR_PROBLEMA",
            modulo="Reportes de Problemas",
            etapa="criar",
            descricao=f"Usuário reportou problema: {novo_reporte.titulo}",
            status="sucesso",
            id_usuario=novo_reporte.idUsuario,
            nome_usuario=novo_reporte.nomeUsuario,
            email_usuario=novo_reporte.emailUsuario,
            request=request,
        )

        return novo_reporte

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="REPORTAR_PROBLEMA_ERRO",
            modulo="Reportes de Problemas",
            etapa="criar",
            descricao="Erro ao registrar reporte de problema",
            status="erro",
            erro=str(error),
            id_usuario=dados.idUsuario,
            nome_usuario=dados.nomeUsuario,
            email_usuario=dados.emailUsuario,
            request=request,
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao registrar problema",
        )


@router.put("/{idReporte}", response_model=ReporteProblemaRead)
def atualizar_reporte(
    idReporte: int,
    dados: ReporteProblemaUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        reporte = (
            db.query(ReporteProblema)
            .filter(ReporteProblema.id == idReporte)
            .first()
        )

        if not reporte:
            raise HTTPException(status_code=404, detail="Reporte não encontrado")

        campos = dados.dict(exclude_unset=True)

        for campo, valor in campos.items():
            setattr(reporte, campo, valor)

        reporte.dataAtualizacao = datetime.utcnow()

        db.commit()
        db.refresh(reporte)

        registrar_log(
            db=db,
            acao="ATUALIZAR_REPORTE_PROBLEMA",
            modulo="Reportes de Problemas",
            etapa="atualizar",
            descricao=f"Reporte de problema #{reporte.id} foi atualizado",
            status="sucesso",
            id_usuario=reporte.idUsuario,
            nome_usuario=reporte.nomeUsuario,
            email_usuario=reporte.emailUsuario,
            request=request,
        )

        return reporte

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="ATUALIZAR_REPORTE_PROBLEMA_ERRO",
            modulo="Reportes de Problemas",
            etapa="atualizar",
            descricao=f"Erro ao atualizar reporte de problema #{idReporte}",
            status="erro",
            erro=str(error),
            request=request,
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao atualizar problema",
        )


@router.delete("/{idReporte}")
def excluir_reporte(
    idReporte: int,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        reporte = (
            db.query(ReporteProblema)
            .filter(ReporteProblema.id == idReporte)
            .first()
        )

        if not reporte:
            raise HTTPException(status_code=404, detail="Reporte não encontrado")

        titulo = reporte.titulo

        db.delete(reporte)
        db.commit()

        registrar_log(
            db=db,
            acao="EXCLUIR_REPORTE_PROBLEMA",
            modulo="Reportes de Problemas",
            etapa="excluir",
            descricao=f"Reporte de problema foi excluído: {titulo}",
            status="sucesso",
            request=request,
        )

        return {"detail": "Reporte excluído com sucesso"}

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        registrar_log(
            db=db,
            acao="EXCLUIR_REPORTE_PROBLEMA_ERRO",
            modulo="Reportes de Problemas",
            etapa="excluir",
            descricao=f"Erro ao excluir reporte de problema #{idReporte}",
            status="erro",
            erro=str(error),
            request=request,
        )

        raise HTTPException(
            status_code=500,
            detail="Erro interno ao excluir problema",
        )