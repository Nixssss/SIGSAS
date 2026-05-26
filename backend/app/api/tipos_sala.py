from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tipo_sala import TipoSala
from app.schemas.tipo_sala import TipoSalaCreate, TipoSalaUpdate, TipoSalaRead

router = APIRouter(prefix="/tipos-sala", tags=["Tipos de Sala"])


@router.get("", response_model=list[TipoSalaRead])
def listar_tipos_sala(db: Session = Depends(get_db)):
    return db.query(TipoSala).all()


@router.post("", response_model=TipoSalaRead)
def criar_tipo_sala(dados: TipoSalaCreate, db: Session = Depends(get_db)):
    novo = TipoSala(nome=dados.nome.strip())

    db.add(novo)
    db.commit()
    db.refresh(novo)

    return novo


@router.put("/{tipo_sala_id}", response_model=TipoSalaRead)
def atualizar_tipo_sala(
    tipo_sala_id: int,
    dados: TipoSalaUpdate,
    db: Session = Depends(get_db),
):
    tipo = db.query(TipoSala).filter(TipoSala.id == tipo_sala_id).first()

    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de sala não encontrado")

    if dados.nome is not None:
        tipo.nome = dados.nome.strip()

    db.commit()
    db.refresh(tipo)

    return tipo


@router.delete("/{tipo_sala_id}")
def excluir_tipo_sala(tipo_sala_id: int, db: Session = Depends(get_db)):
    tipo = db.query(TipoSala).filter(TipoSala.id == tipo_sala_id).first()

    if not tipo:
        raise HTTPException(status_code=404, detail="Tipo de sala não encontrado")

    db.delete(tipo)
    db.commit()

    return {"message": "Tipo de sala excluído com sucesso"}