from fastapi import Request
from sqlalchemy.orm import Session

from app.models.auditoria import Auditoria
from app.models.usuario import Usuario


def obter_ip_request(request: Request | None = None):
    if not request:
        return None

    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")

    if real_ip:
        return real_ip.strip()

    if request.client:
        return request.client.host

    return None


def registrar_log(
    db: Session,
    acao: str,
    modulo: str,
    descricao: str,
    status: str = "sucesso",
    erro: str | None = None,
    id_usuario: int | None = None,
    nome_usuario: str | None = None,
    email_usuario: str | None = None,
    ip_maquina: str | None = None,
    session_id: str | None = None,
    etapa: str | None = None,
    request: Request | None = None,
):
    try:
        usuario = None

        if id_usuario:
            usuario = db.query(Usuario).filter(Usuario.id == id_usuario).first()

        ip_final = ip_maquina or obter_ip_request(request)

        novo_log = Auditoria(
            idUsuario=usuario.id if usuario else id_usuario,
            nomeUsuario=usuario.nome if usuario else nome_usuario,
            emailUsuario=usuario.email if usuario else email_usuario,
            ipMaquina=ip_final,
            sessionId=session_id,
            acao=acao,
            modulo=modulo,
            etapa=etapa,
            descricao=descricao,
            status=status,
            erro=erro,
        )

        db.add(novo_log)
        db.commit()
        db.refresh(novo_log)

        return novo_log

    except Exception as error:
        db.rollback()
        print("Erro ao registrar auditoria:", str(error))
        return None