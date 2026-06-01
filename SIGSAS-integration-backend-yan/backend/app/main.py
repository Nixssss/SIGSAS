from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import Base, engine

# 1. IMPORTAR OS MODELOS ANTES DO CREATE_ALL
import app.models

# 2. IMPORTAR OS ROUTERS DOS LUGARES CERTOS
from app.schemas.chat import router as ia_router
from app.api.api_router import router as api_router

app = FastAPI(title="SIGSAS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. CRIAR AS TABELAS
Base.metadata.create_all(bind=engine)

# 4. INCLUIR ROTAS
app.include_router(ia_router)
app.include_router(api_router, prefix="/api/v1")

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}