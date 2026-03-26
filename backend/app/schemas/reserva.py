from pydantic import BaseModel
from datetime import datetime

class ReservaCreate(BaseModel):
    sala_id: int
    usuario_id: int
    data_inicio: datetime
    data_fim: datetime

class ReservaRead(ReservaCreate):
    id: int
    status: str

    class Config:
        from_attributes = True