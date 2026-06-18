import { SistemaIcon, dadosSistemaResumo } from "./SistemaResumoDados"
import "./SistemaResumoMobile.css"

function SistemaResumoMobile() {
  const {
    modulos,
    tecnologiaGrupos,
    entidades,
    diferenciais,
    fluxo,
    status,
  } = dadosSistemaResumo

  return (
    <div className="sistema-mobile-page">
      <section className="sistema-mobile-hero">
        <div className="sistema-mobile-hero-decoration" aria-hidden="true">
          <span />
          <i />
        </div>

        <span className="sistema-mobile-hero-icon" aria-hidden="true">
          <SistemaIcon nome="tcc" />
        </span>

        <div>
          <span>VISÃO GERAL DO TCC</span>
          <h1>SIGSAS completo.</h1>
          <p>
            Gestão inteligente de salas acadêmicas, reservas, usuários,
            auditoria e comunicação institucional.
          </p>
        </div>
      </section>

      <section className="sistema-mobile-objective-card">
        <span>
          <SistemaIcon nome="objetivo" />
        </span>

        <div>
          <small>OBJETIVO PRINCIPAL</small>
          <h2>Centralizar o controle de ambientes e reservas acadêmicas.</h2>
          <p>
            O projeto reduz tarefas manuais e aumenta a organização,
            visibilidade e rastreabilidade dos processos.
          </p>
        </div>
      </section>

      <section className="sistema-mobile-section">
        <header className="sistema-mobile-section-header">
          <div>
            <span>ESCOPO FUNCIONAL</span>
            <h2>O que o sistema entrega</h2>
          </div>

          <span className="sistema-mobile-section-count">{modulos.length}</span>
        </header>

        <div className="sistema-mobile-module-list">
          {modulos.map((modulo, index) => (
            <article
              key={modulo.titulo}
              className="sistema-mobile-module-card"
              style={{ "--delay": `${index * 0.05}s` }}
            >
              <span className="sistema-mobile-module-icon">
                <SistemaIcon nome={modulo.icone} />
              </span>

              <div>
                <h3>{modulo.titulo}</h3>
                <p>{modulo.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sistema-mobile-section">
        <header className="sistema-mobile-section-header">
          <div>
            <span>ARQUITETURA</span>
            <h2>Tecnologias utilizadas</h2>
          </div>

          <span className="sistema-mobile-section-icon">
            <SistemaIcon nome="tecnologia" />
          </span>
        </header>

        <div className="sistema-mobile-stack-list">
          {tecnologiaGrupos.map((grupo) => (
            <details key={grupo.titulo} className="sistema-mobile-stack-group">
              <summary>
                <strong>{grupo.titulo}</strong>
                <span>{grupo.itens.length} itens</span>
              </summary>

              <div>
                {grupo.itens.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="sistema-mobile-section">
        <header className="sistema-mobile-section-header">
          <div>
            <span>DADOS E SEGURANÇA</span>
            <h2>Base do sistema</h2>
          </div>

          <span className="sistema-mobile-section-icon">
            <SistemaIcon nome="banco" />
          </span>
        </header>

        <div className="sistema-mobile-entity-chips">
          {entidades.map((entidade) => (
            <span key={entidade}>{entidade}</span>
          ))}
        </div>

        <div className="sistema-mobile-note">
          <span>
            <SistemaIcon nome="seguranca" />
          </span>
          <p>
            Dados persistidos em PostgreSQL no Supabase, acesso autenticado
            por JWT e validações de negócio executadas no backend FastAPI.
          </p>
        </div>
      </section>

      <section className="sistema-mobile-section">
        <header className="sistema-mobile-section-header">
          <div>
            <span>DIFERENCIAIS</span>
            <h2>Recursos que destacam o projeto</h2>
          </div>

          <span className="sistema-mobile-section-icon">
            <SistemaIcon nome="diferenciais" />
          </span>
        </header>

        <div className="sistema-mobile-differentials">
          {diferenciais.map((item) => (
            <div key={item}>
              <span>✓</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sistema-mobile-section">
        <header className="sistema-mobile-section-header">
          <div>
            <span>FLUXO INTEGRADO</span>
            <h2>Da solicitação ao acompanhamento</h2>
          </div>

          <span className="sistema-mobile-section-count">{fluxo.length}</span>
        </header>

        <div className="sistema-mobile-flow">
          {fluxo.map((item) => (
            <article key={item.etapa}>
              <span>{item.etapa}</span>

              <div>
                <h3>{item.titulo}</h3>
                <p>{item.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sistema-mobile-status-list">
        {status.map((item) => (
          <article
            key={item.titulo}
            className={`sistema-mobile-status-card ${item.classe}`}
          >
            <span>{item.tipo}</span>
            <h3>{item.titulo}</h3>
            <p>{item.texto}</p>
          </article>
        ))}
      </section>

      <section className="sistema-mobile-delivery-card">
        <span>
          <SistemaIcon nome="entrega" />
        </span>

        <div>
          <strong>Projeto preparado para apresentação</strong>
          <p>
            Frontend no Netlify, API no Render, banco no Supabase e e-mails
            transacionais no Resend.
          </p>
        </div>
      </section>
    </div>
  )
}

export default SistemaResumoMobile
