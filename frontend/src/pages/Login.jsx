import { useState } from "react"
import { login } from "../services/authService"
import { jwtDecode } from "jwt-decode"
import "../styles/Auth.css"

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

function Login({ irCadastro, irEsqueci, irDashboard }) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function fazerLogin(e) {
    e.preventDefault()
    setErro("")

    try {
      setCarregando(true)

      const response = await login({
        email: email.trim().toLowerCase(),
        senha,
      })

      const token = response.access_token
      const decoded = jwtDecode(token)

      localStorage.setItem("token", token)
      localStorage.setItem("perfil", decoded.perfil || "usuario")

      localStorage.setItem(
        "logado",
        JSON.stringify({
          id: decoded.id || Number(decoded.sub),
          idUsuario: decoded.idUsuario || decoded.id || Number(decoded.sub),
          nome: decoded.nome || decoded.email || email,
          email: decoded.email || email,
          matricula: decoded.matricula || "Não informada",
          cargo: decoded.cargo || decoded.perfil || "Não informado",
          idInstituicao: decoded.idInstituicao || null,
          instituicao: decoded.instituicao || "Não informada",
          perfil: decoded.perfil || "usuario",
        })
      )

      irDashboard()
    } catch (error) {
      setErro(error.response?.data?.detail || "Erro ao fazer login")
    } finally {
      setCarregando(false)
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
            <span className="auth-kicker">Plataforma acadêmica</span>

            <h2>
              Controle de ambientes com organização, inteligência e segurança.
            </h2>

            <p>
              Centralize reservas, administração de salas, gestão de campi,
              edifícios e acompanhamento de solicitações em um único sistema.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <strong>Reservas centralizadas</strong>
                <span>
                  Controle completo de solicitações e disponibilidade.
                </span>
              </div>

              <div className="auth-feature-item">
                <strong>Administração unificada</strong>
                <span>
                  Instituições, campi, edifícios e salas em um só lugar.
                </span>
              </div>

              <div className="auth-feature-item">
                <strong>Fluxo inteligente</strong>
                <span>
                  Automação com chatbot e organização acadêmica moderna.
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
                <span className="auth-form-label">Acesso ao sistema</span>
                <h3>Entrar</h3>
                <p>Informe suas credenciais para acessar o SIGSAS.</p>
              </div>
            </div>

            <form className="auth-form" onSubmit={fazerLogin}>
              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label>Senha</label>
                <input
                  type="password"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              {erro && <div className="auth-error-box">{erro}</div>}

              <button
                type="submit"
                className="auth-main-button"
                disabled={carregando}
              >
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <div className="auth-actions-links">
              <button
                type="button"
                className="auth-text-link"
                onClick={irEsqueci}
              >
                Esqueci senha
              </button>

              <button
                type="button"
                className="auth-text-link"
                onClick={irCadastro}
              >
                Não tem conta? Cadastre-se
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login