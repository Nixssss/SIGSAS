import { useState } from "react"
import Login from "./pages/Login"
import Cadastro from "./pages/Cadastro"
import EsqueciSenha from "./pages/EsqueciSenha"

function App(){

  const [pagina,setPagina] = useState("login")

  return(

    <>
      {pagina === "login" &&
        <Login
          irCadastro={()=>setPagina("cadastro")}
          irEsqueci={()=>setPagina("esqueci")}
        />
      }

      {pagina === "cadastro" &&
        <Cadastro
          irLogin={()=>setPagina("login")}
        />
      }

      {pagina === "esqueci" &&
        <EsqueciSenha
          irLogin={()=>setPagina("login")}
        />
      }
    </>

  )

}

export default App 