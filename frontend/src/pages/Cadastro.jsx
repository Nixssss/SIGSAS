import { useState } from "react"
import "../App.css"

function Cadastro({ irLogin }) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)

  function handleCadastro(e) {
    e.preventDefault()

    if (senha !== confirmar) {
      setErro("As senhas não coincidem")
      return
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres")
      return
    }

    const usuario = {
      nome,
      email,
      senha,
      tipo: "usuario",
    }

    localStorage.setItem("usuario", JSON.stringify(usuario))

    setErro("")
    setSucesso(true)

    setTimeout(() => {
      irLogin()
    }, 2000)
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo-area">
          <span>SIGSAS</span>
        </div>

        <div className="left-content">
          <h1>
            Comece a organizar
            <br />
            seus espaços agora.
          </h1>
          <p>
            Crie sua conta e tenha acesso ao sistema de agendamento de salas.
          </p>
        </div>

        <div className="copyright">© 2026 SIGSAS</div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Criar conta</h2>
          <p className="subtitle">Preencha os dados abaixo</p>

          <form onSubmit={handleCadastro}>
            <label>Nome completo</label>
            <input
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />

            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Senha</label>
            <input
              type="password"
              placeholder="mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />

            <label>Confirmar senha</label>
            <input
              type="password"
              placeholder="repita a senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />

            {erro && <p className="erro">{erro}</p>}

            <button type="submit">Cadastrar</button>
          </form>

          <p className="register">
            Já tem conta? <span onClick={irLogin}>Fazer login</span>
          </p>
        </div>
      </div>

      {sucesso && (
        <div className="popup">
          <div className="popup-box">
            <div className="check">✔</div>
            <h3>Conta criada com sucesso!</h3>
            <p>Redirecionando...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cadastro