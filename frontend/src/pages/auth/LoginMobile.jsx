import { useState } from "react"
import { login } from "../../services/authService"
import { jwtDecode } from "jwt-decode"
import "../../styles/Auth.css"
import "./LoginMobile.css"

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

function IconeLoginMobile({ tipo }) {
  const desenhos = {
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
      {desenhos[tipo] || desenhos.email}
    </svg>
  )
}

function LoginMobile({ irCadastro, irEsqueci, irDashboard }) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function fazerLogin(evento) {
    evento.preventDefault()
    setErro("")

    try {
      setCarregando(true)

      const response = await login({
        email: email.trim().toLowerCase(),
        senha,
      })

      const token = response.access_token
      const decoded = jwtDecode(token)

      const perfil = decoded.perfil || "Professor"
      const cursos = Array.isArray(decoded.cursos) ? decoded.cursos : []

      localStorage.setItem("token", token)
      localStorage.setItem("perfil", perfil)

      localStorage.setItem(
        "logado",
        JSON.stringify({
          id: decoded.id || Number(decoded.sub),
          idUsuario: decoded.idUsuario || decoded.id || Number(decoded.sub),
          nome: decoded.nome || decoded.email || email,
          email: decoded.email || email,
          matricula: decoded.matricula || "Não informada",
          cargo: decoded.cargo || perfil || "Não informado",
          idInstituicao: decoded.idInstituicao || null,
          instituicao: decoded.instituicao || "Não informada",
          perfil,
          cursos,
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
    <div className="login-mobile-page">
      <div className="login-mobile-decoration login-mobile-decoration-top" />
      <div className="login-mobile-decoration login-mobile-decoration-bottom" />

      <main className="login-mobile-shell">
        <header className="login-mobile-brand">
          <AuthLogo />

          <div>
            <strong>SIGSAS</strong>
            <span>Gestão Inteligente de Salas</span>
          </div>
        </header>

        <section className="login-mobile-intro">
          <span>PLATAFORMA ACADÊMICA</span>
          <h1>Olá, seja bem-vindo.</h1>
          <p>
            Entre para consultar ambientes, reservar salas e acompanhar suas
            solicitações.
          </p>
        </section>

        <section className="login-mobile-card">
          <header className="login-mobile-card-header">
            <div>
              <span>ACESSO AO SISTEMA</span>
              <h2>Entrar na sua conta</h2>
            </div>

            <span className="login-mobile-card-step">01</span>
          </header>

          <form className="login-mobile-form" onSubmit={fazerLogin}>
            <label className="login-mobile-field">
              <span>Email</span>

              <div>
                <IconeLoginMobile tipo="email" />
                <input
                  type="email"
                  placeholder="seuemail@instituicao.edu.br"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="login-mobile-field">
              <span>Senha</span>

              <div>
                <IconeLoginMobile tipo="senha" />
                <input
                  type="password"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            {erro && (
              <div className="login-mobile-error">
                <span>!</span>
                <p>{erro}</p>
              </div>
            )}

            <button
              type="submit"
              className="login-mobile-submit"
              disabled={carregando}
            >
              <span>{carregando ? "Entrando..." : "Entrar no SIGSAS"}</span>
              <IconeLoginMobile tipo="seta" />
            </button>
          </form>

          <div className="login-mobile-links">
            <button type="button" onClick={irEsqueci}>
              Esqueci minha senha
            </button>

            <button type="button" onClick={irCadastro}>
              Primeiro acesso? <strong>Cadastre-se</strong>
            </button>
          </div>
        </section>

        <section className="login-mobile-confidence">
          <span>
            <IconeLoginMobile tipo="check" />
          </span>

          <p>
            Acesso protegido para usuários, professores, coordenadores e
            administradores.
          </p>
        </section>

        <footer className="login-mobile-footer">© 2026 SIGSAS</footer>
      </main>
    </div>
  )
}

export default LoginMobile
