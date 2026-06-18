function SistemaIcon({ nome }) {
  const icones = {
    salas: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2.5" />
        <path d="M9 8h.01M12 8h.01M15 8h.01M9 12h.01M12 12h.01M15 12h.01" />
      </>
    ),
    reservas: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16" />
        <path d="M13.2 14.2h3.2v3.2" />
        <path d="M16.4 14.2l-4.2 4.2" />
      </>
    ),
    chatbot: (
      <>
        <path d="M5 7.5C5 5.6 6.6 4 8.5 4h7C17.4 4 19 5.6 19 7.5v4C19 13.4 17.4 15 15.5 15H11l-4.2 3.4c-.7.5-1.8 0-1.8-.9v-10Z" />
        <path d="M9 9.5h.01M12 9.5h.01M15 9.5h.01" />
      </>
    ),
    problemas: (
      <>
        <path d="M12 4.2 21 19H3L12 4.2Z" />
        <path d="M12 9v4M12 16.5h.01" />
      </>
    ),
    sugestoes: (
      <>
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M8.5 14.5c-1.2-1-2-2.5-2-4.2A5.5 5.5 0 0 1 12 4.8a5.5 5.5 0 0 1 5.5 5.5c0 1.7-.8 3.2-2 4.2-.8.7-1.1 1.3-1.2 2.1H9.7c-.1-.8-.4-1.4-1.2-2.1Z" />
      </>
    ),
    auditoria: (
      <>
        <path d="M7 3.5h7l3 3V20.5H7V3.5Z" />
        <path d="M14 3.5v4h4" />
        <path d="M9.5 11h5M9.5 14h5M9.5 17h3" />
      </>
    ),
    tcc: (
      <>
        <path d="M12 3 4.5 7.2 12 11.4l7.5-4.2L12 3Z" />
        <path d="M4.5 11.2 12 15.4l7.5-4.2" />
        <path d="M4.5 15.2 12 19.4l7.5-4.2" />
      </>
    ),
    objetivo: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 12 18.5 5.5" />
        <path d="M16.5 5.5h2v2" />
      </>
    ),
    tecnologia: (
      <>
        <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M12 12 20 7.5M12 12v9M12 12 4 7.5" />
      </>
    ),
    diferenciais: (
      <>
        <path d="m12 3 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3Z" />
      </>
    ),
    seguranca: (
      <>
        <path d="M12 3.5 19 6v5.5c0 4.2-2.8 7.5-7 9-4.2-1.5-7-4.8-7-9V6l7-2.5Z" />
        <path d="m8.7 12 2.1 2.1 4.6-4.8" />
      </>
    ),
    banco: (
      <>
        <ellipse cx="12" cy="5.5" rx="7" ry="2.8" />
        <path d="M5 5.5v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" />
        <path d="M5 11.5v6C5 19 8.1 20.2 12 20.2s7-1.2 7-2.7v-6" />
      </>
    ),
    entrega: (
      <>
        <path d="m4 12 7-7 3 3 6-6" />
        <path d="M15 2h5v5" />
        <path d="M5 18h14" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="sistema-svg-icon"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icones[nome] || icones.tcc}
    </svg>
  )
}

