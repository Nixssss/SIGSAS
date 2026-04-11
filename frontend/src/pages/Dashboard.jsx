import { useState } from "react"
import Salas from "./Salas"
import Admin from "./Admin"

function Dashboard({ sair }) {
  const [tela, setTela] = useState("salas")
  const usuario = JSON.parse(localStorage.getItem("logado") || "null")

  function handleSair() {
    localStorage.removeItem("logado")
    sair()
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>SIGSAS</h2>

        <button onClick={() => setTela("salas")}>Salas</button>

        {usuario?.tipo === "admin" && (
          <button onClick={() => setTela("admin")}>Admin</button>
        )}

        <button onClick={handleSair}>Sair</button>
      </div>

      <div className="content">
        {tela === "salas" && <Salas />}
        {tela === "admin" && usuario?.tipo === "admin" && <Admin />}
      </div>
    </div>
  )
}

export default Dashboard