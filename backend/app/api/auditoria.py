from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.auditoria import Auditoria
from app.schemas.auditoria import AuditoriaRead


router = APIRouter(prefix="/auditoria", tags=["Auditoria"])


@router.get("", response_model=list[AuditoriaRead])
def listar_logs(
    db: Session = Depends(get_db),
    modulo: str | None = Query(default=None),
    status: str | None = Query(default=None),
    acao: str | None = Query(default=None),
    limite: int = Query(default=500, ge=1, le=2000),
):
    query = db.query(Auditoria)

    if modulo:
        query = query.filter(Auditoria.modulo.ilike(f"%{modulo.strip()}%"))

    if status:
        query = query.filter(Auditoria.status.ilike(f"%{status.strip()}%"))

    if acao:
        query = query.filter(Auditoria.acao.ilike(f"%{acao.strip()}%"))

    return query.order_by(Auditoria.id.desc()).limit(limite).all()
