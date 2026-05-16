from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sala import Sala
from app.models.edificio import Edificio
from app.models.tipo_sala import TipoSala
from app.models.recurso import Recurso
from app.models.sala_recurso import SalaRecurso
from app.schemas.sala import SalaCreate, SalaUpdate, SalaRead


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
    salas = db.query(Sala).all()
    return [montar_sala_read(sala) for sala in salas]


@router.post("", response_model=SalaRead)
def criar_sala(dados: SalaCreate, db: Session = Depends(get_db)):
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
    db.commit()
    db.refresh(nova_sala)

    for id_recurso in dados.recursos:
        db.add(
            SalaRecurso(
                idSala=nova_sala.idSala,
                idRecurso=id_recurso,
            )
        )

    db.commit()
    db.refresh(nova_sala)

    return montar_sala_read(nova_sala)


@router.put("/{idSala}", response_model=SalaRead)
def atualizar_sala(
    idSala: int,
    dados: SalaUpdate,
    db: Session = Depends(get_db),
):
    sala = db.query(Sala).filter(Sala.idSala == idSala).first()

    if not sala:
        raise HTTPException(status_code=404, detail="Sala não encontrada")

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

    return montar_sala_read(sala)


@router.delete("/{idSala}")
def excluir_sala(idSala: int, db: Session = Depends(get_db)):
    sala = db.query(Sala).filter(Sala.idSala == idSala).first()

    if not sala:
        raise HTTPException(status_code=404, detail="Sala não encontrada")

    db.delete(sala)
    db.commit()

    return {"message": "Sala excluída com sucesso"}