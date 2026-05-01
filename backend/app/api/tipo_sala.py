from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.tipo_sala import TipoSala
from backend.app.schemas.tipo_sala import TipoSala as Schema, TipoSalaCreate

router = APIRouter(
    prefix="/tipo_sala",
    tags=["Tipo Sala"]
)

@router.post("/", response_model=Schema)
def create(tipo_sala_create: TipoSalaCreate, db: Session = Depends(get_db)) -> Schema:
    db_tipo_sala = TipoSala(**tipo_sala_create.dict())
    db.add(db_tipo_sala)
    db.commit()
    db.refresh(db_tipo_sala)
    return db_tipo_sala

@router.get("/", response_model=List[Schema])
def list_(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)) -> List[Schema]:
    tipo_salas = db.query(TipoSala).offset(skip).limit(limit).all()
    return tipo_salas

@router.get("/{tipo_sala_id}", response_model=Schema)
def get(tipo_sala_id: int, db: Session = Depends(get_db)) -> Schema:
    db_tipo_sala = db.query(TipoSala).filter(TipoSala.id == tipo_sala_id).first()
    if db_tipo_sala is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{TipoSala.__name__} not found",
        )
    return db_tipo_sala

@router.delete("/{tipo_sala_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(tipo_sala_id: int, db: Session = Depends(get_db)):
    db_tipo_sala = db.query(TipoSala).filter(TipoSala.id == tipo_sala_id).first()
    if db_tipo_sala is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{TipoSala.__name__} not found")
    db.delete(db_tipo_sala)
    db.commit()
    return None