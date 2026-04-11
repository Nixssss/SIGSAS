import { useState } from "react"
import "../App.css"

function EsqueciSenha({ irLogin }) {
  const [email, setEmail] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)

  function recuperarSenha(e) {
    e.preventDefault()

    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setSucesso(true)

      setTimeout(() => {
        irLogin()
      }, 2000)
    }, 1500)
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