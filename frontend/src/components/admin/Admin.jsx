import { useEffect, useState } from "react"
import Toast from "../Toast"
import SalasAdmin from "./SalasAdmin"

import AdminResumo from "./AdminResumo"
import AdminBusca from "./AdminBusca"
import InstituicoesAdmin from "./InstituicoesAdmin"
import CampiAdmin from "./CampiAdmin"
import EdificiosAdmin from "./EdificiosAdmin"
import ReservasAdmin from "./ReservasAdmin"

function Admin({ adminTela }) {
  // 🔥 Persistência correta (lazy load)
  const [instituicoes, setInstituicoes] = useState(() => {
    return JSON.parse(localStorage.getItem("instituicoes")) || []
  })

  const [campi, setCampi] = useState(() => {
    return JSON.parse(localStorage.getItem("campi")) || []
  })

  const [edificios, setEdificios] = useState(() => {
    return JSON.parse(localStorage.getItem("edificios")) || []
  })

  const [salas, setSalas] = useState(() => {
    return JSON.parse(localStorage.getItem("salas")) || []
  })

  const [busca, setBusca] = useState("")
  const [toasts, setToasts] = useState([])

  // 🔥 Apenas salvar (sem reescrever vazio)
  useEffect(() => {
    localStorage.setItem("instituicoes", JSON.stringify(instituicoes))
  }, [instituicoes])

  useEffect(() => {
    localStorage.setItem("campi", JSON.stringify(campi))
  }, [campi])

  useEffect(() => {
    localStorage.setItem("edificios", JSON.stringify(edificios))
  }, [edificios])

  useEffect(() => {
    localStorage.setItem("salas", JSON.stringify(salas))
  }, [salas])

  function showToast(mensagem, tipo = "sucesso") {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, mensagem, tipo }])
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function normalizarTexto(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  const termoBusca = normalizarTexto(busca)

  const instituicoesFiltradas = instituicoes.filter((i) =>
    normalizarTexto(i.nome).includes(termoBusca)
  )

  const campiFiltrados = campi.filter((c) =>
    normalizarTexto(c.nome).includes(termoBusca)
  )

  const edificiosFiltrados = edificios.filter((e) =>
    normalizarTexto(e.nome).includes(termoBusca)
  )

  function getNomeInstituicao(id) {
    return instituicoes.find((i) => i.id === id)?.nome || "?"
  }

  function getNomeCampus(id) {
    return campi.find((c) => c.id === id)?.nome || "?"
  }

  function renderToasts() {
    return (
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            mensagem={t.mensagem}
            tipo={t.tipo}
            onClose={removeToast}
          />
        ))}
      </div>
    )
  }

  // 🔹 SALAS ADMIN
  if (adminTela === "salas") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <SalasAdmin
          salas={salas}
          setSalas={setSalas}
          instituicoes={instituicoes}
          campi={campi}
          edificios={edificios}
          showToast={showToast}
        />
      </div>
    )
  }

  // 🔹 INSTITUIÇÕES
  if (adminTela === "instituicoes") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <InstituicoesAdmin
          instituicoes={instituicoes}
          setInstituicoes={setInstituicoes}
          campi={campi}
          setCampi={setCampi}
          edificios={edificios}
          setEdificios={setEdificios}
          salas={salas}
          setSalas={setSalas}
          showToast={showToast}
        />
      </div>
    )
  }

  // 🔹 CAMPI
  if (adminTela === "campi") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <CampiAdmin
          campi={campi}
          setCampi={setCampi}
          instituicoes={instituicoes}
          edificios={edificios}
          setEdificios={setEdificios}
          salas={salas}
          setSalas={setSalas}
          getNomeInstituicao={getNomeInstituicao}
          showToast={showToast}
        />
      </div>
    )
  }

  // 🔹 EDIFÍCIOS
  if (adminTela === "edificios") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <EdificiosAdmin
          edificios={edificios}
          setEdificios={setEdificios}
          campi={campi}
          salas={salas}
          setSalas={setSalas}
          getNomeCampus={getNomeCampus}
          showToast={showToast}
        />
      </div>
    )
  }

  // 🔹 RESERVAS (NOVO)
  if (adminTela === "reservas") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <ReservasAdmin showToast={showToast} />
      </div>
    )
  }

  // 🔹 RESUMO (DEFAULT)
  return (
    <div className="admin-page">
      {renderToasts()}

      <AdminResumo
        instituicoes={instituicoes}
        campi={campi}
        edificios={edificios}
        salas={salas}
      />

      <AdminBusca busca={busca} setBusca={setBusca} />

      <div className="grid-3">
        <InstituicoesAdmin
          modoResumo
          instituicoes={instituicoesFiltradas}
          setInstituicoes={setInstituicoes}
          campi={campi}
          setCampi={setCampi}
          edificios={edificios}
          setEdificios={setEdificios}
          salas={salas}
          setSalas={setSalas}
          showToast={showToast}
        />

        <CampiAdmin
          modoResumo
          campi={campiFiltrados}
          setCampi={setCampi}
          instituicoes={instituicoes}
          edificios={edificios}
          setEdificios={setEdificios}
          salas={salas}
          setSalas={setSalas}
          getNomeInstituicao={getNomeInstituicao}
          showToast={showToast}
        />

        <EdificiosAdmin
          modoResumo
          edificios={edificiosFiltrados}
          setEdificios={setEdificios}
          campi={campi}
          salas={salas}
          setSalas={setSalas}
          getNomeCampus={getNomeCampus}
          showToast={showToast}
        />
      </div>
    </div>
  )
}

export default Admin