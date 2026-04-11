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

    const emailLimpo = email.trim().toLowerCase()
    const senhaLimpa = senha.trim()

    if (emailLimpo === ADMIN_EMAIL && senhaLimpa === ADMIN_SENHA) {
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

    let usuarios = []

    try {
      usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]")
    } catch {
      usuarios = []
    }

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      setErro("Nenhum usuário cadastrado")
      return
    }

    const usuarioEncontrado = usuarios.find(
      (usuario) =>
        usuario?.email?.trim().toLowerCase() === emailLimpo &&
        usuario?.senha === senhaLimpa
    )

    if (!usuarioEncontrado) {
      setErro("Email ou senha incorretos")
      return
    }

    localStorage.setItem(
      "logado",
      JSON.stringify({
        id: usuarioEncontrado.id,
        nome: usuarioEncontrado.nome,
        email: usuarioEncontrado.email,
        matricula: usuarioEncontrado.matricula,
        cargoId: usuarioEncontrado.cargoId,
        cursoId: usuarioEncontrado.cursoId,
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