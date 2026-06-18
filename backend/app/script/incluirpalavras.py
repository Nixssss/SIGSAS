import re
import unicodedata

from app.db.session import SessionLocal
from app.models.palavras import Palavra  # ajuste se seu model tiver outro nome

# =========================
# REMOVE ACENTOS
# =========================
def remover_acentos(texto):
    return unicodedata.normalize(
        "NFKD", texto
    ).encode(
        "ASCII", "ignore"
    ).decode("ASCII")


# =========================
# STOPWORDS
# =========================
STOPWORDS = {
    "de", "da", "do", "das", "dos",
    "uma", "um", "para", "e", "ou",
    "a", "o", "as", "os",
    "no", "na", "nas", "nos",
    "com", "sem",
    "quero", "preciso", "tem", "existe",
    "hoje", "amanha"
}


# =========================
# EXTRAI PALAVRAS
# =========================
def extrair_palavras(frase):
    frase = remover_acentos(frase.lower())
    frase = re.sub(r"[^a-z\s]", " ", frase)

    palavras = frase.split()

    return set(
        p for p in palavras
        if p not in STOPWORDS and len(p) > 1
    )


# =========================
# SALVAR NO BANCO (SQLALCHEMY)
# =========================
def salvar_palavras(db, palavras):

    for p in palavras:

        existe = db.query(Palavra).filter(
            Palavra.palavra == p
        ).first()

        if not existe:
            db.add(Palavra(palavra=p))

    db.commit()


# =========================
# FRASES
# =========================
frases = [
    # =========================
    # RESERVAR
    # =========================
    "Quero reservar uma sala para amanhã às 14h",
    "Preciso de uma sala para 30 alunos às 10h",
    "Quero marcar um laboratório de informática às 15h",
    "Preciso agendar uma sala para sexta às 19h",
    "Quero reservar um auditório para 100 pessoas",
    "Preciso de uma sala com projetor para amanhã",
    "Quero marcar uma sala de aula às 8h",
    "Quero reservar uma sala para reunião às 16h",
    "Preciso agendar um laboratório para segunda-feira",
    "Quero uma sala disponível às 14h",
    "Quero reservar sala com ar condicionado",
    "Preciso de um laboratório para 40 alunos",
    "Quero agendar sala para apresentação",
    "Quero reservar sala com microfone e projetor",
    "Preciso de uma sala grande para evento",
    "Quero marcar uma sala para hoje às 18h",
    "Quero reservar laboratório de química",
    "Preciso de uma sala para prova amanhã",
    "Quero agendar auditório para palestra",
    "Quero uma sala para treinamento",

    # =========================
    # CANCELAR
    # =========================
    "Quero cancelar minha reserva de sala",
    "Preciso cancelar a sala que reservei",
    "Cancele minha reserva para amanhã",
    "Quero cancelar o laboratório reservado",
    "Cancelar agendamento de sala",
    "Preciso cancelar minha sala das 14h",
    "Quero desfazer minha reserva",
    "Cancelar sala 203 por favor",
    "Quero cancelar o auditório reservado",
    "Preciso cancelar reserva de hoje",
    "Cancelar minha sala de reunião",
    "Quero cancelar a reserva da sexta",
    "Cancele o laboratório de informática",
    "Preciso remover minha reserva de sala",
    "Quero cancelar tudo que agendei",
    "Cancelar sala marcada para amanhã",
    "Quero cancelar reserva das 18h",
    "Preciso cancelar a sala do evento",
    "Cancelar agendamento do laboratório",
    "Quero desistir da reserva da sala",

    # =========================
    # CONSULTAR
    # =========================
    "Tem sala disponível hoje às 14h",
    "Existe laboratório livre amanhã",
    "Quero saber salas disponíveis às 19h",
    "Tem auditório livre na sexta",
    "Quais salas estão disponíveis hoje",
    "Existe sala para 30 alunos amanhã",
    "Tem laboratório de informática livre",
    "Quero consultar salas disponíveis",
    "Tem sala com projetor hoje",
    "Existe sala disponível às 8h",
    "Quais laboratórios estão livres",
    "Tem sala grande disponível amanhã",
    "Existe auditório livre hoje à noite",
    "Quero ver salas para reunião",
    "Tem sala disponível sexta às 10h",
    "Existe sala para evento hoje",
    "Quais salas posso reservar agora",
    "Tem sala livre às 15h",
    "Existe laboratório disponível para hoje",
    "Quero ver disponibilidade de salas"
]


# =========================
# EXECUÇÃO
# =========================
def main():

    db = SessionLocal()

    try:
        todas_palavras = set()

        for f in frases:
            todas_palavras.update(extrair_palavras(f))

        salvar_palavras(db, todas_palavras)

        print("Palavras inseridas com sucesso!")

    finally:
        db.close()


if __name__ == "__main__":
    main()