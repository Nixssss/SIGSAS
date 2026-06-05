import os
from html import escape

import resend


def configurar_resend():
    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:
        raise RuntimeError(
            "RESEND_API_KEY não configurada. Configure no backend/.env e no Render."
        )

    resend.api_key = api_key


def obter_remetente():
    return os.getenv("RESEND_FROM_EMAIL", "SIGSAS <onboarding@resend.dev>")


def obter_frontend_url():
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return frontend_url.rstrip("/")


def enviar_email_resend(destinatario: str, assunto: str, html: str):
    configurar_resend()

    params: resend.Emails.SendParams = {
        "from": obter_remetente(),
        "to": [destinatario],
        "subject": assunto,
        "html": html,
    }

    return resend.Emails.send(params)


def layout_email(titulo: str, subtitulo: str, conteudo: str):
    return f"""
    <div style="font-family:Arial,sans-serif;background:#020617;padding:28px;color:#e5e7eb;">
      <div style="max-width:680px;margin:0 auto;background:#111827;border:1px solid #283243;border-radius:18px;padding:26px;">
        <div style="margin-bottom:22px;">
          <strong style="color:#f2a900;font-size:13px;letter-spacing:.08em;">SIGSAS</strong>
          <h1 style="margin:8px 0 6px;color:#ffffff;font-size:26px;">{escape(titulo)}</h1>
          <p style="margin:0;color:#cbd5e1;font-size:15px;">{escape(subtitulo)}</p>
        </div>

        {conteudo}

        <div style="margin-top:26px;border-top:1px solid #334155;padding-top:16px;color:#94a3b8;font-size:13px;">
          <p style="margin:0;">Este é um email automático do SIGSAS.</p>
        </div>
      </div>
    </div>
    """


def montar_bloco_reserva(
    nome_sala: str | None = None,
    solicitante: str | None = None,
    matricula: str | None = None,
    cargo: str | None = None,
    instituicao: str | None = None,
    curso: str | None = None,
    data_inicio: str | None = None,
    hora_inicio: str | None = None,
    data_fim: str | None = None,
    hora_fim: str | None = None,
    motivo: str | None = None,
    qtd_pessoas: int | None = None,
    status_reserva: str | None = None,
    justificativa: str | None = None,
):
    justificativa_html = ""

    if justificativa:
        justificativa_html = f"""
        <p style="margin:8px 0;">
          <strong style="color:#ffffff;">Justificativa:</strong>
          {escape(str(justificativa))}
        </p>
        """

    return f"""
    <div style="background:#0f172a;border:1px solid #f2a900;border-radius:14px;padding:18px;margin-top:16px;color:#e5e7eb;">
      <h3 style="margin:0 0 12px;color:#f2a900;">Dados da reserva</h3>

      <p style="margin:8px 0;"><strong style="color:#ffffff;">Sala:</strong> {escape(str(nome_sala or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Solicitante:</strong> {escape(str(solicitante or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Matrícula:</strong> {escape(str(matricula or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Cargo:</strong> {escape(str(cargo or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Instituição:</strong> {escape(str(instituicao or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Curso:</strong> {escape(str(curso or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Status:</strong> {escape(str(status_reserva or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Data:</strong> {escape(str(data_inicio or "Não informado"))} às {escape(str(hora_inicio or "Não informado"))} até {escape(str(data_fim or "Não informado"))} às {escape(str(hora_fim or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Motivo:</strong> {escape(str(motivo or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Pessoas:</strong> {escape(str(qtd_pessoas or "Não informado"))}</p>

      {justificativa_html}
    </div>
    """


def enviar_email_convite(
    email: str,
    token: str,
    link_cadastro: str | None = None,
):
    link = link_cadastro or f"{obter_frontend_url()}/cadastro?token={token}"

    conteudo = f"""
    <p style="color:#e5e7eb;">Você recebeu um convite para criar sua conta no SIGSAS.</p>

    <p style="color:#e5e7eb;">Clique no botão abaixo para finalizar seu cadastro:</p>

    <p style="margin:24px 0;">
      <a href="{escape(link)}"
         style="background:#f2a900;color:#020617;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;">
        Criar minha conta
      </a>
    </p>

    <p style="color:#cbd5e1;">Se o botão não funcionar, copie e cole este link no navegador:</p>
    <p style="word-break:break-all;color:#f2a900;">{escape(link)}</p>
    """

    html = layout_email(
        titulo="Convite de cadastro",
        subtitulo="Finalize seu cadastro para acessar o SIGSAS.",
        conteudo=conteudo,
    )

    return enviar_email_resend(
        destinatario=email,
        assunto="Convite de cadastro - SIGSAS",
        html=html,
    )


