from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tipo_sala import TipoSala
from app.models.recurso import Recurso
from app.models.tipo_sala_recurso import TipoSalaRecurso
from app.schemas.recurso import RecursoRead


router = APIRouter(prefix="/tipos-sala", tags=["Tipos de Sala - Recursos"])


@router.get("/{idTipoSala}/recursos", response_model=list[RecursoRead])
def listar_recursos_do_tipo(
    idTipoSala: int,
    db: Session = Depends(get_db),
):
    tipo = db.query(TipoSala).filter(TipoSala.id == idTipoSala).first()

    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de sala não encontrado")

    vinculos = (
        db.query(TipoSalaRecurso)
        .filter(TipoSalaRecurso.idTipoSala == idTipoSala)
        .all()
    )

    return [v.recurso for v in vinculos]


@router.post("/{idTipoSala}/recursos/{idRecurso}")
def vincular_recurso_ao_tipo(
    idTipoSala: int,
    idRecurso: int,
    db: Session = Depends(get_db),
):
    tipo = db.query(TipoSala).filter(TipoSala.id == idTipoSala).first()

    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de sala não encontrado")

    recurso = db.query(Recurso).filter(Recurso.id == idRecurso).first()

    if not recurso:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")

    ja_existe = (
        db.query(TipoSalaRecurso)
        .filter(
            TipoSalaRecurso.idTipoSala == idTipoSala,
            TipoSalaRecurso.idRecurso == idRecurso,
        )
        .first()
    )

    if ja_existe:
        return {"message": "Recurso já vinculado a este tipo de sala"}

    vinculo = TipoSalaRecurso(
        idTipoSala=idTipoSala,
        idRecurso=idRecurso,
    )

    db.add(vinculo)
    db.commit()

    return {"message": "Recurso vinculado ao tipo de sala com sucesso"}


@router.delete("/{idTipoSala}/recursos/{idRecurso}")
def desvincular_recurso_do_tipo(
    idTipoSala: int,
    idRecurso: int,
    db: Session = Depends(get_db),
):
    vinculo = (
        db.query(TipoSalaRecurso)
        .filter(
            TipoSalaRecurso.idTipoSala == idTipoSala,
            TipoSalaRecurso.idRecurso == idRecurso,
        )
        .first()
    )

    if not vinculo:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")

    db.delete(vinculo)
    db.commit()

    return {"message": "Recurso desvinculado do tipo de sala com sucesso"}