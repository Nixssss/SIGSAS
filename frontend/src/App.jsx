import { useEffect, useState } from "react"
import Login from "./pages/Login"
import Cadastro from "./pages/Cadastro"
import EsqueciSenha from "./pages/EsqueciSenha"
import RedefinirSenha from "./pages/RedefinirSenha"
import Dashboard from "./pages/Dashboard"
import "./App.css"

function App() {
  function verificarPaginaInicial() {
    const caminho = window.location.pathname.replace(/\/$/, "")

    if (caminho === "/cadastro") {
      return "cadastro"
    }

    if (caminho === "/esqueci-senha") {
      return "esqueciSenha"
    }

    if (caminho === "/redefinir-senha") {
      return "redefinirSenha"
    }

    const token = localStorage.getItem("token")

    if (token && caminho === "/dashboard") {
      return "dashboard"
    }

    return "login"
  }

  const [pagina, setPagina] = useState(() => verificarPaginaInicial())

  useEffect(() => {
    function atualizarPagina() {
      setPagina(verificarPaginaInicial())
    }

    window.addEventListener("popstate", atualizarPagina)

    return () => {
      window.removeEventListener("popstate", atualizarPagina)
    }
  }, [])

  function navegarPara(caminho, novaPagina) {
    window.history.pushState({}, "", caminho)
    setPagina(novaPagina)
  }

  function irLogin() {
    navegarPara("/", "login")
  }

  function irCadastro() {
    navegarPara("/cadastro", "cadastro")
  }

  function irEsqueci() {
    navegarPara("/esqueci-senha", "esqueciSenha")
  }

  function irRedefinirSenha() {
    navegarPara("/redefinir-senha", "redefinirSenha")
  }

  function irDashboard() {
    navegarPara("/dashboard", "dashboard")
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

      {pagina === "cadastro" && <Cadastro irLogin={irLogin} />}

      {pagina === "esqueciSenha" && <EsqueciSenha irLogin={irLogin} />}

      {pagina === "redefinirSenha" && (
        <RedefinirSenha irLogin={irLogin} irEsqueci={irEsqueci} />
      )}

      {pagina === "dashboard" && <Dashboard sair={irLogin} />}

      {!["login", "cadastro", "esqueciSenha", "redefinirSenha", "dashboard"].includes(
        pagina
      ) && (
        <Login
          irCadastro={irCadastro}
          irEsqueci={irEsqueci}
          irDashboard={irDashboard}
        />
      )}
    </>
  )
}

export default App