import { useEffect, useMemo, useState } from "react"
import { reservasService, salasService } from "../services/adminService"

const STATUS_RESERVA = {
  1: "Pendente",
  2: "Aprovada",
  3: "Recusada",
  4: "Cancelada",
}

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function ehPerfilAdmin(perfil) {
  const perfilNormalizado = normalizarTexto(perfil)

  return perfilNormalizado === "admin" || perfilNormalizado === "administrador"
}

function StatusReservas() {
  const [reservas, setReservas] = useState([])
  const [salas, setSalas] = useState([])
  const [notificacoesVistas, setNotificacoesVistas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("notificacoesReservas")) || []
    } catch {
      return []
    }
  })
  const [popupNotificacao, setPopupNotificacao] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const perfil = localStorage.getItem("perfil")
  const isAdmin = ehPerfilAdmin(perfil)

  const usuarioLogado = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("logado") || "{}")
    } catch {
      return {}
    }
  }, [])

  async function carregarDados() {
    try {
      const [reservasApi, salasApi] = await Promise.all([
        reservasService.listar(),
        salasService.listar(),
      ])

      setReservas(Array.isArray(reservasApi) ? reservasApi : [])
      setSalas(Array.isArray(salasApi) ? salasApi : [])
    } catch (error) {
      console.error("Erro ao carregar status de reservas:", error)
      setReservas([])
      setSalas([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()

    const intervalo = setInterval(() => {
      carregarDados()
    }, 4000)

    function atualizarReservas() {
      carregarDados()
    }

    window.addEventListener("reservas-atualizadas", atualizarReservas)
    window.addEventListener("focus", atualizarReservas)

    return () => {
      clearInterval(intervalo)
      window.removeEventListener("reservas-atualizadas", atualizarReservas)
      window.removeEventListener("focus", atualizarReservas)
    }
  }, [])

  useEffect(() => {
    verificarNotificacoes()
  }, [reservas])

  function getUsuarioLogadoIdValido() {
    const idReal = usuarioLogado?.id ?? usuarioLogado?.idUsuario

    if (idReal === undefined || idReal === null || idReal === "") {
      return null
    }

    const idConvertido = Number(idReal)

    if (Number.isNaN(idConvertido)) {
      return null
    }

    return idConvertido
  }

  function getNomeUsuarioLogado() {
    return normalizarTexto(usuarioLogado?.nome || usuarioLogado?.email || "")
  }

  function getMatriculaUsuarioLogado() {
    return normalizarTexto(usuarioLogado?.matricula || "")
  }

  function getEmailUsuarioLogado() {
    return normalizarTexto(usuarioLogado?.email || "")
  }

  function reservaPertenceAoUsuario(reserva) {
    if (isAdmin) return true

    const idUsuarioAtual = getUsuarioLogadoIdValido()

    if (
      idUsuarioAtual !== null &&
      Number(reserva.idUsuarioReserva) === Number(idUsuarioAtual)
    ) {
      return true
    }

    const nomeUsuarioAtual = getNomeUsuarioLogado()
    const matriculaUsuarioAtual = getMatriculaUsuarioLogado()
    const emailUsuarioAtual = getEmailUsuarioLogado()

    const nomeReserva = normalizarTexto(reserva.nomeUsuarioReserva)
    const matriculaReserva = normalizarTexto(reserva.matriculaUsuarioReserva)
    const emailReserva = normalizarTexto(
      reserva.emailUsuarioReserva || reserva.emailUsuario || reserva.email
    )

    if (
      matriculaUsuarioAtual &&
      matriculaUsuarioAtual !== "nao informada" &&
      matriculaReserva &&
      matriculaReserva === matriculaUsuarioAtual
    ) {
      return true
    }

    if (
      emailUsuarioAtual &&
      emailReserva &&
      emailReserva === emailUsuarioAtual
    ) {
      return true
    }

    if (
      nomeUsuarioAtual &&
      nomeReserva &&
      nomeReserva === nomeUsuarioAtual
    ) {
      return true
    }

    return false
  }

  function getNomeSala(idSala) {
    const sala = salas.find(
      (s) =>
        Number(s.idSala) === Number(idSala) ||
        Number(s.id) === Number(idSala)
    )

    return sala?.nome || "Sala não encontrada"
  }

  function verificarNotificacoes() {
    if (isAdmin) return

    const novasNotificacoes = reservas.filter(
      (reserva) =>
        reservaPertenceAoUsuario(reserva) &&
        (Number(reserva.idStatusReserva) === 2 ||
          Number(reserva.idStatusReserva) === 3) &&
        !notificacoesVistas.includes(reserva.idReserva)
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
        idUsuarioAprovacao: getUsuarioLogadoIdValido(),
        justificativa: isAdmin
          ? "Cancelada pelo administrador"
          : "Cancelada pelo solicitante",
      })

      setReservas((prev) =>
        prev.map((reserva) =>
          reserva.idReserva === idReserva ? atualizada : reserva
        )
      )

      window.dispatchEvent(new Event("reservas-atualizadas"))
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error)
      alert("Erro ao cancelar reserva.")
    }
  }

  const reservasVisiveis = useMemo(() => {
    return reservas
      .filter((reserva) => reservaPertenceAoUsuario(reserva))
      .sort((a, b) => {
        const idA = Number(a.idReserva || 0)
        const idB = Number(b.idReserva || 0)

        return idB - idA
      })
  }, [reservas, isAdmin, usuarioLogado])

  const reservasPendentes = reservasVisiveis.filter(
    (reserva) => Number(reserva.idStatusReserva) === 1
  )

  const reservasAprovadas = reservasVisiveis.filter(
    (reserva) => Number(reserva.idStatusReserva) === 2
  )

  const historicoReservas = reservasVisiveis.filter(
    (reserva) =>
      Number(reserva.idStatusReserva) === 3 ||
      Number(reserva.idStatusReserva) === 4
  )

  function formatarDataCriacao(data) {
    if (!data) return "Não informado"

    try {
      return new Date(data).toLocaleString("pt-BR")
    } catch {
      return "Não informado"
    }
  }

  function ReservaCard({ reserva, mostrarCancelar = false }) {
    return (
      <div className="list-row">
        <span>
          <strong>{getNomeSala(reserva.idSala)}</strong>

          {isAdmin && (
            <>
              <br />
              <small>
                Solicitante:{" "}
                {reserva.nomeUsuarioReserva || "Usuário não informado"}
              </small>
              <br />
              <small>
                Matrícula:{" "}
                {reserva.matriculaUsuarioReserva || "Não informada"}
              </small>
            </>
          )}

          <br />
          <small>
            Status:{" "}
            {STATUS_RESERVA[Number(reserva.idStatusReserva)] ||
              "Status desconhecido"}
          </small>
          <br />
          <small>
            Data: {reserva.dataInicio} às {reserva.horaInicio} até{" "}
            {reserva.dataFim} às {reserva.horaFim}
          </small>
          <br />
          <small>Motivo: {reserva.motivo || "Não informado"}</small>
          <br />
          <small>Pessoas: {reserva.qtdPessoas || "Não informado"}</small>
          <br />
          <small>
            Solicitado em: {formatarDataCriacao(reserva.dataCriacao)}
          </small>

          {reserva.justificativa && (
            <>
              <br />
              <small>Justificativa: {reserva.justificativa}</small>
            </>
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
          {isAdmin
            ? "Visualize todas as reservas pendentes, aprovadas, recusadas e canceladas do sistema."
            : "Acompanhe somente suas reservas pendentes, aprovadas, recusadas e canceladas."}
        </p>
      </div>

      <div className="card">
        <h3>{isAdmin ? "Todas as reservas pendentes" : "Minhas reservas pendentes"}</h3>

        {carregando && <p style={{ marginTop: "12px" }}>Carregando reservas...</p>}

        {!carregando && reservasPendentes.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva pendente.</p>
        )}

        {!carregando &&
          reservasPendentes.map((reserva) => (
            <ReservaCard
              key={reserva.idReserva}
              reserva={reserva}
              mostrarCancelar
            />
          ))}
      </div>

      <div className="card">
        <h3>{isAdmin ? "Todas as reservas aprovadas" : "Minhas reservas aprovadas"}</h3>

        {carregando && <p style={{ marginTop: "12px" }}>Carregando reservas...</p>}

        {!carregando && reservasAprovadas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva aprovada.</p>
        )}

        {!carregando &&
          reservasAprovadas.map((reserva) => (
            <ReservaCard
              key={reserva.idReserva}
              reserva={reserva}
              mostrarCancelar
            />
          ))}
      </div>

      <div className="card">
        <h3>
          {isAdmin
            ? "Histórico geral de reservas"
            : "Meu histórico de reservas"}
        </h3>

        {carregando && <p style={{ marginTop: "12px" }}>Carregando histórico...</p>}

        {!carregando && historicoReservas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhum histórico encontrado.</p>
        )}

        {!carregando &&
          historicoReservas.map((reserva) => (
            <ReservaCard key={reserva.idReserva} reserva={reserva} />
          ))}
      </div>

      {popupNotificacao && (
        <div className="popup">
          <div className="popup-box">
            <div className="check">
              {Number(popupNotificacao.idStatusReserva) === 2 ? "✔" : "✖"}
            </div>

            <h3>
              {Number(popupNotificacao.idStatusReserva) === 2
                ? "Reserva aprovada!"
                : "Reserva recusada"}
            </h3>

            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Sala: {getNomeSala(popupNotificacao.idSala)}
            </p>

            {popupNotificacao.justificativa && (
              <p
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  marginTop: "8px",
                }}
              >
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