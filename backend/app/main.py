from fastapi import FastAPI
from app.api import chat, reservas, auth
from app.db.session import Base, engine
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/api/v1/health", tags=["Health Check"])
def health_check():
    return {"status": "ok", "message": "SIGSAS API is running!"}

