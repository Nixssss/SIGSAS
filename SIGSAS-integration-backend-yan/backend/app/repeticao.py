import random
import unicodedata
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.palavras import Palavra


def normalize(text):
    return (
        unicodedata.normalize("NFKD", text)
        .encode("ASCII", "ignore")
        .decode("ASCII")
    )


base_words = [
    "aula", "prova", "aluno", "professor", "sala", "curso",
    "disciplina", "biblioteca", "laboratorio", "campus",
    "estudo", "pesquisa", "trabalho", "avaliacao", "nota",
    "frequencia", "matricula", "conteudo", "atividade",
    "projeto", "seminario", "apresentacao", "coordenacao",
    "diretoria", "secretaria", "ensino", "universidade",
    "recurso", "reserva", "resposta", "palavra"
]

base_words = [normalize(w) for w in base_words]


prefixes = ["uni", "multi", "bio", "geo", "tec", "info", "edu", "lab", "pro", "meta"]
suffixes = ["academico", "universitario", "escolar", "tecnico", "digital", "pratico", "avancado"]

prefixes = [normalize(w) for w in prefixes]
suffixes = [normalize(w) for w in suffixes]


def generate_unique_words(target=2000):
    words = set()

    # 1. base puro
    for w in base_words:
        words.add(w)

    # 2. base + base
    for a in base_words:
        for b in base_words:
            if a != b:
                words.add(f"{a}_{b}")

    # 3. prefixo + base
    for p in prefixes:
        for w in base_words:
            words.add(f"{p}_{w}")

    # 4. base + sufixo
    for w in base_words:
        for s in suffixes:
            words.add(f"{w}_{s}")

    # 5. extensão controlada até 2000
    attempts = 0
    while len(words) < target and attempts < 50000:
        a = random.choice(base_words)
        b = random.choice(base_words)
        p = random.choice(prefixes)

        words.add(f"{p}_{a}_{b}")
        attempts += 1

    return list(words)[:target]


def insert_words():
    db: Session = SessionLocal()

    try:
        words = generate_unique_words(2000)

        existing = {w[0] for w in db.query(Palavra.palavra).all()}

        inserted = 0

        for w in words:
            if w not in existing:
                db.add(Palavra(palavra=w))
                inserted += 1
                existing.add(w)

        db.commit()

        print(f"✔ Inseridas: {inserted}")
        print(f"✔ Total gerado: {len(words)}")

    except Exception as e:
        db.rollback()
        print("✖ Erro:", e)

    finally:
        db.close()


if __name__ == "__main__":
    insert_words()