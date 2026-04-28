import { useState } from "react"
import Login from "./pages/Login"
import Cadastro from "./pages/Cadastro"
import EsqueciSenha from "./pages/EsqueciSenha"
import Dashboard from "./pages/Dashboard"
import Admin from "./pages/Admin"
import "./App.css"

function App(){

  const [pagina,setPagina] = useState("login")
  

  return(
    <>
      {pagina === "login" &&
        <Login
          irCadastro={()=>setPagina("cadastro")}
          irEsqueci={()=>setPagina("esqueci")}
          irDashboard={()=>setPagina("dashboard")}
          irAdmin={()=>setPagina("admin")}
        />
      }

      {pagina === "cadastro" &&
        <Cadastro irLogin={()=>setPagina("login")} />
      }

      {pagina === "esqueci" &&
        <EsqueciSenha irLogin={()=>setPagina("login")} />
      }

      {pagina === "dashboard" &&
        <Dashboard sair={()=>setPagina("login")} />
      }
      {pagina === "admin" &&
        <Admin sair={()=>setPagina("login")} />
      }
    </>
  )
}

export default App