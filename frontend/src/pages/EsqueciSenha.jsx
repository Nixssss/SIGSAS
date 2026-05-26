import { useState } from "react"
import "../App.css"
import { enviarRecuperacaoSenha } from "../services/emailServices"

function EsqueciSenha({ irLogin }) {
  const [email, setEmail] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function recuperarSenha(e) {
    e.preventDefault()

    const emailLimpo = email.trim().toLowerCase()

    if (!emailLimpo) {
      setErro("Informe um email.")
      return
    }

    if (!emailValido(emailLimpo)) {
      setErro("Informe um email válido.")
      return
    }

    const token = crypto.randomUUID()

    const novoToken = {
      email: emailLimpo,
      token,
      criadoEm: new Date().toISOString(),
      usado: false,
      validadeHoras: 1,
    }

    try {
      setLoading(true)
      setErro("")

      await enviarRecuperacaoSenha(emailLimpo, token)

      const tokensSalvos =
        JSON.parse(localStorage.getItem("tokensRecuperacaoSenha")) || []

      localStorage.setItem(
        "tokensRecuperacaoSenha",
        JSON.stringify([novoToken, ...tokensSalvos])
      )

      setLoading(false)
      setSucesso(true)

      setTimeout(() => {
        irLogin()
      }, 2500)
    } catch (error) {
      console.error("Erro ao enviar recuperação:", error)
      setLoading(false)
      setErro("Erro ao enviar email de recuperação.")
    }
  }

  return (
    <div className="center-container">
      <div className="login-card">
        <h2>Recuperar senha</h2>
        <p className="subtitle">Digite seu e-mail para receber instruções</p>

        <form onSubmit={recuperarSenha}>
          <label>E-mail</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {erro && <p className="erro">{erro}</p>}

          <button className={loading ? "loading" : ""} disabled={loading}>
            {loading ? "Enviando..." : "Enviar"}
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
            <h3>Email enviado!</h3>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Verifique sua caixa de entrada
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default EsqueciSenha