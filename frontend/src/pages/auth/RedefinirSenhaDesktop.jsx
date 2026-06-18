import { useEffect, useState } from "react"
import { redefinirSenha as redefinirSenhaApi } from "../../services/authService"
import EsqueciSenhaDesktop from "./EsqueciSenhaDesktop"
import "../../styles/Auth.css"

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

function RedefinirSenhaDesktop({ irLogin }) {
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

  if (tokenNaoInformado) {
    return <EsqueciSenhaDesktop irLogin={irLogin} />
  }

  if (!tokenValido) {
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
              <span className="auth-kicker">Redefinição de senha</span>

              <h2>Não foi possível validar seu link.</h2>

              <p>
                O link pode estar expirado, já utilizado ou não corresponder a
                uma solicitação válida.
              </p>
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
                  <span className="auth-form-label">Token inválido</span>
                  <h3>Redefinir senha</h3>
                  <p>{mensagem}</p>
                </div>
              </div>

              <button
                type="button"
                className="auth-main-button"
                onClick={irLogin}
              >
                Voltar para login
              </button>
            </div>
          </section>
        </div>
      </div>
    )
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
            <span className="auth-kicker">Nova senha</span>

            <h2>Defina uma nova senha para sua conta.</h2>

            <p>
              Escolha uma senha segura para recuperar o acesso ao SIGSAS e
              continuar utilizando o sistema.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <strong>Senha segura</strong>
                <span>Use no mínimo 6 caracteres para prosseguir.</span>
              </div>

              <div className="auth-feature-item">
                <strong>Token validado</strong>
                <span>O link atual está autorizado para redefinição.</span>
              </div>

              <div className="auth-feature-item">
                <strong>Acesso restaurado</strong>
                <span>Após salvar, você será direcionado ao login.</span>
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
                <span className="auth-form-label">Redefinição autorizada</span>
                <h3>Redefinir senha</h3>
                <p>Informe sua nova senha de acesso.</p>
              </div>
            </div>

            <div className="auth-token-box">
              <p>
                <strong>Email:</strong> {email}
              </p>

              <p>
                <strong>Token:</strong> {tokenMascarado}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleRedefinirSenha}>
              <div className="auth-field">
                <label>Nova senha</label>
                <input
                  type="password"
                  placeholder="Digite a nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label>Confirmar nova senha</label>
                <input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                />
              </div>

              {erro && <div className="auth-error-box">{erro}</div>}

              <button
                type="submit"
                className="auth-main-button"
                disabled={carregando}
              >
                {carregando ? "Redefinindo..." : "Redefinir senha"}
              </button>
            </form>

            <div className="auth-actions-links">
              <button
                type="button"
                className="auth-text-link"
                onClick={irLogin}
              >
                Voltar para login
              </button>
            </div>
          </div>
        </section>
      </div>

      {sucesso && (
        <div className="auth-popup">
          <div className="auth-popup-box">
            <div className="auth-check">✔</div>
            <h3>Senha redefinida com sucesso!</h3>
            <p>Redirecionando para login...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RedefinirSenhaDesktop