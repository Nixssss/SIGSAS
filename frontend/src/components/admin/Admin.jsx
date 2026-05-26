import { useEffect, useState } from "react"
import Toast from "../Toast"
import SalasAdmin from "./SalasAdmin"

import AdminResumo from "./AdminResumo"
import AdminBusca from "./AdminBusca"
import CadastroAdmin from "./CadastroAdmin"
import InstituicoesAdmin from "./InstituicoesAdmin"
import CampiAdmin from "./CampiAdmin"
import EdificiosAdmin from "./EdificiosAdmin"
import ReservasAdmin from "./ReservasAdmin"

import {
  instituicoesService,
  campiService,
  edificiosService,
  salasService,
} from "../../services/adminService"

function Admin({ adminTela }) {
  const [instituicoes, setInstituicoes] = useState([])
  const [campi, setCampi] = useState([])
  const [edificios, setEdificios] = useState([])
  const [salas, setSalas] = useState([])

  const [busca, setBusca] = useState("")
  const [toasts, setToasts] = useState([])

  async function carregarDadosAdmin() {
    try {
      const [instituicoesApi, campiApi, edificiosApi, salasApi] =
        await Promise.all([
          instituicoesService.listar(),
          campiService.listar(),
          edificiosService.listar(),
          salasService.listar(),
        ])

      setInstituicoes(instituicoesApi)
      setCampi(campiApi)
      setEdificios(edificiosApi)
      setSalas(salasApi)
    } catch (error) {
      console.error("Erro ao carregar dados administrativos:", error)
      showToast("Erro ao carregar dados administrativos", "erro")
    }
  }

  useEffect(() => {
    carregarDadosAdmin()
  }, [])

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
    return instituicoes.find((i) => i.id === Number(id))?.nome || "?"
  }

  function getNomeCampus(id) {
    return campi.find((c) => c.id === Number(id))?.nome || "?"
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

  if (adminTela === "reservas") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <ReservasAdmin showToast={showToast} />
      </div>
    )
  }

  if (adminTela === "cadastro") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <CadastroAdmin showToast={showToast} />
      </div>
    )
  }

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