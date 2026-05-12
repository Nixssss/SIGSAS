import { useEffect, useState } from "react"
import "../App.css"
import { registrar } from "../services/authService"

function Cadastro({ irLogin }) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [conviteValido, setConviteValido] = useState(false)
  const [tokenConvite, setTokenConvite] = useState("")
  const [mensagemConvite, setMensagemConvite] = useState("Validando convite...")

  useEffect(() => {
    validarConvite()
  }, [])

  function validarConvite() {
    const params = new URLSearchParams(window.location.search)
    const tokenUrl = params.get("token")

    if (!tokenUrl) {
      setConviteValido(false)
      setMensagemConvite("Cadastro permitido somente por convite enviado pelo administrador.")
      return
    }

    const convitesSalvos =
      JSON.parse(localStorage.getItem("convitesCadastro")) || []

    const convite = convitesSalvos.find((item) => item.token === tokenUrl)

    if (!convite) {
      setConviteValido(false)
      setMensagemConvite("Convite inválido ou não encontrado.")
      return
    }

    if (convite.usado) {
      setConviteValido(false)
      setMensagemConvite("Este convite já foi utilizado.")
      return
    }

    const criadoEm = new Date(convite.criadoEm).getTime()
    const agora = new Date().getTime()
    const limiteHoras = convite.validadeHoras || 48
    const limiteMs = limiteHoras * 60 * 60 * 1000

    if (agora - criadoEm > limiteMs) {
      setConviteValido(false)
      setMensagemConvite("Este convite expirou. Solicite um novo convite ao administrador.")
      return
    }

    setConviteValido(true)
    setTokenConvite(tokenUrl)
    setEmail(convite.email)
    setMensagemConvite("")
  }

  function marcarConviteComoUsado() {
    const convitesSalvos =
      JSON.parse(localStorage.getItem("convitesCadastro")) || []

    const convitesAtualizados = convitesSalvos.map((convite) => {
      if (convite.token === tokenConvite) {
        return {
          ...convite,
          usado: true,
          usadoEm: new Date().toISOString(),
        }
      }

      return convite
    })

    localStorage.setItem(
      "convitesCadastro",
      JSON.stringify(convitesAtualizados)
    )
  }

  async function handleCadastro(e) {
    e.preventDefault()

    if (!conviteValido) {
      setErro("Cadastro bloqueado. Convite inválido.")
      return
    }

    if (!nome.trim()) {
      setErro("Informe seu nome completo.")
      return
    }

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.")
      return
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.")
      return
    }

    try {
      const response = await registrar({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha: senha,
        perfil: "usuario",
      })

      console.log(response)

      marcarConviteComoUsado()

      setErro("")
      setSucesso(true)

      setTimeout(() => {
        irLogin()
      }, 2000)
    } catch (error) {
      console.error("ERRO:", error.response?.data)
      setErro(error.response?.data?.detail || "Erro ao cadastrar.")
    }
  }

  if (!conviteValido) {
    return (
      <div className="login-container">
        <div className="login-left">
          <div className="logo-area">
            <span>SIGSAS</span>
          </div>

          <div className="left-content">
            <h1>
              Acesso por
              <br />
              convite
            </h1>
            <p>
              O cadastro no SIGSAS depende de um convite válido enviado pelo administrador.
            </p>
          </div>

          <div className="copyright">© 2026 SIGSAS</div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <h2>Convite inválido</h2>
            <p className="subtitle">{mensagemConvite}</p>

            <button type="button" onClick={irLogin}>
              Voltar para login
            </button>
          </div>
        </div>
      </div>
    )
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
          <p className="subtitle">Cadastro liberado por convite</p>

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
              value={email}
              disabled
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