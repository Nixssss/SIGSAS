import unicodedata

from app.db.session import SessionLocal
from app.models.palavras import Palavra
from app.models.tipo_sala import TipoSala
from app.models.recurso import Recurso


def normalizar(texto):
    return unicodedata.normalize(
        "NFKD", texto
    ).encode(
        "ASCII", "ignore"
    ).decode("ASCII").lower().strip()


def extrair_tokens(texto):

    texto = normalizar(texto)
    return set(texto.split())


def main():

    db = SessionLocal()

    palavras_existentes = {
        p.palavra.lower()
        for p in db.query(Palavra).all()
    }

    novos = set()

    # =========================
    # TIPOS DE SALA
    # =========================
    tipos = db.query(TipoSala).all()

    for t in tipos:
        tokens = extrair_tokens(t.nome)
        novos.update(tokens)

    # =========================
    # RECURSOS
    # =========================
    recursos = db.query(Recurso).all()

    for r in recursos:
        tokens = extrair_tokens(r.nome)
        novos.update(tokens)

    # =========================
    # INSERIR NO BANCO
    # =========================
    for p in novos:

        if p not in palavras_existentes and len(p) > 1:

            db.add(Palavra(palavra=p))

    db.commit()
    db.close()

    print("Palavras base (tipos + recursos) inseridas com sucesso!")


if __name__ == "__main__":
    main()