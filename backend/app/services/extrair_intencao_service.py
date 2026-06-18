from app.models.palavras import Palavra
from app.models.peso_palavra import PesoPalavra
from app.models.erro_palavra import ErroPalavra


def extrair_intencao(frase, db):

    tokens = frase.lower().split()

    scores = {}

    for token in tokens:

        palavra = (
            db.query(Palavra)
            .filter(Palavra.palavra.ilike(token))
            .first()
        )

        if not palavra:

            erro = (
                db.query(ErroPalavra)
                .filter(ErroPalavra.palavraerrada.ilike(token))
                .first()
            )

            if erro:
                palavra = db.query(Palavra).filter(Palavra.id == erro.palavra_id).first()

        if not palavra:
            continue

        pesos = db.query(PesoPalavra).filter_by(palavra_id=palavra.id).all()

        for p in pesos:
            scores[p.assunto_id] = scores.get(p.assunto_id, 0) + p.peso

    if not scores:
        return "consulta"  # fallback seguro

    return max(scores, key=scores.get)