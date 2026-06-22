from app.models.tipo_sala import TipoSala
from app.models.palavras import Palavra
from app.models.erro_palavra import ErroPalavra
from sqlalchemy import or_


def obter_tipo_sala(db, texto: str):

    if not texto:
        return None

    termo = texto.strip().lower()

    print("\n===== OBTER_TIPO_SALA DEBUG =====")
    print("TERMO RECEBIDO:", termo)

    # =========================
    # 1. MATCH EXATO (PRIORIDADE)
    # =========================
    tipo = (
        db.query(TipoSala)
        .filter(TipoSala.nome.ilike(termo))
        .first()
    )

    if tipo:
        print("MATCH EXATO:", tipo.id, "-", tipo.nome)
        return tipo

    # =========================
    # 2. MATCH PARCIAL
    # =========================
    tipos_encontrados = (
        db.query(TipoSala)
        .filter(TipoSala.nome.ilike(f"%{termo}%"))
        .all()
    )

    print("\nMATCHES PARCIAIS ENCONTRADOS:")

    for t in tipos_encontrados:
        print(t.id, "-", t.nome)

    if len(tipos_encontrados) == 1:
        print("RETORNANDO MATCH PARCIAL ÚNICO")
        return tipos_encontrados[0]

    # =========================
    # 3. PALAVRAS (SINÔNIMOS)
    # =========================
    palavra = (
        db.query(Palavra)
        .filter(Palavra.palavra.ilike(termo))
        .first()
    )

    if palavra:

        print("\nSINÔNIMO ENCONTRADO:", palavra.palavra)

        tipo = (
            db.query(TipoSala)
            .filter(TipoSala.nome.ilike(f"%{palavra.palavra}%"))
            .first()
        )

        if tipo:
            print(
                "TIPO ENCONTRADO VIA SINÔNIMO:",
                tipo.id,
                "-",
                tipo.nome
            )
            return tipo

    # =========================
    # 4. ERRO PALAVRAS
    # =========================
    erro = (
        db.query(ErroPalavra)
        .filter(ErroPalavra.palavraerrada.ilike(termo))
        .first()
    )

    if erro:

        print("\nERRO PALAVRA ENCONTRADO:", erro.palavraerrada)

        palavra_corrigida = (
            db.query(Palavra)
            .filter(Palavra.id == erro.palavra_id)
            .first()
        )

        if palavra_corrigida:

            print(
                "CORRIGIDO PARA:",
                palavra_corrigida.palavra
            )

            tipo = (
                db.query(TipoSala)
                .filter(
                    TipoSala.nome.ilike(
                        f"%{palavra_corrigida.palavra}%"
                    )
                )
                .first()
            )

            if tipo:
                print(
                    "TIPO ENCONTRADO VIA CORREÇÃO:",
                    tipo.id,
                    "-",
                    tipo.nome
                )
                return tipo

    print("\nNENHUM TIPO ENCONTRADO")
    return None