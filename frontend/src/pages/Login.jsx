import { useState } from "react"
import "../styles/login.css"
import logo from "../assets/logo.png"

function Login({ irCadastro, irEsqueci }){

  const [email,setEmail] = useState("")
  const [senha,setSenha] = useState("")

  function fazerLogin(e){
    e.preventDefault()

    console.log("Email:", email)
    console.log("Senha:", senha)
  }

  return(

    <div className="login-container">

      <div className="login-left">

        <div className="logo-area">
          <img src={logo} className="logo"/>
          <span>SIGSAS</span>
        </div>

        <div className="left-content">
          <h1>
            Gerencie suas salas <br/>
            de forma inteligente
          </h1>

          <p>
            Agende, organize e acompanhe a disponibilidade
            das salas da sua instituição em um único lugar.
          </p>
        </div>

        <div className="copyright">
          © 2025 SIGSAS
        </div>

      </div>

      <div className="login-right">

        <div className="login-card">

          <h2>Bem-vindo(a)</h2>

          <p className="subtitle">
            Entre com suas credenciais para acessar o sistema
          </p>

          <form onSubmit={fazerLogin}>

            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />

            <label>Senha</label>
            <input
              type="password"
              placeholder="********"
              value={senha}
              onChange={(e)=>setSenha(e.target.value)}
              required
            />
            
            <button type="submit">
              Entrar
            </button>

          </form>

          <p className="register">
            <span onClick={irEsqueci}>
              Esqueci minha senha
            </span>
          </p>

          <p className="register">
            Não tem uma conta?
            <span onClick={irCadastro}> Cadastre-se</span>
          </p>

        </div>

      </div>

    </div>

  )

}

export default Login