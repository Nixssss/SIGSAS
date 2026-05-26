from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.tabela import Tabela, TabelaCreate, TabelaUpdate
from app.services.tabela_service import TabelaService

router = APIRouter(prefix="/tabelas", tags=["tabelas"])

service = TabelaService()

@router.get("/", response_model=List[Tabela])
def list_tabelas(db: Session = Depends(get_db)):
    return service.list_all(db)

@router.get("/{id}", response_model=Tabela)
def get_tabela(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Tabela not found")
    return db_obj

@router.post("/", response_model=Tabela, status_code=201)
def create_tabela(obj_in: TabelaCreate, db: Session = Depends(get_db)):
    return service.create(db, obj_in=obj_in)

@router.put("/{id}", response_model=Tabela)
def update_tabela(id: int, obj_in: TabelaUpdate, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Tabela not found")
    return service.update(db, id=id, obj_in=obj_in)

@router.delete("/{id}", status_code=204)
def delete_tabela(id: int, db: Session = Depends(get_db)):
    db_obj = service.get_by_id(db, id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Tabela not found")
    service.delete(db, id=id)