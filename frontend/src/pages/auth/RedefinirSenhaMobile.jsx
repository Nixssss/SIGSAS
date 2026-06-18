import { useEffect, useState } from "react"
import { redefinirSenha as redefinirSenhaApi } from "../../services/authService"
import EsqueciSenhaMobile from "./EsqueciSenhaMobile"
import {
  AuthIconMobile,
  AuthMobileMessage,
  AuthMobileShell,
} from "./AuthMobileShared"
import "./RedefinirSenhaMobile.css"

function RedefinirSenhaMobile({ irLogin }) {
  const [tokenValido, setTokenValido] = useState(false)
  const [tokenNaoInformado, setTokenNaoInformado] = useState(false)
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
      setTokenNaoInformado(true)
      setMensagem("Token não informado.")
      return
    }

    setTokenNaoInformado(false)

    const tokensSalvos =
      JSON.parse(localStorage.getItem("tokensRecuperacaoSenha")) || []

    const tokenEncontrado = tokensSalvos.find((item) => item.token === tokenUrl)

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

  async function handleRedefinirSenha(evento) {
    evento.preventDefault()

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
        email,
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

  if (tokenNaoInformado) {
    return <EsqueciSenhaMobile irLogin={irLogin} />
  }

  if (!tokenValido) {
    return (
      <AuthMobileShell
        eyebrow="REDEFINIÇÃO DE SENHA"
        title="Não foi possível validar seu link."
        text="O link pode estar expirado, já utilizado ou não corresponder a uma solicitação válida."
      >
        <AuthMobileMessage
          tipo="error"
          titulo="Link indisponível"
          texto={mensagem}
          acao={
            <button type="button" onClick={irLogin}>
              Voltar para login
            </button>
          }
        />
      </AuthMobileShell>
    )
  }

  return (
    <AuthMobileShell
      eyebrow="NOVA SENHA"
      title="Crie uma nova senha."
      text="Escolha uma senha segura para recuperar o acesso à sua conta SIGSAS."
    >
      <section className="auth-mobile-card redefinir-mobile-card">
        <header className="auth-mobile-card-header">
          <div>
            <span>REDEFINIÇÃO AUTORIZADA</span>
            <h2>Redefinir senha</h2>
          </div>

          <span className="auth-mobile-card-step">02</span>
        </header>

        <div className="redefinir-mobile-token">
          <span>
            <AuthIconMobile tipo="chave" />
          </span>

          <div>
            <small>E-MAIL VINCULADO</small>
            <strong>{email}</strong>
            <p>Token validado: {tokenMascarado}</p>
          </div>
        </div>

        <form className="auth-mobile-form" onSubmit={handleRedefinirSenha}>
          <label className="auth-mobile-field">
            <span>Nova senha</span>

            <div className="auth-mobile-input-wrap">
              <AuthIconMobile tipo="senha" />
              <input
                type="password"
                placeholder="Mínimo de 6 caracteres"
                value={novaSenha}
                onChange={(evento) => setNovaSenha(evento.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          <label className="auth-mobile-field">
            <span>Confirmar nova senha</span>

            <div className="auth-mobile-input-wrap">
              <AuthIconMobile tipo="senha" />
              <input
                type="password"
                placeholder="Repita a nova senha"
                value={confirmarSenha}
                onChange={(evento) => setConfirmarSenha(evento.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          {erro && (
            <div className="auth-mobile-form-error">
              <span>!</span>
              <p>{erro}</p>
            </div>
          )}

          <button type="submit" className="auth-mobile-submit" disabled={carregando}>
            <span>{carregando ? "Redefinindo..." : "Salvar nova senha"}</span>
            <AuthIconMobile tipo="seta" />
          </button>
        </form>

        <div className="auth-mobile-links">
          <button type="button" onClick={irLogin}>
            Voltar para <strong>login</strong>
          </button>
        </div>
      </section>

      {sucesso && (
        <div className="auth-mobile-popup">
          <div className="auth-mobile-popup-card">
            <span>
              <AuthIconMobile tipo="check" />
            </span>
            <h3>Senha redefinida!</h3>
            <p>Redirecionando para o login...</p>
          </div>
        </div>
      )}
    </AuthMobileShell>
  )
}

export default RedefinirSenhaMobile
