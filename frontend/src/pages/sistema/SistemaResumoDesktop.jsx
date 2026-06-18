import { SistemaIcon, dadosSistemaResumo } from "./SistemaResumoDados"

function SistemaResumoDesktop() {
  const {
    modulos,
    tecnologiaGrupos,
    entidades,
    diferenciais,
    fluxo,
    status,
  } = dadosSistemaResumo

  return (
    <div className="sistema-resumo-page">
      <section className="sistema-hero">
        <div className="sistema-hero-glow sistema-hero-glow-one" />
        <div className="sistema-hero-glow sistema-hero-glow-two" />

        <div className="sistema-hero-content">
          <span>Visão geral do trabalho acadêmico</span>
          <h1>SIGSAS</h1>
          <p>
            Sistema Inteligente de Gerenciamento de Salas Acadêmicas criado
            para centralizar ambientes institucionais, reservas, usuários,
            auditoria, comunicação e experiência digital em uma única
            plataforma.
          </p>
        </div>

        <div className="sistema-hero-card">
          <div className="sistema-hero-card-icon">
            <SistemaIcon nome="tcc" />
          </div>

          <div>
            <strong>TCC</strong>
            <span>Projeto acadêmico aplicado</span>
            <small>
              Gestão inteligente de ambientes, reservas e processos
              institucionais.
            </small>
          </div>
        </div>
      </section>

      <section className="sistema-objective-card">
        <div className="sistema-objective-icon">
          <SistemaIcon nome="objetivo" />
        </div>

        <div>
          <span>Objetivo principal</span>
          <h2>Modernizar a gestão de salas e reservas acadêmicas</h2>
          <p>
            O SIGSAS reduz processos manuais ao organizar a estrutura
            institucional, controlar disponibilidade de ambientes, registrar
            reservas, orientar usuários pelo chatbot, disponibilizar
            administração centralizada e manter rastreabilidade das ações.
          </p>
        </div>
      </section>

      <section className="sistema-section">
        <div className="sistema-section-title">
          <div>
            <span>Escopo funcional</span>
            <h2>O que foi desenvolvido no SIGSAS</h2>
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
              <span>Arquitetura</span>
              <h2>Tecnologias utilizadas</h2>
            </div>
          </div>

          <div className="sistema-tech-groups">
            {tecnologiaGrupos.map((grupo) => (
              <div key={grupo.titulo} className="sistema-tech-group">
                <strong>{grupo.titulo}</strong>

                <div className="sistema-tech-list">
                  {grupo.itens.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sistema-panel">
          <div className="sistema-section-title compact">
            <div className="sistema-title-icon">
              <SistemaIcon nome="banco" />
            </div>

            <div>
              <span>Modelo de dados</span>
              <h2>Entidades integradas</h2>
            </div>
          </div>

          <div className="sistema-tech-list">
            {entidades.map((entidade) => (
              <span key={entidade}>{entidade}</span>
            ))}
          </div>

          <div className="sistema-diferenciais-list">
            <div>
              <span>✓</span>
              <p>
                Estrutura relacional voltada ao vínculo entre instituições,
                campi, edifícios, salas, recursos, usuários e reservas.
              </p>
            </div>

            <div>
              <span>✓</span>
              <p>
                Dados persistidos em PostgreSQL com conexão hospedada no
                Supabase.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sistema-section sistema-dupla-grid">
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

        <div className="sistema-panel">
          <div className="sistema-section-title compact">
            <div className="sistema-title-icon">
              <SistemaIcon nome="entrega" />
            </div>

            <div>
              <span>Publicação</span>
              <h2>Infraestrutura do projeto</h2>
            </div>
          </div>

          <div className="sistema-diferenciais-list">
            <div>
              <span>✓</span>
              <p>
                Frontend React/Vite publicado no Netlify para acesso pelo
                navegador.
              </p>
            </div>

            <div>
              <span>✓</span>
              <p>
                API FastAPI executada no Render e conectada ao banco PostgreSQL
                no Supabase.
              </p>
            </div>

            <div>
              <span>✓</span>
              <p>
                E-mails transacionais enviados pelo Resend para reservas,
                convites e recuperação de senha.
              </p>
            </div>

            <div>
              <span>✓</span>
              <p>
                Versionamento e evolução do código realizados com Git e GitHub.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sistema-section">
        <div className="sistema-section-title">
          <div>
            <span>Fluxo integrado</span>
            <h2>Como o SIGSAS funciona na prática</h2>
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
        {status.map((item) => (
          <div
            key={item.titulo}
            className={`sistema-status-card ${item.classe}`}
          >
            <span>{item.tipo}</span>
            <strong>{item.titulo}</strong>
            <p>{item.texto}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

export default SistemaResumoDesktop
