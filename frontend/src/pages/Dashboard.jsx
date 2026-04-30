import { useState } from "react"
import Salas from "./Salas"
import StatusReservas from "./StatusReservas"
import Admin from "../components/admin/Admin"

function Dashboard({ sair }) {
  const [tela, setTela] = useState("salas")
  const [adminTela, setAdminTela] = useState("resumo")
  const perfil = localStorage.getItem("perfil")

  function handleSair() {
    localStorage.removeItem("token")
    localStorage.removeItem("perfil")
    localStorage.removeItem("logado")
    sair()
  }

  function abrirAdmin(telaAdmin = "resumo") {
    setTela("admin")
    setAdminTela(telaAdmin)
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>SIGSAS</h2>

        <button
          className={tela === "salas" ? "active" : ""}
          onClick={() => setTela("salas")}
        >
          Salas
        </button>

        <button
          className={tela === "statusReservas" ? "active" : ""}
          onClick={() => setTela("statusReservas")}
        >
          Status Reservas
        </button>

        {perfil === "admin" && (
          <>
            <button
              className={tela === "admin" ? "active" : ""}
              onClick={() => abrirAdmin("resumo")}
            >
              Admin
            </button>

            {tela === "admin" && (
              <div className="admin-submenu">
                <button
                  className={adminTela === "resumo" ? "active" : ""}
                  onClick={() => abrirAdmin("resumo")}
                >
                  Resumo
                </button>

                <button
                  className={adminTela === "instituicoes" ? "active" : ""}
                  onClick={() => abrirAdmin("instituicoes")}
                >
                  Instituições
                </button>

                <button
                  className={adminTela === "campi" ? "active" : ""}
                  onClick={() => abrirAdmin("campi")}
                >
                  Campi
                </button>

                <button
                  className={adminTela === "edificios" ? "active" : ""}
                  onClick={() => abrirAdmin("edificios")}
                >
                  Edifícios
                </button>

                <button
                  className={adminTela === "salas" ? "active" : ""}
                  onClick={() => abrirAdmin("salas")}
                >
                  Salas Admin
                </button>

                <button
                  className={adminTela === "reservas" ? "active" : ""}
                  onClick={() => abrirAdmin("reservas")}
                >
                  Reservas
                </button>
              </div>
            )}
          </>
        )}

        <button onClick={handleSair}>Sair</button>
      </div>

      <div className="content">
        {tela === "salas" && <Salas />}

        {tela === "statusReservas" && <StatusReservas />}

        {tela === "admin" && perfil === "admin" && (
          <Admin adminTela={adminTela} />
        )}
      </div>
    </div>
  )
}

export default Dashboard