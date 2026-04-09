import { useState } from "react"
import "../App.css"
import logo from "../assets/logo.png"

function Login({ irCadastro, irEsqueci, irDashboard }){

  const [email,setEmail] = useState("")
  const [senha,setSenha] = useState("")
  const [erro,setErro] = useState("")

  function fazerLogin(e){
    e.preventDefault()

    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if(!usuario){
      setErro("Nenhum usuário cadastrado")
      return
    }

    if(email !== usuario.email || senha !== usuario.senha){
      setErro("Email ou senha incorretos")
      return
    }

    setErro("")
    irDashboard()
  }

  return(
    <div className="login-container">

      <div className="login-left">
        <div className="logo-area">
          <img src={logo} className="logo"/>
          <span>SIGSAS</span>
        </div>

        <div className="left-content">
          <h1>Gerencie suas salas</h1>
          <p>Sistema inteligente de organização.</p>
        </div>

        <div className="copyright">© 2025</div>
      </div>

      <div className="login-right">
        <div className="login-card">

          <h2>Login</h2>

          <form onSubmit={fazerLogin}>
            <label>Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} required/>

            <label>Senha</label>
            <input type="password" value={senha} onChange={(e)=>setSenha(e.target.value)} required/>

            {erro && <p className="erro">{erro}</p>}

            <button>Entrar</button>
          </form>

          <p className="register">
            <span onClick={irEsqueci}>Esqueci senha</span>
          </p>

          <p className="register">
            Não tem conta?
            <span onClick={irCadastro}> Cadastre-se</span>
          </p>

        </div>
      </div>

    </div>
  )
}

export default Login