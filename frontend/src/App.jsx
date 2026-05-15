import { useState } from "react"

import Login from "./pages/Login"
import Cadastro from "./pages/Cadastro"
import EsqueciSenha from "./pages/EsqueciSenha"
import Dashboard from "./pages/Dashboard"
import Admin from "./pages/Admin"
import ChatbotTeste from "./pages/ChatFluxo"

import "./App.css"

function App() {
  const [pagina, setPagina] = useState("login")

  const ir = (paginaDestino) => setPagina(paginaDestino)

  return (
    <>
      {pagina === "login" && (
        <Login
          irCadastro={() => ir("cadastro")}
          irEsqueci={() => ir("esqueci")}
          irDashboard={() => ir("dashboard")}
          irAdmin={() => ir("admin")}
        />
      )}

      {pagina === "cadastro" && (
        <Cadastro irLogin={() => ir("login")} />
      )}

      {pagina === "esqueci" && (
        <EsqueciSenha irLogin={() => ir("login")} />
      )}

      {pagina === "dashboard" && (
        <Dashboard
          sair={() => ir("login")}
          irChatbot={() => ir("chatbot")}
        />
      )}

      {pagina === "admin" && (
        <Admin sair={() => ir("login")} />
      )}

      {pagina === "chatbot" && (
        <ChatbotTeste voltar={() => ir("dashboard")} />
      )}
    </>
  )
}

export default App