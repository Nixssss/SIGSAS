import { useState } from "react"
import "../styles/login.css"
import logo from "../assets/logo.png"

function EsqueciSenha({ irLogin }){

  const [email,setEmail] = useState("")

  function recuperarSenha(e){
    e.preventDefault()
    alert("Email enviado para recuperação")
  }

  return(

    <div className="login-container">

      <div className="login-left">

        <div className="logo-area">
          <img src={logo} className="logo"/>
          <span>SIGSAS</span>
        </div>

        <div className="left-content">
          <h1>Recuperar senha</h1>
          <p>
            Informe seu email para receber
            instruções de redefinição de senha.
          </p>
        </div>

        <div className="copyright">
          © 2025 SIGSAS
        </div>

      </div>

      <div className="login-right">

        <div className="login-card">

          <h2>Esqueci minha senha</h2>

          <form onSubmit={recuperarSenha}>

            <label>Email</label>

            <input
              type="email"
              placeholder="seu@email.com"
              onChange={(e)=>setEmail(e.target.value)}
            />

            <button>Enviar recuperação</button>

          </form>

          <p className="register">
            <span onClick={irLogin}>Voltar para login</span>
          </p>

        </div>

      </div>

    </div>

  )

}

export default EsqueciSenha