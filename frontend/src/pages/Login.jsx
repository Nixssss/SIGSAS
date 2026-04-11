import { useState } from "react"
import "../App.css"

function Login({ irCadastro, irEsqueci, irDashboard }) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")

  const ADMIN_EMAIL = "admin@sigsas.com"
  const ADMIN_SENHA = "123456"

  function fazerLogin(e) {
    e.preventDefault()

    if (email === ADMIN_EMAIL && senha === ADMIN_SENHA) {
      localStorage.setItem(
        "logado",
        JSON.stringify({
          email: ADMIN_EMAIL,
          tipo: "admin",
        })
      )

      setErro("")
      irDashboard()
      return
    }

    let usuario = null

    try {
      usuario = JSON.parse(localStorage.getItem("usuario"))
    } catch {
      usuario = null
    }

    if (!usuario || !usuario.email || !usuario.senha) {
      setErro("Nenhum usuário cadastrado")
      return
    }

    if (email !== usuario.email || senha !== usuario.senha) {
      setErro("Email ou senha incorretos")
      return
    }

    localStorage.setItem(
      "logado",
      JSON.stringify({
        email: usuario.email,
        tipo: "usuario",
      })
    )

    setErro("")
    irDashboard()
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo-area">
          <span>SIGSAS</span>
        </div>

        <div className="left-content">
          <h1>Gerencie suas salas</h1>
          <p>Sistema inteligente de organização.</p>
        </div>

        <div className="copyright">© 2026</div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Login</h2>

          <form onSubmit={fazerLogin}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />

            {erro && <p className="erro">{erro}</p>}

            <button type="submit">Entrar</button>
          </form>

          <p className="register">
            <span onClick={irEsqueci}>Esqueci senha</span>
          </p>

          <p className="register">
            Não tem conta? <span onClick={irCadastro}>Cadastre-se</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login