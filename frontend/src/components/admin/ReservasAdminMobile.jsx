import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
  campiService,
  edificiosService,
  instituicoesService,
  reservasService,
  salasService,
} from "../../services/adminService"

import "../../styles/admin/ReservasAdminMobile.css"

const STATUS_RESERVA = {
  1: "Pendente",
  2: "Aprovada",
  3: "Recusada",
  4: "Cancelada",
}

const CLASSE_STATUS_RESERVA = {
  1: "pendente",
  2: "aprovada",
  3: "recusada",
  4: "cancelada",
}

function ReservasAdminMobile({ showToast }) {
  const [reservas, setReservas] = useState([])
  const [salas, setSalas] = useState([])
  const [edificios, setEdificios] = useState([])
  const [campi, setCampi] = useState([])
  const [instituicoes, setInstituicoes] = useState([])

  const [reservaSelecionada, setReservaSelecionada] = useState(null)
  const [motivoRecusa, setMotivoRecusa] = useState("")

  const [reservaCancelamento, setReservaCancelamento] = useState(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState("")

  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    carregarDados()

    function atualizarReservas() {
      carregarDados()
    }

    window.addEventListener("reservas-atualizadas", atualizarReservas)
    window.addEventListener("focus", atualizarReservas)

    return () => {
      window.removeEventListener("reservas-atualizadas", atualizarReservas)
      window.removeEventListener("focus", atualizarReservas)
    }
  }, [])

  useEffect(() => {
    if (reservaSelecionada || reservaCancelamento) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [reservaSelecionada, reservaCancelamento])

  async function carregarDados() {
    try {
      setCarregando(true)

      const [
        reservasApi,
        salasApi,
        edificiosApi,
        campiApi,
        instituicoesApi,
      ] = await Promise.all([
        reservasService.listar(),
        salasService.listar(),
        edificiosService.listar(),
        campiService.listar(),
        instituicoesService.listar(),
      ])

      setReservas(Array.isArray(reservasApi) ? reservasApi : [])
      setSalas(Array.isArray(salasApi) ? salasApi : [])
      setEdificios(Array.isArray(edificiosApi) ? edificiosApi : [])
      setCampi(Array.isArray(campiApi) ? campiApi : [])
      setInstituicoes(Array.isArray(instituicoesApi) ? instituicoesApi : [])
    } catch (error) {
      console.error("Erro ao carregar reservas administrativas:", error)
      showToast?.("Erro ao carregar reservas", "erro")
      setReservas([])
      setSalas([])
      setEdificios([])
      setCampi([])
      setInstituicoes([])
    } finally {
      setCarregando(false)
    }
  }

  function mesmoId(valorA, valorB) {
    return Number(valorA) === Number(valorB)
  }

  function primeiroValorValido(...valores) {
    const encontrado = valores.find(
      (valor) => valor !== undefined && valor !== null && valor !== ""
    )

    return encontrado ?? null
  }

  function textoOuNaoInformado(valor) {
    return valor !== undefined && valor !== null && valor !== ""
      ? valor
      : "Não informado"
  }

  function getSala(idSala) {
    return (
      salas.find(
        (sala) =>
          mesmoId(sala.idSala, idSala) ||
          mesmoId(sala.id, idSala)
      ) || null
    )
  }

  function getEdificio(sala) {
    if (!sala) return null

    if (sala.edificio && typeof sala.edificio === "object") {
      return sala.edificio
    }

    const idEdificio = primeiroValorValido(
      sala.idEdificio,
      sala.id_edificio,
      sala.edificioId,
      sala.id_edificio_sala
    )

    return (
      edificios.find(
        (edificio) =>
          mesmoId(edificio.id, idEdificio) ||
          mesmoId(edificio.idEdificio, idEdificio)
      ) || null
    )
  }

  function getCampus(sala, edificio) {
    if (sala?.campus && typeof sala.campus === "object") {
      return sala.campus
    }

    if (edificio?.campus && typeof edificio.campus === "object") {
      return edificio.campus
    }

    const idCampus = primeiroValorValido(
      sala?.idCampus,
      sala?.id_campus,
      sala?.campusId,
      edificio?.idCampus,
      edificio?.id_campus,
      edificio?.campusId
    )

    return (
      campi.find(
        (campus) =>
          mesmoId(campus.id, idCampus) ||
          mesmoId(campus.idCampus, idCampus)
      ) || null
    )
  }

  function getInstituicao(sala, campus) {
    if (sala?.instituicao && typeof sala.instituicao === "object") {
      return sala.instituicao
    }

    if (campus?.instituicao && typeof campus.instituicao === "object") {
      return campus.instituicao
    }

    const idInstituicao = primeiroValorValido(
      sala?.idInstituicao,
      sala?.id_instituicao,
      sala?.instituicaoId,
      campus?.idInstituicao,
      campus?.id_instituicao,
      campus?.instituicaoId
    )

    return (
      instituicoes.find(
        (instituicao) =>
          mesmoId(instituicao.id, idInstituicao) ||
          mesmoId(instituicao.idInstituicao, idInstituicao)
      ) || null
    )
  }

  function getDetalhesSala(idSala) {
    const sala = getSala(idSala)
    const edificio = getEdificio(sala)
    const campus = getCampus(sala, edificio)
    const instituicao = getInstituicao(sala, campus)

    return {
      nome: textoOuNaoInformado(sala?.nome),
      numero: textoOuNaoInformado(sala?.numero),
      andar: textoOuNaoInformado(sala?.andar),
      edificio: textoOuNaoInformado(edificio?.nome || sala?.nomeEdificio),
      campus: textoOuNaoInformado(campus?.nome || sala?.nomeCampus),
      instituicao: textoOuNaoInformado(
        instituicao?.nome || sala?.nomeInstituicao
      ),
    }
  }

  function getNomeSala(idSala) {
    return getDetalhesSala(idSala).nome
  }

  function getUsuarioAprovacaoId() {
    try {
      const usuario = JSON.parse(localStorage.getItem("logado") || "null")
      return Number(usuario?.id || usuario?.idUsuario || 1)
    } catch {
      return 1
    }
  }

  function formatarDataBR(data) {
    if (!data) return "Não informada"

    const texto = String(data).trim()

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
      const [ano, mes, dia] = texto.slice(0, 10).split("-")
      return `${dia}/${mes}/${ano}`
    }

    const dataConvertida = new Date(texto)

    if (Number.isNaN(dataConvertida.getTime())) {
      return "Não informada"
    }

    return dataConvertida.toLocaleDateString("pt-BR")
  }

  function formatarHoraBR(hora) {
    if (!hora) return "Não informada"

    const texto = String(hora).trim()

    if (/^\d{2}:\d{2}/.test(texto)) {
      return texto.slice(0, 5)
    }

    return texto
  }

  function formatarDataHoraCriacao(data) {
    if (!data) return "Não informado"

    const dataConvertida = new Date(data)

    if (Number.isNaN(dataConvertida.getTime())) {
      return "Não informado"
    }

    return dataConvertida.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatarPeriodoReserva(reserva) {
    const dataInicio = formatarDataBR(reserva.dataInicio)
    const dataFim = formatarDataBR(reserva.dataFim)
    const horaInicio = formatarHoraBR(reserva.horaInicio)
    const horaFim = formatarHoraBR(reserva.horaFim)

    if (dataInicio === dataFim) {
      return `${dataInicio}, das ${horaInicio} às ${horaFim}`
    }

    return `${dataInicio} às ${horaInicio} até ${dataFim} às ${horaFim}`
  }

  async function aprovarReserva(reserva) {
    try {
      setProcessando(true)

      const atualizada = await reservasService.atualizarStatus(
        reserva.idReserva,
        {
          idStatusReserva: 2,
          idUsuarioAprovacao: getUsuarioAprovacaoId(),
          justificativa: "",
        }
      )

      setReservas((prev) =>
        prev.map((r) =>
          Number(r.idReserva) === Number(reserva.idReserva) ? atualizada : r
        )
      )

      showToast?.("Reserva aprovada com sucesso", "sucesso")
      window.dispatchEvent(new Event("reservas-atualizadas"))
    } catch (error) {
      console.error("Erro ao aprovar reserva:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao aprovar reserva", "erro")
      }
    } finally {
      setProcessando(false)
    }
  }

  function abrirRecusa(reserva) {
    setReservaSelecionada(reserva)
    setMotivoRecusa("")
  }

  function cancelarRecusa() {
    if (processando) return

    setReservaSelecionada(null)
    setMotivoRecusa("")
  }

  async function confirmarRecusa(e) {
    e.preventDefault()

    if (!reservaSelecionada) return

    if (!motivoRecusa.trim()) {
      showToast?.("Informe o motivo da recusa", "erro")
      return
    }

    try {
      setProcessando(true)

      const atualizada = await reservasService.atualizarStatus(
        reservaSelecionada.idReserva,
        {
          idStatusReserva: 3,
          idUsuarioAprovacao: getUsuarioAprovacaoId(),
          justificativa: motivoRecusa.trim(),
        }
      )

      setReservas((prev) =>
        prev.map((r) =>
          Number(r.idReserva) === Number(reservaSelecionada.idReserva)
            ? atualizada
            : r
        )
      )

      showToast?.("Reserva recusada com sucesso", "erro")
      cancelarRecusa()
      window.dispatchEvent(new Event("reservas-atualizadas"))
    } catch (error) {
      console.error("Erro ao recusar reserva:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao recusar reserva", "erro")
      }
    } finally {
      setProcessando(false)
    }
  }

  function abrirCancelamento(reserva) {
    setReservaCancelamento(reserva)
    setMotivoCancelamento("")
  }

  function fecharCancelamento() {
    if (processando) return

    setReservaCancelamento(null)
    setMotivoCancelamento("")
  }

  async function confirmarCancelamento(e) {
    e.preventDefault()

    if (!reservaCancelamento) return

    if (!motivoCancelamento.trim()) {
      showToast?.("Informe o motivo do cancelamento", "erro")
      return
    }

    try {
      setProcessando(true)

      const atualizada = await reservasService.atualizarStatus(
        reservaCancelamento.idReserva,
        {
          idStatusReserva: 4,
          idUsuarioAprovacao: getUsuarioAprovacaoId(),
          justificativa: motivoCancelamento.trim(),
        }
      )

      setReservas((prev) =>
        prev.map((r) =>
          Number(r.idReserva) === Number(reservaCancelamento.idReserva)
            ? atualizada
            : r
        )
      )

      showToast?.("Reserva cancelada com sucesso", "erro")
      fecharCancelamento()
      window.dispatchEvent(new Event("reservas-atualizadas"))
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao cancelar reserva", "erro")
      }
    } finally {
      setProcessando(false)
    }
  }

  const reservasOrdenadas = useMemo(() => {
    return [...reservas].sort((a, b) => {
      const idA = Number(a.idReserva || 0)
      const idB = Number(b.idReserva || 0)

      return idB - idA
    })
  }, [reservas])

  const reservasPendentes = reservasOrdenadas.filter(
    (r) => Number(r.idStatusReserva) === 1
  )

  const reservasAprovadas = reservasOrdenadas.filter(
    (r) => Number(r.idStatusReserva) === 2
  )

  const historicoReservas = reservasOrdenadas.filter(
    (r) =>
      Number(r.idStatusReserva) === 3 || Number(r.idStatusReserva) === 4
  )

  function DadosReserva({ r }) {
    const sala = getDetalhesSala(r.idSala)

    return (
      <span className="reserva-dados">
        <strong>{sala.nome}</strong>
        <br />

        <small>Número da sala: {sala.numero}</small>
        <br />

        <small>Campus: {sala.campus}</small>
        <br />

        <small>Edifício: {sala.edificio}</small>
        <br />

        <small>Andar: {sala.andar}</small>
        <br />

        <small>
          Solicitante: {r.nomeUsuarioReserva || "Não informado"}
        </small>
        <br />

        <small>
          Matrícula: {r.matriculaUsuarioReserva || "Não informada"}
        </small>
        <br />

        <small>Cargo: {r.cargoUsuarioReserva || "Não informado"}</small>
        <br />

        <small>
          Instituição: {r.instituicaoUsuarioReserva || sala.instituicao}
        </small>
        <br />

        <small>
          Status:{" "}
          <span
            className={`reserva-status-badge status-${
              CLASSE_STATUS_RESERVA[Number(r.idStatusReserva)] || "desconhecido"
            }`}
          >
            {STATUS_RESERVA[Number(r.idStatusReserva)] || "Desconhecido"}
          </span>
        </small>
        <br />

        <small>Data: {formatarPeriodoReserva(r)}</small>
        <br />

        <small>Motivo da reserva: {r.motivo || "Não informado"}</small>
        <br />

        <small>Pessoas: {r.qtdPessoas || "Não informado"}</small>
        <br />

        <small>Solicitado em: {formatarDataHoraCriacao(r.dataCriacao)}</small>

        {r.justificativa && (
          <>
            <br />
            <small>Justificativa / motivo: {r.justificativa}</small>
          </>
        )}
      </span>
    )
  }

  function ModalBase({ titulo, descricao, children, onClose, danger = false }) {
    return createPortal(
      <div className="admin-reserva-modal-overlay" onMouseDown={onClose}>
        <div
          className="admin-reserva-modal"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className={
              danger ? "admin-reserva-icon danger" : "admin-reserva-icon"
            }
          >
            {danger ? "!" : "✓"}
          </div>

          <div className="admin-reserva-modal-header">
            <div>
              <h3>{titulo}</h3>
              <p>{descricao}</p>
            </div>

            <button
              type="button"
              className="admin-reserva-modal-close"
              onClick={onClose}
              disabled={processando}
              aria-label="Fechar modal"
            >
              ×
            </button>
          </div>

          {children}
        </div>
      </div>,
      document.body
    )
  }

  const modalRecusa =
    reservaSelecionada &&
    ModalBase({
      titulo: "Recusar reserva",
      descricao: `Informe o motivo da recusa da reserva da sala ${getNomeSala(
        reservaSelecionada.idSala
      )}.`,
      danger: true,
      onClose: cancelarRecusa,
      children: (
        <form onSubmit={confirmarRecusa} className="admin-reserva-modal-form">
          <div className="admin-reserva-info">
            <strong>{getNomeSala(reservaSelecionada.idSala)}</strong>
            <span>{formatarPeriodoReserva(reservaSelecionada)}</span>
          </div>

          <label>
            Motivo da recusa
            <textarea
              className="textarea"
              placeholder="Informe o motivo da recusa"
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              required
            />
          </label>

          <div className="admin-reserva-modal-actions">
            <button
              className="btn secondary"
              type="button"
              onClick={cancelarRecusa}
              disabled={processando}
            >
              Voltar
            </button>

            <button className="btn delete" type="submit" disabled={processando}>
              {processando ? "Recusando..." : "Confirmar recusa"}
            </button>
          </div>
        </form>
      ),
    })

  const modalCancelamento =
    reservaCancelamento &&
    ModalBase({
      titulo: "Cancelar reserva",
      descricao: `Informe o motivo do cancelamento da reserva da sala ${getNomeSala(
        reservaCancelamento.idSala
      )}.`,
      danger: true,
      onClose: fecharCancelamento,
      children: (
        <form
          onSubmit={confirmarCancelamento}
          className="admin-reserva-modal-form"
        >
          <div className="admin-reserva-info">
            <strong>{getNomeSala(reservaCancelamento.idSala)}</strong>
            <span>{formatarPeriodoReserva(reservaCancelamento)}</span>
          </div>

          <label>
            Motivo do cancelamento
            <textarea
              className="textarea"
              placeholder="Informe o motivo do cancelamento"
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              required
            />
          </label>

          <div className="admin-reserva-modal-actions">
            <button
              className="btn secondary"
              type="button"
              onClick={fecharCancelamento}
              disabled={processando}
            >
              Voltar
            </button>

            <button className="btn delete" type="submit" disabled={processando}>
              {processando ? "Cancelando..." : "Confirmar cancelamento"}
            </button>
          </div>
        </form>
      ),
    })

  return (
    <div className="reservas-admin-page">
      <div className="card reservas-section reservas-pendentes-card">
        <h3>Reservas pendentes</h3>

        {carregando && (
          <p style={{ marginTop: "12px" }}>Carregando reservas...</p>
        )}

        {!carregando && reservasPendentes.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva pendente.</p>
        )}

        {!carregando &&
          reservasPendentes.map((r) => (
            <div
              key={r.idReserva}
              className={`list-row reserva-row status-${
                CLASSE_STATUS_RESERVA[Number(r.idStatusReserva)] ||
                "desconhecido"
              }`}
            >
              <DadosReserva r={r} />

              <div className="actions">
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => aprovarReserva(r)}
                  disabled={processando}
                >
                  Aprovar
                </button>

                <button
                  className="btn delete"
                  type="button"
                  onClick={() => abrirRecusa(r)}
                  disabled={processando}
                >
                  Recusar
                </button>

                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => abrirCancelamento(r)}
                  disabled={processando}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ))}
      </div>

      <div className="card reservas-section reservas-aprovadas-card">
        <h3>Reservas aprovadas</h3>

        {carregando && (
          <p style={{ marginTop: "12px" }}>Carregando reservas...</p>
        )}

        {!carregando && reservasAprovadas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva aprovada.</p>
        )}

        {!carregando &&
          reservasAprovadas.map((r) => (
            <div
              key={r.idReserva}
              className={`list-row reserva-row status-${
                CLASSE_STATUS_RESERVA[Number(r.idStatusReserva)] ||
                "desconhecido"
              }`}
            >
              <DadosReserva r={r} />

              <div className="actions">
                <button
                  className="btn delete"
                  type="button"
                  onClick={() => abrirCancelamento(r)}
                  disabled={processando}
                >
                  Cancelar reserva
                </button>
              </div>
            </div>
          ))}
      </div>

      <div className="card reservas-section reservas-historico-card">
        <h3>Histórico de reservas</h3>

        {carregando && (
          <p style={{ marginTop: "12px" }}>Carregando histórico...</p>
        )}

        {!carregando && historicoReservas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva no histórico.</p>
        )}

        {!carregando &&
          historicoReservas.map((r) => (
            <div
              key={r.idReserva}
              className={`list-row no-button-row reserva-row status-${
                CLASSE_STATUS_RESERVA[Number(r.idStatusReserva)] ||
                "desconhecido"
              }`}
            >
              <DadosReserva r={r} />
            </div>
          ))}
      </div>

      {modalRecusa}
      {modalCancelamento}
    </div>
  )
}

export default ReservasAdminMobile
