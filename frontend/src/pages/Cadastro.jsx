import { useState } from "react";
import "../styles/login.css";
import logo from "../assets/logo.png";

function Cadastro({ irLogin }) {

  const [nome,setNome] = useState("")
  const [email,setEmail] = useState("")
  const [senha,setSenha] = useState("")
  const [confirmar,setConfirmar] = useState("")

  function handleCadastro(e){
    e.preventDefault()
    console.log(nome,email,senha,confirmar)
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
            Comece a organizar <br/>
            seus espaços agora.
          </h1>

          <p>
            Crie sua conta e tenha acesso ao sistema
            de agendamento de salas.
          </p>
        </div>

        <div className="copyright">
          © 2025 SIGSAS
        </div>

      </div>

      <div className="login-right">

        <div className="login-card">

          <h2>Criar conta</h2>

          <p className="subtitle">
            Preencha os dados abaixo
          </p>

          <form onSubmit={handleCadastro}>

            <label>Nome completo</label>
            <input
              type="text"
              placeholder="Seu nome"
              onChange={(e)=>setNome(e.target.value)}
            />

            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              onChange={(e)=>setEmail(e.target.value)}
            />

            <label>Senha</label>
            <input
              type="password"
              placeholder="mínimo 6 caracteres"
              onChange={(e)=>setSenha(e.target.value)}
            />

            <label>Confirmar senha</label>
            <input
              type="password"
              placeholder="repita a senha"
              onChange={(e)=>setConfirmar(e.target.value)}
            />

            <button>Cadastrar</button>

          </form>

          <p className="register">
            Já tem conta?
            <span onClick={irLogin}> Fazer login</span>
          </p>

        </div>

      </div>

    </div>

  )

}

export default Cadastro