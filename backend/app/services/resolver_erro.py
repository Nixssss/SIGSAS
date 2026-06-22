import re
from app.models.erro_palavra import ErroPalavra
from app.models.palavras import Palavra


def resolver_erro_palavra(frase, db):

    if not frase:
        return frase

    texto = frase.lower()

    erros = db.query(ErroPalavra).all()

    # 🔥 maior primeiro evita sobrescrita parcial
    erros = sorted(erros, key=lambda e: len(e.palavraerrada), reverse=True)

    print("\n========== RESOLVER_ERRO DEBUG ==========")
    print("[INPUT]", texto)

    for erro in erros:

        errado = erro.palavraerrada.lower()

        # 🔥 match EXATO de palavra/frase
        pattern = r"\b" + re.escape(errado) + r"\b"

        if not re.search(pattern, texto):
            continue

        palavra_correta = (
            db.query(Palavra)
            .filter(Palavra.id == erro.palavra_id)
            .first()
        )

        if not palavra_correta:
            print("\n⚠ ERRO SEM MAPEAMENTO NO BANCO:", errado)
            continue

        correto = palavra_correta.palavra.lower()

        # 🔥 evita substituir por ele mesmo
        if errado == correto:
            continue

        print("\n--- MATCH ENCONTRADO ---")
        print("ERRADO:", errado)
        print("CORRETO:", correto)
        print("ANTES:", texto)

        # 🔥 substituição segura (não duplica texto)
        texto = re.sub(pattern, correto, texto)

        print("DEPOIS:", texto)

    # 🔥 limpeza final de espaços duplicados
    texto = re.sub(r"\s+", " ", texto).strip()

    print("========== FINAL ==========")
    print(texto)

    return texto