from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    chat,
    reservas,
    auth,
    chatfluxo_router,
    instituicoes,
    campi,
    edificios,
    tipos_sala,
    recursos,
    tipo_sala_recursos,
    salas,
    convites,
    cargos,
    seed,
    usuarios,
    auditoria,
    reportes_problemas,
    sugestoes_melhorias,
    palavras_router,
)

from app.db.session import Base, engine

from app.models.usuario import Usuario
from app.models.instituicao import Instituicao
from app.models.campus import Campus
from app.models.edificio import Edificio
from app.models.sala import Sala
from app.models.tipo_sala import TipoSala
from app.models.recurso import Recurso
from app.models.tipo_sala_recurso import TipoSalaRecurso
from app.models.sala_recurso import SalaRecurso
from app.models.reserva import Reserva
from app.models.convite import Convite
from app.models.cargo import Cargo
from app.models.auditoria import Auditoria
from app.models.reporte_problema import ReporteProblema
from app.models.sugestao_melhoria import SugestaoMelhoria


def create_db_tables():
    Base.metadata.create_all(bind=engine)


create_db_tables()

app = FastAPI(
    title="SIGSAS API",
    description="API para o Sistema Inteligente de Gerenciamento de Salas (SIGSAS)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/v1/ia", tags=["Chat Inteligente"])
app.include_router(reservas.router, prefix="/api/v1", tags=["Reservas"])
app.include_router(auth.router, prefix="/api/v1", tags=["Autenticação"])
app.include_router(chatfluxo_router.router, prefix="/api/v1", tags=["Chatbot Fluxo"])

app.include_router(instituicoes.router, prefix="/api/v1", tags=["Instituições"])
app.include_router(campi.router, prefix="/api/v1", tags=["Campi"])
app.include_router(edificios.router, prefix="/api/v1", tags=["Edifícios"])
app.include_router(tipos_sala.router, prefix="/api/v1", tags=["Tipos de Sala"])
app.include_router(recursos.router, prefix="/api/v1", tags=["Recursos"])
app.include_router(tipo_sala_recursos.router, prefix="/api/v1", tags=["Tipos de Sala - Recursos"])
app.include_router(salas.router, prefix="/api/v1", tags=["Salas"])
app.include_router(convites.router, prefix="/api/v1", tags=["Convites"])
app.include_router(cargos.router, prefix="/api/v1", tags=["Cargos"])
app.include_router(seed.router, prefix="/api/v1", tags=["Seed"])
app.include_router(usuarios.router, prefix="/api/v1", tags=["Usuários"])
app.include_router(auditoria.router, prefix="/api/v1", tags=["Auditoria"])
app.include_router(reportes_problemas.router, prefix="/api/v1", tags=["Reportes de Problemas"])
app.include_router(sugestoes_melhorias.router, prefix="/api/v1", tags=["Sugestões de Melhorias"])


@app.get("/api/v1/health", tags=["Health Check"])
def health_check():
    return {"status": "ok", "message": "SIGSAS API is running!"}