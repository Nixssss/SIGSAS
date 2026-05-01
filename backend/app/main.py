from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_router import router as api_router
from app.db.session import Base, engine
import uvicorn

# Cria as tabelas automaticamente
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SIGSAS")

# Configura CORS liberado
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy"}

app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )