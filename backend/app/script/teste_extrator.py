from app.db.session import SessionLocal
from app.services.extrator_filtro_service import extrair_filtros

db = SessionLocal()

frase = "quero um laboratorio de informatica para 30 alunos com projetor"

print(extrair_filtros(frase, db))