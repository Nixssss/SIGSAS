import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Toast from "../Toast"
import SalasAdmin from "./SalasAdmin"
import AdminResumo from "./AdminResumo"
import AdminBusca from "./AdminBusca"
import CadastroAdmin from "./CadastroAdmin"
import InstituicoesAdmin from "./InstituicoesAdmin"
import CampiAdmin from "./CampiAdmin"
import EdificiosAdmin from "./EdificiosAdmin"
import ReservasAdmin from "./ReservasAdmin"
import UsuariosAdmin from "./UsuariosAdmin"
import AuditoriaAdmin from "./AuditoriaAdmin"
import ReportesProblemasAdmin from "./ReportesProblemasAdmin"
import SugestoesMelhoriasAdmin from "./SugestoesMelhoriasAdmin"

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

      setInstituicoes(Array.isArray(instituicoesApi) ? instituicoesApi : [])
      setCampi(Array.isArray(campiApi) ? campiApi : [])
      setEdificios(Array.isArray(edificiosApi) ? edificiosApi : [])
      setSalas(Array.isArray(salasApi) ? salasApi : [])
    } catch (error) {
      console.error("Erro ao carregar dados administrativos:", error)
      showToast("Erro ao carregar dados administrativos", "erro")
    }
  }

  useEffect(() => {
    carregarDadosAdmin()

    function atualizarAdmin() {
      carregarDadosAdmin()
    }

    window.addEventListener("instituicoes-atualizadas", atualizarAdmin)
    window.addEventListener("campi-atualizados", atualizarAdmin)
    window.addEventListener("edificios-atualizados", atualizarAdmin)
    window.addEventListener("salas-atualizadas", atualizarAdmin)

    return () => {
      window.removeEventListener("instituicoes-atualizadas", atualizarAdmin)
      window.removeEventListener("campi-atualizados", atualizarAdmin)
      window.removeEventListener("edificios-atualizados", atualizarAdmin)
      window.removeEventListener("salas-atualizadas", atualizarAdmin)
    }
  }, [])

  function showToast(mensagem, tipo = "sucesso") {
    const id = Date.now() + Math.random()

    setToasts((prev) => [
      ...prev,
      {
        id,
        mensagem,
        tipo,
      },
    ])
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  const termoBusca = normalizarTexto(busca)

  const instituicoesFiltradas = instituicoes.filter((i) =>
    normalizarTexto(i.nome || i.nomeInstituicao || i.sigla).includes(termoBusca)
  )

  const campiFiltrados = campi.filter((c) =>
    normalizarTexto(c.nome || c.nomeCampus).includes(termoBusca)
  )

  const edificiosFiltrados = edificios.filter((e) =>
    normalizarTexto(e.nome || e.nomeEdificio).includes(termoBusca)
  )

  function getIdInstituicao(instituicao) {
    return (
      instituicao?.id ||
      instituicao?.idInstituicao ||
      instituicao?.id_instituicao
    )
  }

  function getNomeInstituicao(id) {
    return (
      instituicoes.find(
        (i) => String(getIdInstituicao(i)) === String(id)
      )?.nome ||
      instituicoes.find(
        (i) => String(getIdInstituicao(i)) === String(id)
      )?.nomeInstituicao ||
      instituicoes.find(
        (i) => String(getIdInstituicao(i)) === String(id)
      )?.sigla ||
      "?"
    )
  }

  function getIdCampus(campus) {
    return campus?.id || campus?.idCampus || campus?.id_campus
  }

  function getNomeCampus(id) {
    return (
      campi.find((c) => String(getIdCampus(c)) === String(id))?.nome ||
      campi.find((c) => String(getIdCampus(c)) === String(id))?.nomeCampus ||
      "?"
    )
  }

  function renderToasts() {
    if (!toasts.length) return null

    return createPortal(
      <div className="toast-container toast-container-global">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            mensagem={t.mensagem}
            tipo={t.tipo}
            onClose={removeToast}
          />
        ))}
      </div>,
      document.body
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
          setCampi={setCampi}
          instituicoes={instituicoes}
          salas={salas}
          setSalas={setSalas}
          getNomeCampus={getNomeCampus}
          getNomeInstituicao={getNomeInstituicao}
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

  if (adminTela === "usuarios") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <UsuariosAdmin showToast={showToast} />
      </div>
    )
  }

  if (adminTela === "auditoria") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <AuditoriaAdmin showToast={showToast} />
      </div>
    )
  }

  if (adminTela === "problemas") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <ReportesProblemasAdmin showToast={showToast} />
      </div>
    )
  }

  if (adminTela === "sugestoes") {
    return (
      <div className="admin-page">
        {renderToasts()}
        <SugestoesMelhoriasAdmin showToast={showToast} />
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
          setCampi={setCampi}
          instituicoes={instituicoes}
          salas={salas}
          setSalas={setSalas}
          getNomeCampus={getNomeCampus}
          getNomeInstituicao={getNomeInstituicao}
          showToast={showToast}
        />
      </div>
    </div>
  )
}

export default Admin