from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, time

class ReservaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sala_id: int
    data: date
    horario_inicio: time
    horario_fim: time
    proposito: str
    status: str = "pendente"

class ReservaCreate(ReservaBase):
    pass

class ReservaUpdate(BaseModel):
    sala_id: Optional[int] = None
    data: Optional[date] = None
    horario_inicio: Optional[time] = None
    horario_fim: Optional[time] = None
    proposito: Optional[str] = None
    status: Optional[str] = None

class Reserva(ReservaBase):
    id: int
