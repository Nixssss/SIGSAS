import { useEffect, useState } from "react"
import "../../styles/admin/AdminMobile.css"
import { createPortal } from "react-dom"
import Toast from "../Toast"
import SalasAdminMobile from "./SalasAdminMobile"
import AdminResumoMobile from "./AdminResumoMobile"
import AdminBuscaMobile from "./AdminBuscaMobile"
import CadastroAdminMobile from "./CadastroAdminMobile"
import InstituicoesAdminMobile from "./InstituicoesAdminMobile"
import CampiAdminMobile from "./CampiAdminMobile"
import EdificiosAdminMobile from "./EdificiosAdminMobile"
import ReservasAdminMobile from "./ReservasAdminMobile"
import UsuariosAdminMobile from "./UsuariosAdminMobile"
import AuditoriaAdminMobile from "./AuditoriaAdminMobile"
import ReportesProblemasAdminMobile from "./ReportesProblemasAdminMobile"
import SugestoesMelhoriasAdminMobile from "./SugestoesMelhoriasAdminMobile"
import ChatbotBHistoricoAdminMobile from "./ChatbotBHistoricoAdminMobile"

import {
  instituicoesService,
  campiService,
  edificiosService,
  salasService,
} from "../../services/adminService"

function AdminMobile({ adminTela }) {
  useEffect(() => {
    document.body.classList.add("admin-mobile-active")

    return () => {
      document.body.classList.remove("admin-mobile-active")
    }
  }, [])
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
      <div className="admin-page admin-mobile-page">
        {renderToasts()}

        <SalasAdminMobile
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
      <div className="admin-page admin-mobile-page">
        {renderToasts()}

        <InstituicoesAdminMobile
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
      <div className="admin-page admin-mobile-page">
        {renderToasts()}

        <CampiAdminMobile
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
      <div className="admin-page admin-mobile-page">
        {renderToasts()}

        <EdificiosAdminMobile
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
      <div className="admin-page admin-mobile-page">
        {renderToasts()}
        <ReservasAdminMobile showToast={showToast} />
      </div>
    )
  }

  if (adminTela === "cadastro") {
    return (
      <div className="admin-page admin-mobile-page">
        {renderToasts()}
        <CadastroAdminMobile showToast={showToast} />
      </div>
    )
  }

  if (adminTela === "usuarios") {
    return (
      <div className="admin-page admin-mobile-page">
        {renderToasts()}
        <UsuariosAdminMobile showToast={showToast} />
      </div>
    )
  }

  if (adminTela === "auditoria") {
    return (
      <div className="admin-page admin-mobile-page">
        {renderToasts()}
        <AuditoriaAdminMobile showToast={showToast} />
      </div>
    )
  }

  if (adminTela === "problemas") {
    return (
      <div className="admin-page admin-mobile-page">
        {renderToasts()}
        <ReportesProblemasAdminMobile showToast={showToast} />
      </div>
    )
  }

  if (adminTela === "sugestoes") {
    return (
      <div className="admin-page admin-mobile-page">
        {renderToasts()}
        <SugestoesMelhoriasAdminMobile showToast={showToast} />
      </div>
    )
  }

  if (adminTela === "chatbotb") {
    return (
      <div className="admin-page admin-mobile-page">
        {renderToasts()}
        <ChatbotBHistoricoAdminMobile showToast={showToast} />
      </div>
    )
  }

  return (
    <div className="admin-page admin-mobile-page">
      {renderToasts()}

      <div className="admin-mobile-overview">
        <AdminBuscaMobile busca={busca} setBusca={setBusca} />

        <AdminResumoMobile
          instituicoes={instituicoes}
          campi={campi}
          edificios={edificios}
          salas={salas}
        />

        <div className="admin-mobile-summary-grid">
          <InstituicoesAdminMobile
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

          <CampiAdminMobile
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

          <EdificiosAdminMobile
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
    </div>
  )
}

export default AdminMobile
