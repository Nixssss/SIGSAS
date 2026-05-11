from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class ReservaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    usuario_id: int
    sala_id: int
    data_inicio: datetime
    data_fim: datetime
    status_reserva_id: Optional[int] = None


class ReservaCreate(ReservaBase):
    pass


class ReservaUpdate(BaseModel):
    usuario_id: Optional[int] = None
    sala_id: Optional[int] = None
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    status_reserva_id: Optional[int] = None


class Reserva(ReservaBase):
    id: int