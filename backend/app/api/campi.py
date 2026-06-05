from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.campus import Campus
from app.models.instituicao import Instituicao
from app.schemas.campus import CampusCreate, CampusUpdate, CampusRead
from app.services.auditoria_service import registrar_log


router = APIRouter(prefix="/campi", tags=["Campi"])


@router.get("", response_model=list[CampusRead])
def listar_campi(db: Session = Depends(get_db)):
    try:
        return db.query(Campus).order_by(Campus.nome.asc()).all()

    except Exception as error:
        registrar_log(
            db=db,
            acao="LISTAR_CAMPI_ERRO",
            modulo="Campi",
            descricao="Erro ao listar campi",
            status="erro",
            erro=str(error),
        )
        raise HTTPException(status_code=500, detail="Erro ao listar campi")


@router.post("", response_model=CampusRead)
def criar_campus(
    dados: CampusCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        instituicao = (
            db.query(Instituicao)
            .filter(Instituicao.id == dados.idInstituicao)
            .first()
        )

        if not instituicao:
            raise HTTPException(status_code=404, detail="Instituição não encontrada")

        novo = Campus(
            nome=dados.nome.strip(),
            endereco=dados.endereco,
            idInstituicao=dados.idInstituicao,
        )

        db.add(novo)
        db.commit()
        db.refresh(novo)

        registrar_log(
            db=db,
            acao="CRIAR_CAMPUS",
            modulo="Campi",
            etapa="criar",
            descricao=f"Campus {novo.nome} foi criado para a instituição {instituicao.nome}",
            status="sucesso",
            request=request,
        )

        return novo

    except HTTPException:
        db.rollback()
        registrar_log(
            db=db,
            acao="CRIAR_CAMPUS_ERRO",
            modulo="Campi",
            etapa="criar",
            descricao=f"Erro ao criar campus {dados.nome}",
            status="erro",
            erro="Instituição não encontrada",
            request=request,
        )
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="CRIAR_CAMPUS_ERRO_INTERNO",
            modulo="Campi",
            etapa="criar",
            descricao=f"Erro interno ao criar campus {dados.nome}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao criar campus")


@router.put("/{campus_id}", response_model=CampusRead)
def atualizar_campus(
    campus_id: int,
    dados: CampusUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        campus = db.query(Campus).filter(Campus.id == campus_id).first()

        if not campus:
            raise HTTPException(status_code=404, detail="Campus não encontrado")

        nome_anterior = campus.nome

        if dados.idInstituicao is not None:
            instituicao = (
                db.query(Instituicao)
                .filter(Instituicao.id == dados.idInstituicao)
                .first()
            )

            if not instituicao:
                raise HTTPException(status_code=404, detail="Instituição não encontrada")

            campus.idInstituicao = dados.idInstituicao

        if dados.nome is not None:
            campus.nome = dados.nome.strip()

        if dados.endereco is not None:
            campus.endereco = dados.endereco

        db.commit()
        db.refresh(campus)

        registrar_log(
            db=db,
            acao="ATUALIZAR_CAMPUS",
            modulo="Campi",
            etapa="atualizar",
            descricao=f"Campus #{campus.id} alterado de {nome_anterior} para {campus.nome}",
            status="sucesso",
            request=request,
        )

        return campus

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="ATUALIZAR_CAMPUS_ERRO_INTERNO",
            modulo="Campi",
            etapa="atualizar",
            descricao=f"Erro interno ao atualizar campus #{campus_id}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao atualizar campus")


@router.delete("/{campus_id}")
def excluir_campus(
    campus_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        campus = db.query(Campus).filter(Campus.id == campus_id).first()

        if not campus:
            raise HTTPException(status_code=404, detail="Campus não encontrado")

        nome = campus.nome

        db.delete(campus)
        db.commit()

        registrar_log(
            db=db,
            acao="EXCLUIR_CAMPUS",
            modulo="Campi",
            etapa="excluir",
            descricao=f"Campus {nome} foi excluído",
            status="sucesso",
            request=request,
        )

        return {"message": "Campus excluído com sucesso"}

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="EXCLUIR_CAMPUS_ERRO_INTERNO",
            modulo="Campi",
            etapa="excluir",
            descricao=f"Erro interno ao excluir campus #{campus_id}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao excluir campus")
