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


def obter_link_historico_reservas():
    return os.getenv(
        "FRONTEND_HISTORICO_RESERVAS_URL",
        f"{obter_frontend_url()}/dashboard?aba=reservas",
    )


def obter_template_reserva_pendente():
    return os.getenv("RESEND_TEMPLATE_RESERVA_PENDENTE", "reserva_pendente")


def obter_template_reserva_aprovada():
    return os.getenv("RESEND_TEMPLATE_RESERVA_APROVADA", "reserva_aprovada")


def obter_template_reserva_recusada():
    return os.getenv("RESEND_TEMPLATE_RESERVA_RECUSADA", "reserva_recusada")


def obter_template_reserva_cancelada():
    return os.getenv("RESEND_TEMPLATE_RESERVA_CANCELADA", "reserva_cancelada")


def enviar_email_resend(destinatario: str, assunto: str, html: str):
    configurar_resend()

    print(
        f"[SIGSAS EMAIL] Enviando HTML direto | para={destinatario} | assunto={assunto}",
        flush=True,
    )

    params: resend.Emails.SendParams = {
        "from": obter_remetente(),
        "to": [destinatario],
        "subject": assunto,
        "html": html,
    }

    resposta = resend.Emails.send(params)

    print(
        f"[SIGSAS EMAIL] HTML direto enviado com sucesso | resposta={resposta}",
        flush=True,
    )

    return resposta


def enviar_email_template_resend(
    destinatario: str,
    assunto: str,
    template_id: str,
    variaveis: dict,
):
    configurar_resend()

    print(
        f"[SIGSAS EMAIL] Enviando template | para={destinatario} | "
        f"assunto={assunto} | template={template_id} | "
        f"variaveis={list(variaveis.keys())}",
        flush=True,
    )

    params: resend.Emails.SendParams = {
        "from": obter_remetente(),
        "to": [destinatario],
        "subject": assunto,
        "template": {
            "id": template_id,
            "variables": variaveis,
        },
    }

    resposta = resend.Emails.send(params)

    print(
        f"[SIGSAS EMAIL] Template enviado com sucesso | template={template_id} | resposta={resposta}",
        flush=True,
    )

    return resposta


def layout_email(titulo: str, subtitulo: str, conteudo: str):
    return f"""
    <div style="font-family:Arial,sans-serif;background:#020617;padding:28px;color:#e5e7eb;">
      <div style="max-width:760px;margin:0 auto;background:#111827;border:1px solid #283243;border-radius:18px;padding:26px;">
        <div style="margin-bottom:22px;">
          <strong style="color:#f2a900;font-size:13px;letter-spacing:.08em;">SIGSAS</strong>
          <h1 style="margin:8px 0 6px;color:#ffffff;font-size:26px;">{escape(titulo)}</h1>
          <p style="margin:0;color:#cbd5e1;font-size:15px;">{escape(subtitulo)}</p>
        </div>

        {conteudo}

        <div style="margin-top:26px;border-top:1px solid #334155;padding-top:16px;color:#94a3b8;font-size:13px;">
          <p style="margin:0;">Este é um email automático do SIGSAS. Não responda esta mensagem.</p>
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
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Data inicial:</strong> {escape(str(data_inicio or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Horário inicial:</strong> {escape(str(hora_inicio or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Data final:</strong> {escape(str(data_fim or data_inicio or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Horário final:</strong> {escape(str(hora_fim or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Quantidade de pessoas:</strong> {escape(str(qtd_pessoas or "Não informado"))}</p>
      <p style="margin:8px 0;"><strong style="color:#ffffff;">Motivo:</strong> {escape(str(motivo or "Não informado"))}</p>

      {justificativa_html}
    </div>
    """


