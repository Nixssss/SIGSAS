import re
from collections import defaultdict
from sqlalchemy import text

from app.db.session import SessionLocal
from app.models.palavras import Palavra
from app.models.peso_palavra import PesoPalavra

from app.utils.texto import normalizar 


# =========================
# NEGAÇÃO
# =========================
def tem_negacao(frase: str) -> bool:
    frase = normalizar(frase)
    return any(p in frase for p in ["nao", "não", "nunca", "jamais"])


# =========================
# LIMPEZA
# =========================
def limpar(frase: str):
    frase = normalizar(frase)

    frase = re.sub(r"\b\d{1,2}h\b", " ", frase)
    frase = re.sub(r"\b\d{1,2}:\d{2}\b", " ", frase)
    frase = re.sub(r"\b\d+\b", " ", frase)

    return set(frase.split())


# =========================
# CLASSIFICADOR
# =========================
def classificar(frase: str):

    if not frase:
        return None

    db = SessionLocal()

    try:
        frase_limpa = limpar(frase)
        negado = tem_negacao(frase)

        assuntos = {
            1: "reservar",
            2: "consultar",
            3: "cancelar",
            4: "alterar"
        }

        palavras_db = db.query(Palavra).all()
        vocab = {normalizar(p.palavra): p.id for p in palavras_db}

        pesos = db.query(PesoPalavra).all()

        mapa = defaultdict(lambda: defaultdict(float))

        for p in pesos:
            mapa[p.palavra_id][p.assunto_id] = p.peso

        score = defaultdict(float)

        # =========================
        # PROCESSAMENTO
        # =========================
        for palavra in frase_limpa:

            palavra = normalizar(palavra)

            palavra_ids = []

            # match direto
            if palavra in vocab:
                palavra_ids.append(vocab[palavra])

            # match por erros
            erros = db.execute(
                text("""
                    SELECT palavra_id
                    FROM erros_palavras
                    WHERE LOWER(palavraerrada) = :p
                """),
                {"p": palavra}
            ).fetchall()

            palavra_ids.extend([e[0] for e in erros])

            # aplica pesos
            for pid in palavra_ids:
                for assunto_id, peso in mapa[pid].items():
                    score[assunto_id] += peso

        if not score:
            return None

        melhor_id = max(score, key=score.get)

        if negado:
            score[melhor_id] *= 0.3
            melhor_id = max(score, key=score.get)

        return assuntos.get(melhor_id)

    finally:
        db.close()