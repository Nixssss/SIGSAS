import { useEffect, useState } from "react"
import { redefinirSenha as redefinirSenhaApi } from "../services/authService"
import "../App.css"

function RedefinirSenha({ irLogin }) {
  const [tokenValido, setTokenValido] = useState(false)
  const [mensagem, setMensagem] = useState("Validando token...")
  const [email, setEmail] = useState("")
  const [tokenAtual, setTokenAtual] = useState("")
  const [tokenMascarado, setTokenMascarado] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    validarToken()
  }, [])

  function mascararToken(token) {
    if (!token) return ""

    const inicio = token.substring(0, 8)
    const fim = token.substring(token.length - 4)

    return `${inicio}************${fim}`
  }

  function validarToken() {
    const params = new URLSearchParams(window.location.search)
    const tokenUrl = params.get("token")

    if (!tokenUrl) {
      setTokenValido(false)
      setMensagem("Token não informado.")
      return
    }

    const tokensSalvos =
      JSON.parse(localStorage.getItem("tokensRecuperacaoSenha")) || []

    const tokenEncontrado = tokensSalvos.find(
      (item) => item.token === tokenUrl
    )

    if (!tokenEncontrado) {
      setTokenValido(false)
      setMensagem("Token inválido ou não encontrado.")
      return
    }

    if (tokenEncontrado.usado) {
      setTokenValido(false)
      setMensagem("Este link de recuperação já foi utilizado.")
      return
    }

    const criadoEm = new Date(tokenEncontrado.criadoEm).getTime()
    const agora = new Date().getTime()
    const validadeHoras = tokenEncontrado.validadeHoras || 1
    const limiteMs = validadeHoras * 60 * 60 * 1000

    if (agora - criadoEm > limiteMs) {
      setTokenValido(false)
      setMensagem("Este link de recuperação expirou.")
      return
    }

    setTokenValido(true)
    setMensagem("")
    setEmail(tokenEncontrado.email)
    setTokenAtual(tokenUrl)
    setTokenMascarado(mascararToken(tokenUrl))
  }

  function marcarTokenComoUsado() {
    const tokensSalvos =
      JSON.parse(localStorage.getItem("tokensRecuperacaoSenha")) || []

    const tokensAtualizados = tokensSalvos.map((item) => {
      if (item.token === tokenAtual) {
        return {
          ...item,
          usado: true,
          usadoEm: new Date().toISOString(),
        }
      }

      return item
    })

    localStorage.setItem(
      "tokensRecuperacaoSenha",
      JSON.stringify(tokensAtualizados)
    )
  }

  async function handleRedefinirSenha(e) {
    e.preventDefault()

    if (!novaSenha || !confirmarSenha) {
      setErro("Preencha todos os campos.")
      return
    }

    if (novaSenha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.")
      return
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.")
      return
    }

    try {
      setCarregando(true)
      setErro("")

      await redefinirSenhaApi({
        email: email,
        nova_senha: novaSenha,
        token: tokenAtual,
      })

      marcarTokenComoUsado()

      setSucesso(true)

      setTimeout(() => {
        irLogin()
      }, 2500)
    } catch (error) {
      console.error("Erro ao redefinir senha:", error)

      setErro(
        error.response?.data?.detail ||
          "Erro ao redefinir senha. Verifique se o backend possui a rota de redefinição."
      )
    } finally {
      setCarregando(false)
    }
  }

  if (!tokenValido) {
    return (
      <div className="center-container">
        <div className="login-card">
          <h2>Redefinir senha</h2>
          <p className="subtitle">{mensagem}</p>

          <button type="button" onClick={irLogin}>
            Voltar para login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="center-container">
      <div className="login-card">
        <h2>Redefinir senha</h2>
        <p className="subtitle">Informe sua nova senha de acesso</p>

        <div className="token-box">
          <p>
            <strong>Email:</strong> {email}
          </p>

          <p>
            <strong>Token:</strong> {tokenMascarado}
          </p>
        </div>

        <form onSubmit={handleRedefinirSenha}>
          <label>Nova senha</label>
          <input
            type="password"
            placeholder="Digite a nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
          />

          <label>Confirmar nova senha</label>
          <input
            type="password"
            placeholder="Repita a nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />

          {erro && <p className="erro">{erro}</p>}

          <button type="submit" disabled={carregando}>
            {carregando ? "Redefinindo..." : "Redefinir senha"}
          </button>
        </form>

        <p className="register">
          <span onClick={irLogin}>Voltar para login</span>
        </p>
      </div>

      {sucesso && (
        <div className="popup">
          <div className="popup-box">
            <div className="check">✔</div>
            <h3>Senha redefinida com sucesso!</h3>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Redirecionando para login...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RedefinirSenha