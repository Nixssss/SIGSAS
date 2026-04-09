import { useState } from "react"
import Salas from "./Salas"

function Dashboard({ sair }){

  const [tela,setTela] = useState("salas")

  return(
    <div className="dashboard">

      <div className="sidebar">
        <h2>SIGSAS</h2>
        <button onClick={()=>setTela("salas")}>Salas</button>
        <button onClick={sair}>Sair</button>
      </div>

      <div className="content">
        {tela === "salas" && <Salas />}
      </div>

    </div>
  )
}

export default Dashboard