def enviar_email_recuperacao_senha(
    email: str,
    token: str,
):
    link = f"{obter_frontend_url()}/redefinir-senha?token={token}"

    conteudo = f"""
    <p style="color:#e5e7eb;">Recebemos uma solicitação para redefinir sua senha no SIGSAS.</p>

    <p style="color:#e5e7eb;">Clique no botão abaixo para criar uma nova senha:</p>

    <p style="margin:24px 0;">
      <a href="{escape(link)}"
         style="background:#f2a900;color:#020617;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;">
        Redefinir senha
      </a>
    </p>

    <p style="color:#cbd5e1;">Se você não solicitou essa alteração, ignore este email.</p>

    <p style="color:#cbd5e1;">Link direto:</p>
    <p style="word-break:break-all;color:#f2a900;">{escape(link)}</p>
    """

    html = layout_email(
        titulo="Recuperação de senha",
        subtitulo="Use o link abaixo para redefinir sua senha.",
        conteudo=conteudo,
    )

    return enviar_email_resend(
        destinatario=email,
        assunto="Recuperação de senha - SIGSAS",
        html=html,
    )


def enviar_email_reserva_criada(
    email: str,
    nome_sala: str | None = None,
    solicitante: str | None = None,
    matricula: str | None = None,
    cargo: str | None = None,
    instituicao: str | None = None,
    curso: str | None = None,
    data_inicio: str | None = None,
    hora_inicio: str | None = None,
    data_fim: str | None = None,
    hora_fim: str | None = None,
    motivo: str | None = None,
    qtd_pessoas: int | None = None,
):
    bloco = montar_bloco_reserva(
        nome_sala=nome_sala,
        solicitante=solicitante,
        matricula=matricula,
        cargo=cargo,
        instituicao=instituicao,
        curso=curso,
        data_inicio=data_inicio,
        hora_inicio=hora_inicio,
        data_fim=data_fim,
        hora_fim=hora_fim,
        motivo=motivo,
        qtd_pessoas=qtd_pessoas,
        status_reserva="Pendente",
    )

    conteudo = f"""
    <p style="color:#e5e7eb;">Sua reserva foi criada com sucesso e está aguardando análise.</p>
    <p style="color:#cbd5e1;">Você receberá um novo email quando ela for aprovada, recusada ou cancelada.</p>
    {bloco}
    """

    html = layout_email(
        titulo="Reserva criada",
        subtitulo="Sua solicitação de reserva foi registrada.",
        conteudo=conteudo,
    )

    return enviar_email_resend(
        destinatario=email,
        assunto="Reserva criada - SIGSAS",
        html=html,
    )


def enviar_email_reserva_aprovada(
    email: str,
    nome_sala: str | None = None,
    solicitante: str | None = None,
    matricula: str | None = None,
    cargo: str | None = None,
    instituicao: str | None = None,
    curso: str | None = None,
    data_inicio: str | None = None,
    hora_inicio: str | None = None,
    data_fim: str | None = None,
    hora_fim: str | None = None,
    motivo: str | None = None,
    qtd_pessoas: int | None = None,
    justificativa: str | None = None,
):
    bloco = montar_bloco_reserva(
        nome_sala=nome_sala,
        solicitante=solicitante,
        matricula=matricula,
        cargo=cargo,
        instituicao=instituicao,
        curso=curso,
        data_inicio=data_inicio,
        hora_inicio=hora_inicio,
        data_fim=data_fim,
        hora_fim=hora_fim,
        motivo=motivo,
        qtd_pessoas=qtd_pessoas,
        status_reserva="Aprovada",
        justificativa=justificativa,
    )

    conteudo = f"""
    <p style="color:#e5e7eb;">Boa notícia! Sua reserva foi aprovada.</p>
    {bloco}
    """

    html = layout_email(
        titulo="Reserva aprovada",
        subtitulo="Sua reserva foi confirmada no SIGSAS.",
        conteudo=conteudo,
    )

    return enviar_email_resend(
        destinatario=email,
        assunto="Reserva aprovada - SIGSAS",
        html=html,
    )


def enviar_email_reserva_cancelada(
    email: str,
    nome_sala: str | None = None,
    solicitante: str | None = None,
    matricula: str | None = None,
    cargo: str | None = None,
    instituicao: str | None = None,
    curso: str | None = None,
    data_inicio: str | None = None,
    hora_inicio: str | None = None,
    data_fim: str | None = None,
    hora_fim: str | None = None,
    motivo: str | None = None,
    qtd_pessoas: int | None = None,
    justificativa: str | None = None,
):
    bloco = montar_bloco_reserva(
        nome_sala=nome_sala,
        solicitante=solicitante,
        matricula=matricula,
        cargo=cargo,
        instituicao=instituicao,
        curso=curso,
        data_inicio=data_inicio,
        hora_inicio=hora_inicio,
        data_fim=data_fim,
        hora_fim=hora_fim,
        motivo=motivo,
        qtd_pessoas=qtd_pessoas,
        status_reserva="Cancelada/Recusada",
        justificativa=justificativa,
    )

    conteudo = f"""
    <p style="color:#e5e7eb;">Sua reserva foi cancelada ou recusada.</p>
    {bloco}
    """

    html = layout_email(
        titulo="Reserva cancelada",
        subtitulo="Houve uma alteração no status da sua reserva.",
        conteudo=conteudo,
    )

    return enviar_email_resend(
        destinatario=email,
        assunto="Reserva cancelada - SIGSAS",
        html=html,
    )