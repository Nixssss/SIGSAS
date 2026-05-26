import { useEffect, useState } from "react"
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

  const [carregando, setCarregando] = useState(false)

  async function carregarDados() {
    try {
      const [reservasApi, salasApi] = await Promise.all([
        reservasService.listar(),
        salasService.listar(),
      ])

      setReservas(reservasApi)
      setSalas(salasApi)
    } catch (error) {
      console.error("Erro ao carregar reservas:", error)
      showToast?.("Erro ao carregar reservas", "erro")
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  function getNomeSala(idSala) {
    return salas.find((s) => s.idSala === Number(idSala))?.nome || "Sala não encontrada"
  }

  function getUsuarioAprovacaoId() {
    const usuario = JSON.parse(localStorage.getItem("logado") || "null")
    return usuario?.id || usuario?.idUsuario || 1
  }

  async function aprovarReserva(reserva) {
    try {
      setCarregando(true)

      const atualizada = await reservasService.atualizarStatus(reserva.idReserva, {
        idStatusReserva: 2,
        idUsuarioAprovacao: getUsuarioAprovacaoId(),
        justificativa: "",
      })

      setReservas((prev) =>
        prev.map((r) => (r.idReserva === reserva.idReserva ? atualizada : r))
      )

      showToast?.("Reserva aprovada com sucesso", "sucesso")
    } catch (error) {
      console.error("Erro ao aprovar reserva:", error)
      showToast?.("Erro ao aprovar reserva", "erro")
    } finally {
      setCarregando(false)
    }
  }

  function abrirRecusa(reserva) {
    setReservaSelecionada(reserva)
    setMotivoRecusa("")
  }

  function cancelarRecusa() {
    setReservaSelecionada(null)
    setMotivoRecusa("")
  }

  async function confirmarRecusa(e) {
    e.preventDefault()

    if (!motivoRecusa.trim()) return

    try {
      setCarregando(true)

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
          r.idReserva === reservaSelecionada.idReserva ? atualizada : r
        )
      )

      showToast?.("Reserva recusada com sucesso", "erro")
      cancelarRecusa()
    } catch (error) {
      console.error("Erro ao recusar reserva:", error)
      showToast?.("Erro ao recusar reserva", "erro")
    } finally {
      setCarregando(false)
    }
  }

  function abrirCancelamento(reserva) {
    setReservaCancelamento(reserva)
    setMotivoCancelamento("")
  }

  function fecharCancelamento() {
    setReservaCancelamento(null)
    setMotivoCancelamento("")
  }

  async function confirmarCancelamento(e) {
    e.preventDefault()

    if (!motivoCancelamento.trim()) return

    try {
      setCarregando(true)

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
          r.idReserva === reservaCancelamento.idReserva ? atualizada : r
        )
      )

      showToast?.("Reserva cancelada com sucesso", "erro")
      fecharCancelamento()
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error)
      showToast?.("Erro ao cancelar reserva", "erro")
    } finally {
      setCarregando(false)
    }
  }

  const reservasPendentes = reservas.filter((r) => r.idStatusReserva === 1)
  const reservasAprovadas = reservas.filter((r) => r.idStatusReserva === 2)
  const historicoReservas = reservas.filter(
    (r) => r.idStatusReserva === 3 || r.idStatusReserva === 4
  )

  function DadosReserva({ r }) {
    return (
      <span>
        <strong>{getNomeSala(r.idSala)}</strong>
        <br />
        <small>Solicitante: {r.nomeUsuarioReserva || "Não informado"}</small>
        <br />
        <small>Matrícula: {r.matriculaUsuarioReserva || "Não informada"}</small>
        <br />
        <small>Cargo: {r.cargoUsuarioReserva || "Não informado"}</small>
        <br />
        <small>Instituição: {r.instituicaoUsuarioReserva || "Não informada"}</small>
        <br />
        <small>Status: {STATUS_RESERVA[r.idStatusReserva]}</small>
        <br />
        <small>
          Data: {r.dataInicio} às {r.horaInicio} até {r.dataFim} às {r.horaFim}
        </small>
        <br />
        <small>Motivo da reserva: {r.motivo}</small>
        <br />
        <small>Pessoas: {r.qtdPessoas}</small>
        <br />
        {r.justificativa && (
          <small>Justificativa / motivo: {r.justificativa}</small>
        )}
      </span>
    )
  }

  return (
    <>
      <div className="card">
        <h3>Reservas pendentes</h3>

        {reservasPendentes.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva pendente.</p>
        )}

        {reservasPendentes.map((r) => (
          <div key={r.idReserva} className="list-row">
            <DadosReserva r={r} />

            <div className="actions">
              <button
                className="btn primary"
                type="button"
                onClick={() => aprovarReserva(r)}
                disabled={carregando}
              >
                Aprovar
              </button>

              <button
                className="btn delete"
                type="button"
                onClick={() => abrirRecusa(r)}
                disabled={carregando}
              >
                Recusar
              </button>

              <button
                className="btn secondary"
                type="button"
                onClick={() => abrirCancelamento(r)}
                disabled={carregando}
              >
                Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Reservas aprovadas</h3>

        {reservasAprovadas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva aprovada.</p>
        )}

        {reservasAprovadas.map((r) => (
          <div key={r.idReserva} className="list-row">
            <DadosReserva r={r} />

            <div className="actions">
              <button
                className="btn delete"
                type="button"
                onClick={() => abrirCancelamento(r)}
                disabled={carregando}
              >
                Cancelar reserva
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Histórico de reservas</h3>

        {historicoReservas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva no histórico.</p>
        )}

        {historicoReservas.map((r) => (
          <div key={r.idReserva} className="list-row no-button-row">
            <DadosReserva r={r} />
          </div>
        ))}
      </div>

      {reservaSelecionada && (
        <div className="popup">
          <div className="modal-box">
            <h3>Recusar reserva</h3>

            <form onSubmit={confirmarRecusa} className="form-col">
              <textarea
                className="textarea"
                placeholder="Informe o motivo da recusa"
                value={motivoRecusa}
                onChange={(e) => setMotivoRecusa(e.target.value)}
                required
              />

              <button className="btn delete" type="submit" disabled={carregando}>
                {carregando ? "Salvando..." : "Confirmar recusa"}
              </button>

              <button
                className="btn secondary"
                type="button"
                onClick={cancelarRecusa}
                disabled={carregando}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {reservaCancelamento && (
        <div className="popup">
          <div className="modal-box">
            <h3>Cancelar reserva</h3>

            <p style={{ marginBottom: "12px", color: "#475569" }}>
              Informe o motivo do cancelamento da reserva da sala{" "}
              <strong>{getNomeSala(reservaCancelamento.idSala)}</strong>.
            </p>

            <form onSubmit={confirmarCancelamento} className="form-col">
              <textarea
                className="textarea"
                placeholder="Informe o motivo do cancelamento"
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                required
              />

              <button className="btn delete" type="submit" disabled={carregando}>
                {carregando ? "Salvando..." : "Confirmar cancelamento"}
              </button>

              <button
                className="btn secondary"
                type="button"
                onClick={fecharCancelamento}
                disabled={carregando}
              >
                Voltar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ReservasAdmin