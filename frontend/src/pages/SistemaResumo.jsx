function SistemaIcon({ nome }) {
  const icones = {
    salas: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2.5" />
        <path d="M9 8h.01M12 8h.01M15 8h.01M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" />
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
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="sistema-svg-icon"
      aria-hidden="true"
    >
      {icones[nome]}
    </svg>
  )
}

function SistemaResumo() {
  const modulos = [
    {
      icone: "salas",
      titulo: "Gestão de Salas",
      texto:
        "Cadastro e controle de ambientes acadêmicos, com recursos, capacidade, campus, edifício e disponibilidade.",
    },
    {
      icone: "reservas",
      titulo: "Reservas Inteligentes",
      texto:
        "Solicitação, aprovação, cancelamento e acompanhamento de reservas com validação de conflitos.",
    },
    {
      icone: "chatbot",
      titulo: "Chatbot de Reserva",
      texto:
        "Assistente guiado que consulta dados da API a cada etapa para evitar escolhas inválidas.",
    },
    {
      icone: "problemas",
      titulo: "Reportes de Problemas",
      texto:
        "Usuários podem reportar falhas, inconsistências ou dificuldades diretamente pelo sistema.",
    },
    {
      icone: "sugestoes",
      titulo: "Sugestões de Melhorias",
      texto:
        "Canal para coleta de ideias dos usuários e evolução contínua do SIGSAS.",
    },
    {
      icone: "auditoria",
      titulo: "Auditoria e Logs",
      texto:
        "Registro de ações, erros, abandonos, IP, usuário, data, hora, módulo e etapa executada.",
    },
  ]

  const tecnologias = [
    "React",
    "Vite",
    "FastAPI",
    "Python",
    "SQLAlchemy",
    "PostgreSQL",
    "Supabase",
    "JWT",
    "Axios",
    "Resend",
    "Netlify",
    "Render",
  ]

  const diferenciais = [
    "Modo claro e escuro",
    "Dashboard com indicadores em tempo real",
    "Chatbot com fluxo guiado",
    "Busca global no sistema",
    "Notificações administrativas",
    "Auditoria com painel visual",
    "Exportação de logs",
    "Gestão completa de usuários",
    "Design responsivo",
    "Interface moderna para apresentação acadêmica",
  ]

  const fluxo = [
    {
      etapa: "01",
      titulo: "Usuário acessa o sistema",
      texto: "O usuário realiza login e entra no painel do SIGSAS.",
    },
    {
      etapa: "02",
      titulo: "Escolhe uma ação",
      texto:
        "Pode reservar uma sala, consultar reservas, usar o chatbot ou enviar feedback.",
    },
    {
      etapa: "03",
      titulo: "Sistema valida os dados",
      texto:
        "A API verifica salas, datas, horários, disponibilidade, campus e capacidade.",
    },
    {
      etapa: "04",
      titulo: "Reserva é registrada",
      texto:
        "A solicitação fica pendente, aprovada, cancelada ou recusada conforme o fluxo.",
    },
    {
      etapa: "05",
      titulo: "Auditoria registra tudo",
      texto:
        "Cada ação importante gera logs para rastreabilidade e análise administrativa.",
    },
  ]

  return (
    <div className="sistema-resumo-page">
      <section className="sistema-hero">
        <div className="sistema-hero-glow sistema-hero-glow-one" />
        <div className="sistema-hero-glow sistema-hero-glow-two" />

        <div className="sistema-hero-content">
          <span>Visão geral do projeto</span>
          <h1>SIGSAS</h1>
          <p>
            Sistema Inteligente de Gerenciamento de Salas desenvolvido para
            instituições acadêmicas, com foco em organização, automação,
            auditoria e experiência moderna para usuários e administradores.
          </p>
        </div>

        <div className="sistema-hero-card">
          <div className="sistema-hero-card-icon">
            <SistemaIcon nome="tcc" />
          </div>

          <div>
            <strong>TCC</strong>
            <span>Projeto acadêmico</span>
            <small>Gestão inteligente de ambientes institucionais</small>
          </div>
        </div>
      </section>

      <section className="sistema-objective-card">
        <div className="sistema-objective-icon">
          <SistemaIcon nome="objetivo" />
        </div>

        <div>
          <span>Objetivo principal</span>
          <h2>Modernizar o controle de reservas de salas acadêmicas</h2>
          <p>
            O SIGSAS centraliza o cadastro de ambientes, usuários, reservas,
            logs, reportes e sugestões, reduzindo processos manuais e
            aumentando a rastreabilidade das ações feitas dentro do sistema.
          </p>
        </div>
      </section>

      <section className="sistema-section">
        <div className="sistema-section-title">
          <div>
            <span>Módulos</span>
            <h2>Principais funcionalidades</h2>
          </div>
        </div>

        <div className="sistema-modulos-grid">
          {modulos.map((modulo, index) => (
            <div
              key={modulo.titulo}
              className="sistema-modulo-card"
              style={{ "--delay": `${index * 0.06}s` }}
            >
              <div className="sistema-modulo-icon">
                <SistemaIcon nome={modulo.icone} />
              </div>

              <div>
                <h3>{modulo.titulo}</h3>
                <p>{modulo.texto}</p>
              </div>

              <span className="sistema-card-arrow">›</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sistema-section sistema-dupla-grid">
        <div className="sistema-panel">
          <div className="sistema-section-title compact">
            <div className="sistema-title-icon">
              <SistemaIcon nome="tecnologia" />
            </div>

            <div>
              <span>Tecnologias</span>
              <h2>Stack utilizada</h2>
            </div>
          </div>

          <div className="sistema-tech-list">
            {tecnologias.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
        </div>

        <div className="sistema-panel">
          <div className="sistema-section-title compact">
            <div className="sistema-title-icon">
              <SistemaIcon nome="diferenciais" />
            </div>

            <div>
              <span>Diferenciais</span>
              <h2>Recursos de destaque</h2>
            </div>
          </div>

          <div className="sistema-diferenciais-list">
            {diferenciais.map((item) => (
              <div key={item}>
                <span>✓</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sistema-section">
        <div className="sistema-section-title">
          <div>
            <span>Fluxo</span>
            <h2>Como o sistema funciona</h2>
          </div>
        </div>

        <div className="sistema-fluxo">
          {fluxo.map((item) => (
            <div key={item.etapa} className="sistema-fluxo-item">
              <strong>{item.etapa}</strong>

              <div>
                <h3>{item.titulo}</h3>
                <p>{item.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sistema-status-grid">
        <div className="sistema-status-card completo">
          <span>Concluído</span>
          <strong>Base do sistema</strong>
          <p>Login, dashboard, salas, reservas, usuários e administração.</p>
        </div>

        <div className="sistema-status-card completo">
          <span>Concluído</span>
          <strong>Chatbot</strong>
          <p>Fluxo de reserva com data, campus, turno, tipo, pessoas e sala.</p>
        </div>

        <div className="sistema-status-card completo">
          <span>Concluído</span>
          <strong>Auditoria</strong>
          <p>Logs, filtros, detalhes, exportação e painel visual.</p>
        </div>

        <div className="sistema-status-card evolucao">
          <span>Evolução</span>
          <strong>Polimento final</strong>
          <p>Ajustes visuais, validações finais e preparação para apresentação.</p>
        </div>
      </section>
    </div>
  )
}

export default SistemaResumo
