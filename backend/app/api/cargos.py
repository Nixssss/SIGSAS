from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.cargo import Cargo
from app.schemas.cargo import CargoCreate, CargoUpdate, CargoRead


router = APIRouter(prefix="/cargos", tags=["Cargos"])


@router.get("", response_model=list[CargoRead])
def listar_cargos(db: Session = Depends(get_db)):
    return db.query(Cargo).filter(Cargo.ativo == True).order_by(Cargo.nome.asc()).all()


@router.post("", response_model=CargoRead)
def criar_cargo(dados: CargoCreate, db: Session = Depends(get_db)):
    nome = dados.nome.strip()

    cargo_existente = db.query(Cargo).filter(Cargo.nome == nome).first()

    if cargo_existente:
        return cargo_existente

    cargo = Cargo(nome=nome, ativo=dados.ativo)

    db.add(cargo)
    db.commit()
    db.refresh(cargo)

    return cargo


@router.put("/{cargo_id}", response_model=CargoRead)
def atualizar_cargo(
    cargo_id: int,
    dados: CargoUpdate,
    db: Session = Depends(get_db),
):
    cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()

    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo não encontrado")

    if dados.nome is not None:
        cargo.nome = dados.nome.strip()

    if dados.ativo is not None:
        cargo.ativo = dados.ativo

    db.commit()
    db.refresh(cargo)

    return cargo


@router.delete("/{cargo_id}")
def excluir_cargo(cargo_id: int, db: Session = Depends(get_db)):
    cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()

    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo não encontrado")

    cargo.ativo = False

    db.commit()

    return {"message": "Cargo desativado com sucesso"}