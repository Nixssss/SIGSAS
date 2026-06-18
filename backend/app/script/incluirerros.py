from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.palavras import Palavra
from app.models.erro_palavra import ErroPalavra


SINONIMOS = {
    "Sala de Aula": ["sala aula", "sala comum", "sala"],

    "Laboratório de informática": [
        "lab informatica",
        "laboratorio informatica",
        "laboratorio ti",
        "lab ti",
        "informatica",
        "ti"
    ],

    "Laboratório de química": ["lab quimica", "quimica"],
    "Laboratório de física": ["lab fisica", "fisica"],
    "Laboratório de biologia": ["lab biologia", "biologia"],

    "Sala de cozinha": ["cozinha"],
    "Auditório": ["auditorio", "miniauditorio"],
    "Biblioteca": ["biblioteca"],
    "Sala de reunião": ["reuniao"],
    "Sala de professores": ["professores"],
    "Sala administrativa": ["administrativa"],
    "Oficina": ["oficina"],
    "Estúdio": ["estudio"],
    "Ginásio": ["ginasio"],
    "Quadra": ["quadra"],

    "Laboratório de Redes": ["redes"],
    "Laboratório de Segurança da Informação": ["seguranca informacao"],
    "Laboratório de Banco de Dados": ["banco de dados", "bd"],
    "Laboratório de Engenharia": ["engenharia"],
    "Laboratório de Mecânica": ["mecanica"],
    "Laboratório de Elétrica": ["eletrica"],
    "Laboratório de Anatomia": ["anatomia"],

    "Laboratório de Simulação Realística": ["simulacao"],
    "Laboratório Maker": ["maker", "lab maker"],
    "Laboratório de Robótica": ["robotica"],
    "Laboratório de Design": ["design"],
    "Laboratório Jurídico": ["juridico"],
    "Núcleo de Prática Jurídica": ["npj"],
    "Clínica Escola": ["clinica"],

    "Sala de Dança": ["danca"],
    "Sala de Treinamento": ["treinamento"],
    "Miniauditório": ["miniauditorio"],

    "Laboratório de saúde": ["saude"],
    "Sala jurídica": ["juridica"],
    "Sala de design e comunicação": ["comunicacao"],
    "Sala de gastronomia": ["gastronomia"]
}


def popular_erros():
    session: Session = SessionLocal()

    try:
        for palavra_correta, erros in SINONIMOS.items():

            palavra_obj = session.query(Palavra).filter_by(palavra=palavra_correta).first()

            if not palavra_obj:
                palavra_obj = Palavra(palavra=palavra_correta)
                session.add(palavra_obj)
                session.flush()

            for erro in erros:

                erro_existente = session.query(ErroPalavra).filter_by(
                    palavra_id=palavra_obj.id,
                    palavraerrada=erro
                ).first()

                if erro_existente:
                    continue

                session.add(
                    ErroPalavra(
                        palavra_id=palavra_obj.id,
                        palavraerrada=erro
                    )
                )

        session.commit()
        print("✔ Erros de palavras populados com sucesso!")

    except Exception as e:
        session.rollback()
        print(f"[ERROR] {e}")

    finally:
        session.close()


if __name__ == "__main__":
    popular_erros()