const dadosSistemaResumo = {
  modulos: [
    {
      icone: "salas",
      titulo: "Estrutura Institucional e Salas",
      texto:
        "Cadastro de instituições, campi, edifícios, tipos de sala, recursos e ambientes com capacidade, metragem, andar e disponibilidade.",
    },
    {
      icone: "reservas",
      titulo: "Reservas com Validações",
      texto:
        "Solicitação manual ou guiada, verificação de sobreposição, capacidade, status, histórico e cancelamento pelo solicitante.",
    },
    {
      icone: "chatbot",
      titulo: "Chatbot de Reserva",
      texto:
        "Fluxo conversacional conectado à API para selecionar instituição, data letiva, campus, horário, tipo, capacidade e sala.",
    },
    {
      icone: "seguranca",
      titulo: "Acesso e Segurança",
      texto:
        "Autenticação por JWT, controle de perfis, cadastro por convite, recuperação de senha e armazenamento local da sessão do usuário.",
    },
    {
      icone: "auditoria",
      titulo: "Administração e Auditoria",
      texto:
        "Painel administrativo, gestão de usuários, aprovação de reservas, logs, filtros, detalhes de ações e histórico administrativo do chatbot.",
    },
    {
      icone: "problemas",
      titulo: "Feedback e Comunicação",
      texto:
        "Reportes de problemas, sugestões de melhorias e avisos por e-mail para reservas, convites e recuperação de senha.",
    },
  ],

  tecnologiaGrupos: [
    {
      titulo: "Frontend",
      itens: ["React", "Vite", "CSS responsivo", "Axios", "LocalStorage"],
    },
    {
      titulo: "Backend",
      itens: ["Python", "FastAPI", "Uvicorn", "SQLAlchemy"],
    },
    {
      titulo: "Dados e segurança",
      itens: ["PostgreSQL", "Supabase", "JWT", "Validações de regra de negócio"],
    },
    {
      titulo: "Serviços e entrega",
      itens: ["Resend", "Netlify", "Render", "Git", "GitHub"],
    },
  ],

  entidades: [
    "Usuário",
    "Convite",
    "Instituição",
    "Campus",
    "Edifício",
    "Tipo de sala",
    "Recurso",
    "Sala",
    "Reserva",
    "Auditoria",
    "Reporte",
    "Sugestão",
  ],

  diferenciais: [
    "Tema claro e escuro com interface responsiva",
    "Dashboard com indicadores e notificações administrativas",
    "Reserva manual e reserva guiada por chatbot",
    "Validação de conflitos de horários e capacidade da sala",
    "Período letivo aplicado aos calendários de reserva",
    "E-mails de pendência, aprovação, recusa e cancelamento",
    "Gestão por perfis: administrador e usuário",
    "Auditoria de operações e rastreabilidade",
    "Feedback de problemas e sugestões integrado ao painel administrativo",
    "Histórico administrativo das conversas do chatbot",
  ],

  fluxo: [
    {
      etapa: "01",
      titulo: "Acesso autenticado",
      texto:
        "O usuário entra com credenciais protegidas por JWT ou conclui o cadastro por convite.",
    },
    {
      etapa: "02",
      titulo: "Consulta de dados reais",
      texto:
        "A interface consulta a API para carregar instituições, salas, reservas, recursos e permissões.",
    },
    {
      etapa: "03",
      titulo: "Solicitação de reserva",
      texto:
        "O pedido pode ser feito em Salas, em Reservas ou pelo chatbot guiado.",
    },
    {
      etapa: "04",
      titulo: "Validação e registro",
      texto:
        "O backend verifica conflito de datas e horários, capacidade, disponibilidade e regras do fluxo.",
    },
    {
      etapa: "05",
      titulo: "Acompanhamento e comunicação",
      texto:
        "A reserva é acompanhada pelo usuário, administrada pelo painel e comunicada por e-mail quando necessário.",
    },
    {
      etapa: "06",
      titulo: "Rastreabilidade contínua",
      texto:
        "Ações relevantes ficam disponíveis na auditoria, enquanto reportes e sugestões apoiam a evolução do sistema.",
    },
  ],

  status: [
    {
      tipo: "Implementado",
      titulo: "Núcleo institucional",
      texto:
        "Autenticação, usuários, convites, instituições, campi, edifícios, salas, tipos e recursos.",
      classe: "completo",
    },
    {
      tipo: "Implementado",
      titulo: "Reservas e chatbot",
      texto:
        "Reserva manual, reserva guiada, validações de conflito, calendário letivo e acompanhamento por status.",
      classe: "completo",
    },
    {
      tipo: "Implementado",
      titulo: "Administração e comunicação",
      texto:
        "Dashboard, aprovações, auditoria, feedback e e-mails transacionais com Resend.",
      classe: "completo",
    },
    {
      tipo: "Em refinamento",
      titulo: "Experiência responsiva",
      texto:
        "Ajustes finais de interface mobile, consistência visual e preparação para apresentação acadêmica.",
      classe: "evolucao",
    },
  ],
}

export { SistemaIcon, dadosSistemaResumo }
