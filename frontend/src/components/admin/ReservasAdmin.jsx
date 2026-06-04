import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { reservasService, salasService } from "../../services/adminService"

const STATUS_RESERVA = {
  1: "Pendente",
  2: "Aprovada",
  3: "Recusada",
  4: "Cancelada",
}

function ReservasAdmin({ showToast }) {
  const [reservas, setReservas] = useState([])
  const [salas, setSalas] = useState([])

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

      const [reservasApi, salasApi] = await Promise.all([
        reservasService.listar(),
        salasService.listar(),
      ])

      setReservas(Array.isArray(reservasApi) ? reservasApi : [])
      setSalas(Array.isArray(salasApi) ? salasApi : [])
    } catch (error) {
      console.error("Erro ao carregar reservas administrativas:", error)
      showToast?.("Erro ao carregar reservas", "erro")
      setReservas([])
      setSalas([])
    } finally {
      setCarregando(false)
    }
  }

  function getNomeSala(idSala) {
    const sala = salas.find(
      (s) =>
        Number(s.idSala) === Number(idSala) ||
        Number(s.id) === Number(idSala)
    )

    return sala?.nome || "Sala não encontrada"
  }

  function getUsuarioAprovacaoId() {
    try {
      const usuario = JSON.parse(localStorage.getItem("logado") || "null")
      return Number(usuario?.id || usuario?.idUsuario || 1)
    } catch {
      return 1
    }
  }

  function formatarDataCriacao(data) {
    if (!data) return "Não informado"

    try {
      return new Date(data).toLocaleString("pt-BR")
    } catch {
      return "Não informado"
    }
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
    return (
      <span>
        <strong>{getNomeSala(r.idSala)}</strong>
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
          Instituição: {r.instituicaoUsuarioReserva || "Não informada"}
        </small>
        <br />

        <small>
          Status:{" "}
          {STATUS_RESERVA[Number(r.idStatusReserva)] || "Desconhecido"}
        </small>
        <br />

        <small>
          Data: {r.dataInicio} às {r.horaInicio} até {r.dataFim} às{" "}
          {r.horaFim}
        </small>
        <br />

        <small>Motivo da reserva: {r.motivo || "Não informado"}</small>
        <br />

        <small>Pessoas: {r.qtdPessoas || "Não informado"}</small>
        <br />

        <small>Solicitado em: {formatarDataCriacao(r.dataCriacao)}</small>

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
            <span>
              {reservaSelecionada.dataInicio} às{" "}
              {reservaSelecionada.horaInicio} até{" "}
              {reservaSelecionada.dataFim} às {reservaSelecionada.horaFim}
            </span>
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
            <span>
              {reservaCancelamento.dataInicio} às{" "}
              {reservaCancelamento.horaInicio} até{" "}
              {reservaCancelamento.dataFim} às {reservaCancelamento.horaFim}
            </span>
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
    <>
      <div className="card">
        <h3>Reservas pendentes</h3>

        {carregando && (
          <p style={{ marginTop: "12px" }}>Carregando reservas...</p>
        )}

        {!carregando && reservasPendentes.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva pendente.</p>
        )}

        {!carregando &&
          reservasPendentes.map((r) => (
            <div key={r.idReserva} className="list-row">
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

      <div className="card">
        <h3>Reservas aprovadas</h3>

        {carregando && (
          <p style={{ marginTop: "12px" }}>Carregando reservas...</p>
        )}

        {!carregando && reservasAprovadas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva aprovada.</p>
        )}

        {!carregando &&
          reservasAprovadas.map((r) => (
            <div key={r.idReserva} className="list-row">
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

      <div className="card">
        <h3>Histórico de reservas</h3>

        {carregando && (
          <p style={{ marginTop: "12px" }}>Carregando histórico...</p>
        )}

        {!carregando && historicoReservas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva no histórico.</p>
        )}

        {!carregando &&
          historicoReservas.map((r) => (
            <div key={r.idReserva} className="list-row no-button-row">
              <DadosReserva r={r} />
            </div>
          ))}
      </div>

      {modalRecusa}
      {modalCancelamento}
    </>
  )
}

export default ReservasAdmin