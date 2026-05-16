import { useEffect, useState } from "react"
import { reservasService, salasService } from "../services/adminService"

const STATUS_RESERVA = {
  1: "Pendente",
  2: "Aprovada",
  3: "Recusada",
  4: "Cancelada",
}

function StatusReservas() {
  const [reservas, setReservas] = useState([])
  const [salas, setSalas] = useState([])
  const [notificacoesVistas, setNotificacoesVistas] = useState(() => {
    return JSON.parse(localStorage.getItem("notificacoesReservas")) || []
  })
  const [popupNotificacao, setPopupNotificacao] = useState(null)

  async function carregarDados() {
    try {
      const [reservasApi, salasApi] = await Promise.all([
        reservasService.listar(),
        salasService.listar(),
      ])

      setReservas(reservasApi)
      setSalas(salasApi)
    } catch (error) {
      console.error("Erro ao carregar status de reservas:", error)
    }
  }

  useEffect(() => {
    carregarDados()

    const intervalo = setInterval(() => {
      carregarDados()
    }, 3000)

    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    verificarNotificacoes()
  }, [reservas])

  function getUsuarioLogadoId() {
    const usuario = JSON.parse(localStorage.getItem("logado") || "null")
    return usuario?.id || usuario?.idUsuario || 1
  }

  function getNomeSala(idSala) {
    return salas.find((s) => s.idSala === Number(idSala))?.nome || "Sala não encontrada"
  }

  function verificarNotificacoes() {
    const usuarioId = getUsuarioLogadoId()

    const novasNotificacoes = reservas.filter(
      (r) =>
        r.idUsuarioReserva === usuarioId &&
        (r.idStatusReserva === 2 || r.idStatusReserva === 3) &&
        !notificacoesVistas.includes(r.idReserva)
    )

    if (novasNotificacoes.length === 0) return

    const ultima = novasNotificacoes[0]

    setPopupNotificacao(ultima)

    const atualizadas = [...notificacoesVistas, ultima.idReserva]
    setNotificacoesVistas(atualizadas)
    localStorage.setItem("notificacoesReservas", JSON.stringify(atualizadas))
  }

  async function cancelarReserva(idReserva) {
    const confirmar = window.confirm("Deseja cancelar esta reserva?")
    if (!confirmar) return

    try {
      const atualizada = await reservasService.atualizarStatus(idReserva, {
        idStatusReserva: 4,
        idUsuarioAprovacao: getUsuarioLogadoId(),
        justificativa: "Cancelada pelo solicitante",
      })

      setReservas((prev) =>
        prev.map((r) => (r.idReserva === idReserva ? atualizada : r))
      )
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error)
      alert("Erro ao cancelar reserva.")
    }
  }

  const idUsuarioAtual = getUsuarioLogadoId()

  const minhasReservas = reservas
    .filter((r) => r.idUsuarioReserva === idUsuarioAtual)
    .sort((a, b) => b.idReserva - a.idReserva)

  const reservasPendentes = minhasReservas.filter((r) => r.idStatusReserva === 1)
  const reservasAprovadas = minhasReservas.filter((r) => r.idStatusReserva === 2)
  const historicoReservas = minhasReservas.filter(
    (r) => r.idStatusReserva === 3 || r.idStatusReserva === 4
  )

  function ReservaCard({ reserva, mostrarCancelar = false }) {
    return (
      <div className="list-row">
        <span>
          <strong>{getNomeSala(reserva.idSala)}</strong>
          <br />
          <small>Status: {STATUS_RESERVA[reserva.idStatusReserva]}</small>
          <br />
          <small>
            Data: {reserva.dataInicio} às {reserva.horaInicio} até{" "}
            {reserva.dataFim} às {reserva.horaFim}
          </small>
          <br />
          <small>Motivo: {reserva.motivo}</small>
          <br />
          <small>Pessoas: {reserva.qtdPessoas}</small>
          <br />
          <small>
            Solicitado em:{" "}
            {reserva.dataCriacao
              ? new Date(reserva.dataCriacao).toLocaleString("pt-BR")
              : "Não informado"}
          </small>
          <br />
          {reserva.justificativa && (
            <small>Justificativa: {reserva.justificativa}</small>
          )}
        </span>

        {mostrarCancelar && (
          <button
            className="btn delete"
            type="button"
            onClick={() => cancelarReserva(reserva.idReserva)}
          >
            Cancelar
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <h3>Status das Reservas</h3>
        <p className="subtitle">
          Acompanhe suas reservas pendentes, aprovadas, recusadas e canceladas.
        </p>
      </div>

      <div className="card">
        <h3>Reservas pendentes</h3>

        {reservasPendentes.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva pendente.</p>
        )}

        {reservasPendentes.map((r) => (
          <ReservaCard key={r.idReserva} reserva={r} mostrarCancelar />
        ))}
      </div>

      <div className="card">
        <h3>Reservas aprovadas</h3>

        {reservasAprovadas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva aprovada.</p>
        )}

        {reservasAprovadas.map((r) => (
          <ReservaCard key={r.idReserva} reserva={r} />
        ))}
      </div>

      <div className="card">
        <h3>Histórico de reservas</h3>

        {historicoReservas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhum histórico encontrado.</p>
        )}

        {historicoReservas.map((r) => (
          <ReservaCard key={r.idReserva} reserva={r} />
        ))}
      </div>

      {popupNotificacao && (
        <div className="popup">
          <div className="popup-box">
            <div className="check">
              {popupNotificacao.idStatusReserva === 2 ? "✔" : "✖"}
            </div>

            <h3>
              {popupNotificacao.idStatusReserva === 2
                ? "Reserva aprovada!"
                : "Reserva recusada"}
            </h3>

            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Sala: {getNomeSala(popupNotificacao.idSala)}
            </p>

            {popupNotificacao.justificativa && (
              <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
                Motivo: {popupNotificacao.justificativa}
              </p>
            )}

            <button
              className="btn primary"
              type="button"
              onClick={() => setPopupNotificacao(null)}
              style={{ marginTop: "14px" }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatusReservas