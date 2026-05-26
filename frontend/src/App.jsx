import { useState } from "react"
import Login from "./pages/Login"
import Cadastro from "./pages/Cadastro"
import EsqueciSenha from "./pages/EsqueciSenha"
import RedefinirSenha from "./pages/RedefinirSenha"
import Dashboard from "./pages/Dashboard"
import "./App.css"

function App() {
  function verificarPaginaInicial() {
    const caminho = window.location.pathname

    if (caminho === "/cadastro") {
      return "cadastro"
    }

    if (caminho === "/redefinir-senha") {
      return "redefinirSenha"
    }

    return "login"
  }

  const [pagina, setPagina] = useState(verificarPaginaInicial)

  function irLogin() {
    window.history.pushState({}, "", "/")
    setPagina("login")
  }

  function irCadastro() {
    window.history.pushState({}, "", "/cadastro")
    setPagina("cadastro")
  }

  function irEsqueci() {
    window.history.pushState({}, "", "/esqueci-senha")
    setPagina("esqueci")
  }

  function irDashboard() {
    window.history.pushState({}, "", "/")
    setPagina("dashboard")
  }

  return (
    <>
      {pagina === "login" && (
        <Login
          irCadastro={irCadastro}
          irEsqueci={irEsqueci}
          irDashboard={irDashboard}
        />
      )}

      {pagina === "cadastro" && (
        <Cadastro irLogin={irLogin} />
      )}

      {pagina === "esqueci" && (
        <EsqueciSenha irLogin={irLogin} />
      )}

      {pagina === "redefinirSenha" && (
        <RedefinirSenha irLogin={irLogin} />
      )}

      {pagina === "dashboard" && (
        <Dashboard sair={irLogin} />
      )}
    </>
  )
}

export default App