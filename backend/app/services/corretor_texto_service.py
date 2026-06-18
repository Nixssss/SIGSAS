from app.services.erro_palavra_service import buscar_correcoes
from app.utils.texto import normalizar

def corrigir_texto(frase: str, db):

    frase = normalizar(frase)

    palavras = frase.split()
    palavras_corrigidas = []

    for p in palavras:
        correcao = buscar_correcoes(p, db)

        if correcao:
            palavras_corrigidas.append(correcao)
        else:
            palavras_corrigidas.append(p)

    return " ".join(palavras_corrigidas)