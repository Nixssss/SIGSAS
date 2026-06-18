import "../../styles/Auth.css"
import "./AuthMobileBase.css"

export function AuthLogoMobile() {
  return (
    <div className="auth-mobile-logo-mark" aria-hidden="true">
      <div className="auth-mobile-logo-hex">
        <div className="auth-mobile-logo-core">
          <div className="auth-mobile-logo-cube-top" />
          <div className="auth-mobile-logo-cube-front" />
        </div>
      </div>
    </div>
  )
}

export function AuthIconMobile({ tipo }) {
  const icones = {
    email: (
      <>
        <rect x="3.7" y="5.1" width="16.6" height="13.8" rx="2.7" />
        <path d="m4.9 7.2 7.1 5.5 7.1-5.5" />
      </>
    ),
    senha: (
      <>
        <rect x="5.4" y="10.2" width="13.2" height="9.4" rx="2.2" />
        <path d="M8.3 10.2V8.1a3.7 3.7 0 1 1 7.4 0v2.1" />
        <path d="M12 14v2" />
      </>
    ),
    usuario: (
      <>
        <circle cx="12" cy="8.2" r="3.4" />
        <path d="M5.4 20c.7-3.6 3.2-5.5 6.6-5.5s5.9 1.9 6.6 5.5" />
      </>
    ),
    cartao: (
      <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
        <path d="M3.5 10h17M7 14h3" />
      </>
    ),
    predio: (
      <>
        <rect x="5" y="3.8" width="14" height="16.4" rx="2" />
        <path d="M9 8h.01M12 8h.01M15 8h.01M9 12h.01M12 12h.01M15 12h.01M10 20.2v-3.7h4v3.7" />
      </>
    ),
    seta: (
      <>
        <path d="M5 12h13.5" />
        <path d="m14.2 6.8 5.1 5.2-5.1 5.2" />
      </>
    ),
    check: (
      <>
        <path d="m5.6 12.3 4 4 8.8-9.2" />
      </>
    ),
    alerta: (
      <>
        <path d="M12 4.1 20.3 19H3.7L12 4.1z" />
        <path d="M12 9.4v4.2M12 16.8h.01" />
      </>
    ),
    chave: (
      <>
        <circle cx="8.2" cy="15.8" r="3.1" />
        <path d="m10.5 13.5 8-8M15.1 5.5l3.3 3.3M13.2 7.4l3.3 3.3" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icones[tipo] || icones.usuario}
    </svg>
  )
}

export function AuthMobileShell({ eyebrow, title, text, children, footer = true }) {
  return (
    <div className="auth-mobile-page">
      <div className="auth-mobile-decoration auth-mobile-decoration-top" />
      <div className="auth-mobile-decoration auth-mobile-decoration-bottom" />

      <main className="auth-mobile-shell">
        <header className="auth-mobile-brand">
          <AuthLogoMobile />

          <div>
            <strong>SIGSAS</strong>
            <span>Gestão Inteligente de Salas</span>
          </div>
        </header>

        <section className="auth-mobile-intro">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{text}</p>
        </section>

        {children}

        {footer && <footer className="auth-mobile-footer">© 2026 SIGSAS</footer>}
      </main>
    </div>
  )
}

export function AuthMobileMessage({ tipo = "success", titulo, texto, acao }) {
  return (
    <section className={`auth-mobile-message-card ${tipo}`}>
      <span className="auth-mobile-message-icon">
        <AuthIconMobile tipo={tipo === "success" ? "check" : "alerta"} />
      </span>

      <div>
        <small>{tipo === "success" ? "SIGSAS" : "ATENÇÃO"}</small>
        <h2>{titulo}</h2>
        <p>{texto}</p>
        {acao}
      </div>
    </section>
  )
}
