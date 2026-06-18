import re
import requests
import unicodedata
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.palavras import Palavra


def remover_acentos(texto: str) -> str:
    return unicodedata.normalize("NFKD", texto).encode("ASCII", "ignore").decode("ASCII")


def limpar_texto(texto: str) -> str:
    texto = re.sub(r"<script.*?>.*?</script>", " ", texto, flags=re.S)
    texto = re.sub(r"<style.*?>.*?</style>", " ", texto, flags=re.S)

    texto = re.sub(r"[^\w\s]", " ", texto)
    texto = re.sub(r"\s+", " ", texto)

    return texto.strip().lower()


def extrair_palavras(texto: str):
    palavras = texto.split()

    palavras_filtradas = []

    for palavra in palavras:

        if palavra.isdigit():
            continue

        if len(palavra) < 3:
            continue

        palavras_filtradas.append(palavra)

    return palavras_filtradas


def crawler_palavras(url: str):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0"
        }

        response = requests.get(
            url,
            headers=headers,
            timeout=15
        )

        response.raise_for_status()

        soup = BeautifulSoup(
            response.text,
            "html.parser"
        )

        texto = soup.get_text(separator=" ")

        texto = limpar_texto(texto)
        texto = remover_acentos(texto)

        palavras = extrair_palavras(texto)

        palavras_unicas = list(dict.fromkeys(palavras))

        return palavras_unicas

    except Exception as e:
        print(f"❌ Erro ao acessar {url}: {e}")
        return []


def salvar_palavras_no_banco(palavras):
    db: Session = SessionLocal()

    try:
        inseridas = 0

        for palavra in palavras:

            existe = (
                db.query(Palavra)
                .filter(Palavra.palavra == palavra)
                .first()
            )

            if not existe:
                db.add(
                    Palavra(
                        palavra=palavra
                    )
                )

                inseridas += 1

        db.commit()

        print(f"\n✅ Inseridas no banco: {inseridas}")

    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao salvar: {e}")

    finally:
        db.close()


# ===================================
# URLs PARA VARREDURA
# ===================================

urls = [
    "https://prograd.ufla.br/reserva-de-sala",
    "https://www.economia.df.gov.br/reserva-do-espaco-fisico-da-escola-de-governo",
    "https://www.gov.br/hubrasil/pt-br/hospitais-universitarios/regiao-sudeste/hc-uftm/painel/gep/reserva-de-espacos-de-ensino",

    "https://www.ufmg.br",
    "https://www.unb.br",
    "https://www.ufrj.br",
    "https://www.ufscar.br",
    "https://www.ufpr.br",
    "https://www.ufpe.br",
    "https://www.ufba.br",

    "https://www.gov.br/educacao",
    "https://www.gov.br/ebserh",

    "https://www.unicamp.br",
    "https://www.usp.br",
    "https://www.ufg.br",
    "https://www.ufms.br",
    "https://www.ufes.br",

    "https://www.ifb.edu.br",
    "https://www.ifgoiano.edu.br",
    "https://www.ifg.edu.br",
    "https://www.ifsp.edu.br",

    "https://www.capes.gov.br",
    "https://www.cnpq.br"
]


# ===================================
# EXECUÇÃO
# ===================================

if __name__ == "__main__":

    todas_palavras = set()

    for url in urls:

        print("\n==============================")
        print("🌐 ACESSANDO:", url)

        palavras = crawler_palavras(url)

        print(f"📄 Encontradas: {len(palavras)} palavras")

        for palavra in palavras:
            todas_palavras.add(palavra)

    resultado_final = sorted(list(todas_palavras))

    print("\n==============================")
    print(f"✅ TOTAL DE PALAVRAS ÚNICAS: {len(resultado_final)}")

    print("\n🔍 Primeiras 100 palavras:")
    for palavra in resultado_final[:100]:
        print(palavra)

    salvar_palavras_no_banco(resultado_final)