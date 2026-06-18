from app.models.tipo_sala import TipoSala
from app.models.palavras import Palavra
from app.models.erro_palavra import ErroPalavra
from sqlalchemy import or_


def obter_tipo_sala(db, texto: str):

    if not texto:
        return None

    termo = texto.strip().lower()

    # =========================
    # 1. MATCH FLEXÍVEL (CORREÇÃO PRINCIPAL)
    # =========================
    tipo = (
        db.query(TipoSala)
        .filter(
            or_(
                TipoSala.nome.ilike(f"%{termo}%"),
                TipoSala.nome.ilike(termo)
            )
        )
        .first()
    )

    if tipo:
        return tipo

    # =========================
    # 2. PALAVRAS (SINÔNIMOS)
    # =========================
    palavra = (
        db.query(Palavra)
        .filter(Palavra.palavra.ilike(termo))
        .first()
    )

    if palavra:

        tipo = (
            db.query(TipoSala)
            .filter(TipoSala.nome.ilike(f"%{palavra.palavra}%"))
            .first()
        )

        if tipo:
            return tipo

    # =========================
    # 3. ERRO PALAVRAS (CORREÇÃO ORTOGRÁFICA)
    # =========================
    erro = (
        db.query(ErroPalavra)
        .filter(ErroPalavra.palavraerrada.ilike(termo))
        .first()
    )

    if erro:

        palavra_corrigida = (
            db.query(Palavra)
            .filter(Palavra.id == erro.palavra_id)
            .first()
        )

        if palavra_corrigida:

            tipo = (
                db.query(TipoSala)
                .filter(TipoSala.nome.ilike(f"%{palavra_corrigida.palavra}%"))
                .first()
            )

            if tipo:
                return tipo

    return None