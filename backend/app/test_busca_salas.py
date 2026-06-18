from app.db.session import SessionLocal
from app.services.busca_salas_service import buscar_salas


def main():
    db = SessionLocal()

    resultado_nlu = {
        "tipo_sala": "Laboratório de informática",
        "capacidade": 30
    }

    salas = buscar_salas(resultado_nlu, db)

    print("\nSALAS ENCONTRADAS:\n")

    if not salas:
        print("Nenhuma sala encontrada")
    else:
        for s in salas:
            print(
                f"- {s.nome} | capacidade: {s.capacidade}"
            )

    db.close()


if __name__ == "__main__":
    main()