# app/utils/texto.py

import unicodedata

def normalizar(texto: str) -> str:
    return unicodedata.normalize("NFKD", texto)\
        .encode("ASCII", "ignore")\
        .decode("ASCII")\
        .lower()\
        .strip()