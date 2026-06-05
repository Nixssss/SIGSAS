from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sala import Sala
from app.models.edificio import Edificio
from app.models.tipo_sala import TipoSala
from app.models.recurso import Recurso
from app.models.sala_recurso import SalaRecurso
from app.schemas.sala import SalaCreate, SalaUpdate, SalaRead
from app.services.auditoria_service import registrar_log


router = APIRouter(prefix="/salas", tags=["Salas"])


def montar_sala_read(sala: Sala) -> dict:
    return {
        "idSala": sala.idSala,
        "idTipoSala": sala.idTipoSala,
        "idEdificio": sala.idEdificio,
        "nome": sala.nome,
        "numero": sala.numero,
        "capacidade": sala.capacidade,
        "metragem": sala.metragem,
        "andar": sala.andar,
        "ativo": sala.ativo,
        "recursos": [v.idRecurso for v in sala.recursos],
    }


@router.get("", response_model=list[SalaRead])
def listar_salas(db: Session = Depends(get_db)):
    try:
        salas = db.query(Sala).order_by(Sala.nome.asc()).all()
        return [montar_sala_read(sala) for sala in salas]

    except Exception as error:
        registrar_log(
            db=db,
            acao="LISTAR_SALAS_ERRO",
            modulo="Salas",
            descricao="Erro ao listar salas",
            status="erro",
            erro=str(error),
        )
        raise HTTPException(status_code=500, detail="Erro ao listar salas")


@router.post("", response_model=SalaRead)
def criar_sala(
    dados: SalaCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        edificio = db.query(Edificio).filter(Edificio.id == dados.idEdificio).first()

        if not edificio:
            raise HTTPException(status_code=404, detail="Edifício não encontrado")

        tipo_sala = db.query(TipoSala).filter(TipoSala.id == dados.idTipoSala).first()

        if not tipo_sala:
            raise HTTPException(status_code=404, detail="Tipo de sala não encontrado")

        recursos_existentes = (
            db.query(Recurso)
            .filter(Recurso.id.in_(dados.recursos))
            .all()
            if dados.recursos
            else []
        )

        ids_existentes = {r.id for r in recursos_existentes}
        ids_enviados = set(dados.recursos or [])

        if ids_enviados != ids_existentes:
            raise HTTPException(status_code=404, detail="Um ou mais recursos não foram encontrados")

        nova_sala = Sala(
            idTipoSala=dados.idTipoSala,
            idEdificio=dados.idEdificio,
            nome=dados.nome.strip(),
            numero=dados.numero.strip(),
            capacidade=dados.capacidade,
            metragem=dados.metragem,
            andar=dados.andar,
            ativo=dados.ativo,
        )

        db.add(nova_sala)
        db.flush()

        for id_recurso in dados.recursos:
            db.add(
                SalaRecurso(
                    idSala=nova_sala.idSala,
                    idRecurso=id_recurso,
                )
            )

        db.commit()
        db.refresh(nova_sala)

        registrar_log(
            db=db,
            acao="CRIAR_SALA",
            modulo="Salas",
            etapa="criar",
            descricao=f"Sala {nova_sala.nome} foi criada no edifício #{nova_sala.idEdificio}",
            status="sucesso",
            request=request,
        )

        return montar_sala_read(nova_sala)

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="CRIAR_SALA_ERRO_INTERNO",
            modulo="Salas",
            etapa="criar",
            descricao=f"Erro interno ao criar sala {dados.nome}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao criar sala")


@router.put("/{idSala}", response_model=SalaRead)
def atualizar_sala(
    idSala: int,
    dados: SalaUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        sala = db.query(Sala).filter(Sala.idSala == idSala).first()

        if not sala:
            raise HTTPException(status_code=404, detail="Sala não encontrada")

        nome_anterior = sala.nome

        if dados.idEdificio is not None:
            edificio = db.query(Edificio).filter(Edificio.id == dados.idEdificio).first()

            if not edificio:
                raise HTTPException(status_code=404, detail="Edifício não encontrado")

            sala.idEdificio = dados.idEdificio

        if dados.idTipoSala is not None:
            tipo_sala = db.query(TipoSala).filter(TipoSala.id == dados.idTipoSala).first()

            if not tipo_sala:
                raise HTTPException(status_code=404, detail="Tipo de sala não encontrado")

            sala.idTipoSala = dados.idTipoSala

        if dados.nome is not None:
            sala.nome = dados.nome.strip()

        if dados.numero is not None:
            sala.numero = dados.numero.strip()

        if dados.capacidade is not None:
            sala.capacidade = dados.capacidade

        if dados.metragem is not None:
            sala.metragem = dados.metragem

        if dados.andar is not None:
            sala.andar = dados.andar

        if dados.ativo is not None:
            sala.ativo = dados.ativo

        if dados.recursos is not None:
            recursos_existentes = (
                db.query(Recurso)
                .filter(Recurso.id.in_(dados.recursos))
                .all()
                if dados.recursos
                else []
            )

            ids_existentes = {r.id for r in recursos_existentes}
            ids_enviados = set(dados.recursos or [])

            if ids_enviados != ids_existentes:
                raise HTTPException(
                    status_code=404,
                    detail="Um ou mais recursos não foram encontrados",
                )

            db.query(SalaRecurso).filter(SalaRecurso.idSala == idSala).delete()

            for id_recurso in dados.recursos:
                db.add(
                    SalaRecurso(
                        idSala=idSala,
                        idRecurso=id_recurso,
                    )
                )

        db.commit()
        db.refresh(sala)

        registrar_log(
            db=db,
            acao="ATUALIZAR_SALA",
            modulo="Salas",
            etapa="atualizar",
            descricao=f"Sala #{sala.idSala} alterada de {nome_anterior} para {sala.nome}",
            status="sucesso",
            request=request,
        )

        return montar_sala_read(sala)

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="ATUALIZAR_SALA_ERRO_INTERNO",
            modulo="Salas",
            etapa="atualizar",
            descricao=f"Erro interno ao atualizar sala #{idSala}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao atualizar sala")


@router.delete("/{idSala}")
def excluir_sala(
    idSala: int,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        sala = db.query(Sala).filter(Sala.idSala == idSala).first()

        if not sala:
            raise HTTPException(status_code=404, detail="Sala não encontrada")

        nome = sala.nome

        db.delete(sala)
        db.commit()

        registrar_log(
            db=db,
            acao="EXCLUIR_SALA",
            modulo="Salas",
            etapa="excluir",
            descricao=f"Sala {nome} foi excluída",
            status="sucesso",
            request=request,
        )

        return {"message": "Sala excluída com sucesso"}

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        registrar_log(
            db=db,
            acao="EXCLUIR_SALA_ERRO_INTERNO",
            modulo="Salas",
            etapa="excluir",
            descricao=f"Erro interno ao excluir sala #{idSala}",
            status="erro",
            erro=str(error),
            request=request,
        )
        raise HTTPException(status_code=500, detail="Erro ao excluir sala")
