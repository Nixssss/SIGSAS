from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.campus import Campus
from app.models.instituicao import Instituicao
from app.schemas.campus import CampusCreate, CampusUpdate, CampusRead

router = APIRouter(prefix="/campi", tags=["Campi"])


@router.get("", response_model=list[CampusRead])
def listar_campi(db: Session = Depends(get_db)):
    return db.query(Campus).all()


@router.post("", response_model=CampusRead)
def criar_campus(
    dados: CampusCreate,
    db: Session = Depends(get_db),
):
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

    return novo


@router.put("/{campus_id}", response_model=CampusRead)
def atualizar_campus(
    campus_id: int,
    dados: CampusUpdate,
    db: Session = Depends(get_db),
):
    campus = db.query(Campus).filter(Campus.id == campus_id).first()

    if not campus:
        raise HTTPException(status_code=404, detail="Campus não encontrado")

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

    return campus


@router.delete("/{campus_id}")
def excluir_campus(
    campus_id: int,
    db: Session = Depends(get_db),
):
    campus = db.query(Campus).filter(Campus.id == campus_id).first()

    if not campus:
        raise HTTPException(status_code=404, detail="Campus não encontrado")

    db.delete(campus)
    db.commit()

    return {"message": "Campus excluído com sucesso"}