from app.db.session import SessionLocal
from app.services.busca_salas_service import buscar_salas

db = SessionLocal()

try:

    filtros = {
        "tipo_sala": "laboratorio de informatica",
        "capacidade": 60,
        "recursos": ["computador"]
    }

    salas = buscar_salas(filtros, db)

    print(f"\nTOTAL ENCONTRADAS: {len(salas)}")
    print("-" * 50)

    for sala in salas:

        print(f"Nome: {sala.nome}")
        print(f"Capacidade: {sala.capacidade}")

        if sala.tipo_sala:
            print(f"Tipo: {sala.tipo_sala.nome}")

        recursos = []

        for sr in sala.recursos:

            if sr.recurso:
                recursos.append(sr.recurso.nome)

        print(f"Recursos: {recursos}")
        print("-" * 50)

finally:
    db.close()