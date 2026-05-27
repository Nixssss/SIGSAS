from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.auditoria import Auditoria
from app.schemas.auditoria import AuditoriaRead


router = APIRouter(prefix="/auditoria", tags=["Auditoria"])


@router.get("", response_model=list[AuditoriaRead])
def listar_logs(db: Session = Depends(get_db)):
    return db.query(Auditoria).order_by(Auditoria.id.desc()).all()