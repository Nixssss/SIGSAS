import { useState } from "react"
import "../styles/Auth.css"
import { enviarRecuperacaoSenha } from "../services/emailServices"

function AuthLogo() {
  return (
    <div className="auth-logo-mark" aria-hidden="true">
      <div className="auth-logo-hex">
        <div className="auth-logo-core">
          <div className="auth-logo-cube-top" />
          <div className="auth-logo-cube-front" />
        </div>
      </div>
    </div>
  )
}

function EsqueciSenha({ irLogin }) {
  const [email, setEmail] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function recuperarSenha(e) {
    e.preventDefault()

    const emailLimpo = email.trim().toLowerCase()

    if (!emailLimpo) {
      setErro("Informe um email.")
      return
    }

    if (!emailValido(emailLimpo)) {
      setErro("Informe um email válido.")
      return
    }

    const token = crypto.randomUUID()

    const novoToken = {
      email: emailLimpo,
      token,
      criadoEm: new Date().toISOString(),
      usado: false,
      validadeHoras: 1,
    }

    try {
      setLoading(true)
      setErro("")

      await enviarRecuperacaoSenha(emailLimpo, token)

      const tokensSalvos =
        JSON.parse(localStorage.getItem("tokensRecuperacaoSenha")) || []

      localStorage.setItem(
        "tokensRecuperacaoSenha",
        JSON.stringify([novoToken, ...tokensSalvos])
      )

      setLoading(false)
      setSucesso(true)

      setTimeout(() => {
        irLogin()
      }, 2500)
    } catch (error) {
      console.error("Erro ao enviar recuperação:", error)
      setLoading(false)
      setErro("Erro ao enviar email de recuperação.")
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-left-panel">
          <div className="auth-brand-row">
            <AuthLogo />

            <div className="auth-brand-text">
              <h1>SIGSAS</h1>
              <span>Gestão Inteligente de Salas</span>
            </div>
          </div>

          <div className="auth-left-content">
            <span className="auth-kicker">Recuperação de acesso</span>

            <h2>Recupere sua senha com segurança.</h2>

            <p>
              Informe o e-mail cadastrado no SIGSAS para receber um link de
              redefinição de senha com token temporário.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <strong>Link com token</strong>
                <span>
                  O sistema gera um token único para validar sua recuperação.
                </span>
              </div>

              <div className="auth-feature-item">
                <strong>Validade limitada</strong>
                <span>
                  O link enviado por e-mail fica disponível por tempo limitado.
                </span>
              </div>

              <div className="auth-feature-item">
                <strong>Redefinição segura</strong>
                <span>
                  Depois de acessar o link, você poderá criar uma nova senha.
                </span>
              </div>
            </div>
          </div>

          <div className="auth-left-footer">© 2026 SIGSAS</div>
        </section>

        <section className="auth-right-panel">
          <div className="auth-card compact">
            <div className="auth-card-header">
              <div className="auth-logo-mark small" aria-hidden="true">
                <div className="auth-logo-hex">
                  <div className="auth-logo-core">
                    <div className="auth-logo-cube-top" />
                    <div className="auth-logo-cube-front" />
                  </div>
                </div>
              </div>

              <div>
                <span className="auth-form-label">Esqueci minha senha</span>
                <h3>Recuperar senha</h3>
                <p>Digite seu e-mail para receber o link de recuperação.</p>
              </div>
            </div>

            <form className="auth-form" onSubmit={recuperarSenha}>
              <div className="auth-field">
                <label>E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {erro && <div className="auth-error-box">{erro}</div>}

              <button
                type="submit"
                className="auth-main-button"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>

              <div className="auth-actions-links">
                <button
                  type="button"
                  className="auth-text-link"
                  onClick={irLogin}
                >
                  Voltar para login
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {sucesso && (
        <div className="auth-popup">
          <div className="auth-popup-box">
            <div className="auth-check">✔</div>
            <h3>Email enviado!</h3>
            <p>Verifique sua caixa de entrada para acessar o link com token.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default EsqueciSenha