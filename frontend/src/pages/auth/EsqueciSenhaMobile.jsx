import { useState } from "react"
import { enviarRecuperacaoSenha } from "../../services/emailServices"
import {
  AuthIconMobile,
  AuthMobileMessage,
  AuthMobileShell,
} from "./AuthMobileShared"
import "./EsqueciSenhaMobile.css"

function EsqueciSenhaMobile({ irLogin }) {
  const [email, setEmail] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  function emailValido(emailAtual) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAtual)
  }

  function gerarTokenRecuperacao() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  function salvarTokenRecuperacao(emailLimpo, token) {
    const novoToken = {
      email: emailLimpo,
      token,
      criadoEm: new Date().toISOString(),
      usado: false,
      validadeHoras: 1,
    }

    const tokensSalvos =
      JSON.parse(localStorage.getItem("tokensRecuperacaoSenha")) || []

    localStorage.setItem(
      "tokensRecuperacaoSenha",
      JSON.stringify([novoToken, ...tokensSalvos])
    )
  }

  function obterMensagemErro(error) {
    const detail = error?.response?.data?.detail

    if (typeof detail === "string") return detail

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item?.msg || item?.message || JSON.stringify(item))
        .join(" | ")
    }

    if (detail && typeof detail === "object") {
      return detail.msg || detail.message || JSON.stringify(detail)
    }

    return "Erro ao enviar email de recuperação."
  }

  async function recuperarSenha(evento) {
    evento.preventDefault()

    const emailLimpo = email.trim().toLowerCase()

    if (!emailLimpo) {
      setErro("Informe um email.")
      return
    }

    if (!emailValido(emailLimpo)) {
      setErro("Informe um email válido.")
      return
    }

    try {
      setLoading(true)
      setErro("")
      setSucesso(false)

      const token = gerarTokenRecuperacao()

      await enviarRecuperacaoSenha(emailLimpo, token)
      salvarTokenRecuperacao(emailLimpo, token)

      setSucesso(true)

      setTimeout(() => {
        irLogin()
      }, 2500)
    } catch (error) {
      console.error("Erro ao enviar recuperação:", error)
      setErro(obterMensagemErro(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthMobileShell
      eyebrow="RECUPERAÇÃO DE ACESSO"
      title="Vamos recuperar seu acesso."
      text="Informe o e-mail cadastrado para receber o link seguro de redefinição."
    >
      <section className="auth-mobile-card esqueceu-mobile-card">
        <header className="auth-mobile-card-header">
          <div>
            <span>ESQUECI MINHA SENHA</span>
            <h2>Recuperar senha</h2>
          </div>

          <span className="auth-mobile-card-step">01</span>
        </header>

        <form className="auth-mobile-form" onSubmit={recuperarSenha}>
          <label className="auth-mobile-field">
            <span>E-mail cadastrado</span>

            <div className="auth-mobile-input-wrap">
              <AuthIconMobile tipo="email" />
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

          {erro && (
            <div className="auth-mobile-form-error">
              <span>!</span>
              <p>{erro}</p>
            </div>
          )}

          <button type="submit" className="auth-mobile-submit" disabled={loading}>
            <span>{loading ? "Enviando..." : "Enviar link de recuperação"}</span>
            <AuthIconMobile tipo="seta" />
          </button>
        </form>

        <div className="auth-mobile-links">
          <button type="button" onClick={irLogin}>
            Voltar para <strong>login</strong>
          </button>
        </div>
      </section>

      <section className="esqueceu-mobile-note">
        <span>
          <AuthIconMobile tipo="chave" />
        </span>

        <p>
          O link de recuperação possui token temporário e poderá ser usado uma
          única vez.
        </p>
      </section>

      {sucesso && (
        <div className="auth-mobile-popup">
          <div className="auth-mobile-popup-card">
            <span>
              <AuthIconMobile tipo="check" />
            </span>
            <h3>E-mail enviado!</h3>
            <p>Verifique sua caixa de entrada para acessar o link seguro.</p>
          </div>
        </div>
      )}
    </AuthMobileShell>
  )
}

export default EsqueciSenhaMobile