def montar_dados_reserva_texto(
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
    data_final = data_fim or data_inicio or "Não informado"

    return (
        f"Sala: {nome_sala or 'Não informado'}\n"
        f"Solicitante: {solicitante or 'Não informado'}\n"
        f"Matrícula: {matricula or 'Não informado'}\n"
        f"Cargo: {cargo or 'Não informado'}\n"
        f"Instituição: {instituicao or 'Não informado'}\n"
        f"Curso: {curso or 'Não informado'}\n"
        f"Data inicial: {data_inicio or 'Não informado'}\n"
        f"Horário inicial: {hora_inicio or 'Não informado'}\n"
        f"Data final: {data_final}\n"
        f"Horário final: {hora_fim or 'Não informado'}\n"
        f"Período: {data_inicio or 'Não informado'} das {hora_inicio or 'Não informado'} às {hora_fim or 'Não informado'}\n"
        f"Quantidade de pessoas: {qtd_pessoas or 'Não informado'}\n"
        f"Motivo: {motivo or 'Não informado'}"
    )


def montar_html_fallback_reserva(
    titulo: str,
    subtitulo: str,
    mensagem: str,
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
    link_historico = obter_link_historico_reservas()

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
        status_reserva=status_reserva,
        justificativa=justificativa,
    )

    conteudo = f"""
    <p style="color:#e5e7eb;margin:0 0 12px;">Olá, <strong style="color:#ffffff;">{escape(str(solicitante or "usuário"))}</strong>.</p>

    <p style="color:#e5e7eb;margin:0 0 18px;">{escape(mensagem)}</p>

    {bloco}

    <p style="margin:24px 0;">
      <a href="{escape(link_historico)}"
         style="background:#f2a900;color:#020617;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;">
        Acessar minhas reservas
      </a>
    </p>

    <p style="color:#cbd5e1;">Se o botão não funcionar, copie e cole este link no navegador:</p>
    <p style="word-break:break-all;color:#f2a900;">{escape(link_historico)}</p>
    """

    return layout_email(
        titulo=titulo,
        subtitulo=subtitulo,
        conteudo=conteudo,
    )


def enviar_template_com_fallback(
    destinatario: str,
    assunto: str,
    template_id: str,
    variaveis: dict,
    html_fallback: str,
):
    try:
        return enviar_email_template_resend(
            destinatario=destinatario,
            assunto=assunto,
            template_id=template_id,
            variaveis=variaveis,
        )
    except Exception as error:
        print(
            f"[SIGSAS EMAIL] ERRO AO ENVIAR TEMPLATE | template={template_id} | "
            f"para={destinatario} | erro={str(error)}",
            flush=True,
        )

        print(
            f"[SIGSAS EMAIL] Enviando fallback HTML para {destinatario}",
            flush=True,
        )

        return enviar_email_resend(
            destinatario=destinatario,
            assunto=assunto,
            html=html_fallback,
        )


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
    **kwargs,
):
    dados_reserva = montar_dados_reserva_texto(
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
    )

    html_fallback = montar_html_fallback_reserva(
        titulo="Solicitação de reserva registrada",
        subtitulo="Sua reserva foi registrada no SIGSAS.",
        mensagem=(
            "Sua solicitação de reserva foi registrada com sucesso no SIGSAS "
            "e está aguardando análise do coordenador."
        ),
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

    return enviar_template_com_fallback(
        destinatario=email,
        assunto="SIGSAS | Solicitação de reserva registrada",
        template_id=obter_template_reserva_pendente(),
        variaveis={
            "nome_usuario": solicitante or "usuário",
            "dados_reserva": dados_reserva,
            "link_historico": obter_link_historico_reservas(),
        },
        html_fallback=html_fallback,
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
    **kwargs,
):
    dados_reserva = montar_dados_reserva_texto(
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
    )

    html_fallback = montar_html_fallback_reserva(
        titulo="Reserva aprovada",
        subtitulo="Sua reserva foi aprovada no SIGSAS.",
        mensagem="Sua reserva foi aprovada pelo coordenador responsável.",
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

    return enviar_template_com_fallback(
        destinatario=email,
        assunto="SIGSAS | Reserva aprovada",
        template_id=obter_template_reserva_aprovada(),
        variaveis={
            "nome_usuario": solicitante or "usuário",
            "dados_reserva": dados_reserva,
            "link_historico": obter_link_historico_reservas(),
        },
        html_fallback=html_fallback,
    )


def enviar_email_reserva_recusada(
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
    **kwargs,
):
    motivo_recusa = justificativa or "Motivo não informado pelo coordenador."

    dados_reserva = montar_dados_reserva_texto(
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
    )

    html_fallback = montar_html_fallback_reserva(
        titulo="Reserva reprovada",
        subtitulo="Sua reserva foi reprovada no SIGSAS.",
        mensagem="Sua reserva foi reprovada pelo coordenador responsável.",
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
        status_reserva="Reprovada",
        justificativa=motivo_recusa,
    )

    return enviar_template_com_fallback(
        destinatario=email,
        assunto="SIGSAS | Reserva reprovada",
        template_id=obter_template_reserva_recusada(),
        variaveis={
            "nome_usuario": solicitante or "usuário",
            "dados_reserva": dados_reserva,
            "motivo_recusa": motivo_recusa,
            "link_historico": obter_link_historico_reservas(),
        },
        html_fallback=html_fallback,
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
    **kwargs,
):
    motivo_cancelamento = justificativa or "Cancelamento registrado no sistema."

    dados_reserva = montar_dados_reserva_texto(
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
    )

    html_fallback = montar_html_fallback_reserva(
        titulo="Reserva cancelada",
        subtitulo="Sua reserva foi cancelada no SIGSAS.",
        mensagem="Sua reserva foi cancelada no SIGSAS.",
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
        status_reserva="Cancelada",
        justificativa=motivo_cancelamento,
    )

    return enviar_template_com_fallback(
        destinatario=email,
        assunto="SIGSAS | Reserva cancelada",
        template_id=obter_template_reserva_cancelada(),
        variaveis={
            "nome_usuario": solicitante or "usuário",
            "dados_reserva": dados_reserva,
            "motivo_cancelamento": motivo_cancelamento,
            "link_historico": obter_link_historico_reservas(),
        },
        html_fallback=html_fallback,
    )