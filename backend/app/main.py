from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import Base, engine
import app.models

app = FastAPI(title="SIGSAS")

# CORS (1 vez só)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔥 cria todas as tabelas depois de carregar os models
Base.metadata.create_all(bind=engine)

# rotas
from app.api.api_router import router as api_router
app.include_router(api_router, prefix="/api/v1")


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}