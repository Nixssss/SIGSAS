function SistemaResumo() {
  const modulos = [
    {
      icone: "▦",
      titulo: "Gestão de Salas",
      texto:
        "Cadastro e controle de ambientes acadêmicos, com recursos, capacidade, campus, edifício e disponibilidade.",
    },
    {
      icone: "◷",
      titulo: "Reservas Inteligentes",
      texto:
        "Solicitação, aprovação, cancelamento e acompanhamento de reservas com validação de conflitos.",
    },
    {
      icone: "☻",
      titulo: "Chatbot de Reserva",
      texto:
        "Assistente guiado que consulta dados da API a cada etapa para evitar escolhas inválidas.",
    },
    {
      icone: "⚠",
      titulo: "Reportes de Problemas",
      texto:
        "Usuários podem reportar falhas, inconsistências ou dificuldades diretamente pelo sistema.",
    },
    {
      icone: "◇",
      titulo: "Sugestões de Melhorias",
      texto:
        "Canal para coleta de ideias dos usuários e evolução contínua do SIGSAS.",
    },
    {
      icone: "◎",
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
    "SQLite",
    "JWT",
    "Axios",
    "CSS Moderno",
    "API REST",
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
        <div>
          <span>Visão Geral do Projeto</span>
          <h1>SIGSAS</h1>
          <p>
            Sistema Inteligente de Gerenciamento de Salas desenvolvido para
            instituições acadêmicas, com foco em organização, automação,
            auditoria e experiência moderna para usuários e administradores.
          </p>
        </div>

        <div className="sistema-hero-card">
          <strong>TCC</strong>
          <span>Projeto acadêmico</span>
          <small>Gestão inteligente de ambientes institucionais</small>
        </div>
      </section>

      <section className="sistema-objective-card">
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
          {modulos.map((modulo) => (
            <div key={modulo.titulo} className="sistema-modulo-card">
              <div className="sistema-modulo-icon">{modulo.icone}</div>
              <h3>{modulo.titulo}</h3>
              <p>{modulo.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sistema-section sistema-dupla-grid">
        <div className="sistema-panel">
          <div className="sistema-section-title compact">
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