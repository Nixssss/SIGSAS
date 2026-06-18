from app.db.session import SessionLocal
from app.models.recurso import Recurso

db = SessionLocal()

for r in db.query(Recurso).all():
    print(r.nome)