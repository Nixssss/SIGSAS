from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.chatbotb_conversa import ChatbotBConversa
from app.services.chatbotb_historico_service import ChatbotBHistoricoService


router = APIRouter(prefix="/chatbotb-historico", tags=["ChatbotB Histórico"])

service = ChatbotBHistoricoService()


@router.get("")
def listar_historico_chatbotb(
    id_usuario: int | None = Query(default=None),
    session_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    busca: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(ChatbotBConversa)

    if id_usuario is not None:
        query = query.filter(ChatbotBConversa.id_usuario == id_usuario)

    if session_id:
        query = query.filter(ChatbotBConversa.session_id == session_id)

    if status:
        query = query.filter(ChatbotBConversa.status == status)

    if busca:
        termo = f"%{busca.strip()}%"
        query = query.filter(
            (ChatbotBConversa.nome_usuario.ilike(termo))
            | (ChatbotBConversa.email_usuario.ilike(termo))
            | (ChatbotBConversa.session_id.ilike(termo))
            | (ChatbotBConversa.perfil_usuario.ilike(termo))
        )

    total = query.count()

    conversas = (
        query.order_by(ChatbotBConversa.data_inicio.desc(), ChatbotBConversa.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [service.serializar_conversa(conversa) for conversa in conversas],
    }


@router.get("/usuario/{id_usuario}/txt")
def exportar_historico_usuario_txt(
    id_usuario: int,
    db: Session = Depends(get_db),
):
    conversas = (
        db.query(ChatbotBConversa)
        .filter(ChatbotBConversa.id_usuario == id_usuario)
        .order_by(ChatbotBConversa.data_inicio.asc(), ChatbotBConversa.id.asc())
        .all()
    )

    if not conversas:
        raise HTTPException(
            status_code=404,
            detail="Nenhum histórico encontrado para este usuário.",
        )

    conteudos = []

    for conversa in conversas:
        conteudos.append(service.montar_txt_conversa(conversa))

    conteudo_final = "\n\n\n".join(conteudos)

    headers = {
        "Content-Disposition": f'attachment; filename="chatbotb_usuario_{id_usuario}.txt"'
    }

    return Response(
        content=conteudo_final,
        media_type="text/plain; charset=utf-8",
        headers=headers,
    )


@router.get("/{id_conversa}")
def detalhar_historico_chatbotb(
    id_conversa: int,
    db: Session = Depends(get_db),
):
    conversa = (
        db.query(ChatbotBConversa)
        .filter(ChatbotBConversa.id == id_conversa)
        .first()
    )

    if not conversa:
        raise HTTPException(
            status_code=404,
            detail="Histórico do chatbotb não encontrado.",
        )

    return {
        "conversa": service.serializar_conversa(conversa),
        "mensagens": [
            service.serializar_mensagem(mensagem)
            for mensagem in conversa.mensagens
        ],
    }


@router.get("/{id_conversa}/txt")
def exportar_historico_conversa_txt(
    id_conversa: int,
    db: Session = Depends(get_db),
):
    conversa = (
        db.query(ChatbotBConversa)
        .filter(ChatbotBConversa.id == id_conversa)
        .first()
    )

    if not conversa:
        raise HTTPException(
            status_code=404,
            detail="Histórico do chatbotb não encontrado.",
        )

    conteudo = service.montar_txt_conversa(conversa)

    headers = {
        "Content-Disposition": f'attachment; filename="chatbotb_conversa_{id_conversa}.txt"'
    }

    return Response(
        content=conteudo,
        media_type="text/plain; charset=utf-8",
        headers=headers,
    )
