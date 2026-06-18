import { useEffect, useMemo, useState } from "react"
import api from "../../services/api"
import "./DashboardInicioMobile.css"

function IconBase({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

function IconSalas() {
  return (
    <IconBase>
      <rect x="4.2" y="3.2" width="15.6" height="17.6" rx="2.6" />
      <path d="M8 7.2h2M14 7.2h2M8 11.5h2M14 11.5h2M8 15.8h2M14 15.8h2" />
      <path d="M11 20.8v-4h2v4" />
    </IconBase>
  )
}

function IconCalendario() {
  return (
    <IconBase>
      <rect x="4.2" y="5.2" width="15.6" height="14.3" rx="3" />
      <path d="M8 3.6v3.8M16 3.6v3.8M5.1 9.2h13.8" />
      <path d="M8.4 14.2l2.2 2.2 5.2-5.4" />
    </IconBase>
  )
}

function IconCheck() {
  return (
    <IconBase>
      <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4" />
      <path d="m8 12.3 2.7 2.7 5.5-6" />
    </IconBase>
  )
}

function IconAtividade() {
  return (
    <IconBase>
      <path d="M4 18.5h16" />
      <path d="M6.5 15.5v-4" />
      <path d="M11.9 15.5V7.8" />
      <path d="M17.3 15.5v-9.2" />
    </IconBase>
  )
}

function IconChat() {
  return (
    <IconBase>
      <path d="M5.4 5.2h13.2c1 0 1.8.8 1.8 1.8v7.1c0 1-.8 1.8-1.8 1.8h-7.2L7.1 19v-3.1H5.4c-1 0-1.8-.8-1.8-1.8V7c0-1 .8-1.8 1.8-1.8z" />
      <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" />
    </IconBase>
  )
}

function IconArrow() {
  return (
    <IconBase>
      <path d="M5 12h13.5" />
      <path d="m14.2 6.8 5.1 5.2-5.1 5.2" />
    </IconBase>
  )
}

function IconRefresh() {
  return (
    <IconBase>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4.5v5h-5" />
    </IconBase>
  )
}

function IconHistory() {
  return (
    <IconBase>
      <path d="M4.5 12a7.5 7.5 0 1 0 2-5.1" />
      <path d="M4.5 5v4.4h4.4" />
      <path d="M12 7.5V12l3.1 1.8" />
    </IconBase>
  )
}

function extrairLista(response, chave) {
  const dados = response?.data

  if (Array.isArray(dados)) return dados
  if (Array.isArray(dados?.data)) return dados.data
  if (Array.isArray(dados?.dados)) return dados.dados
  if (Array.isArray(dados?.items)) return dados.items
  if (Array.isArray(dados?.[chave])) return dados[chave]

  return []
}

function normalizarStatus(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function formatarData(data) {
  if (!data) return "Data a definir"

  const texto = String(data).trim()
  const dataNormalizada = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? new Date(`${texto}T12:00:00`)
    : new Date(texto)

  if (Number.isNaN(dataNormalizada.getTime())) return texto

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(dataNormalizada)
    .replace(".", "")
}

function ehHoje(data) {
  if (!data) return false

  const valor = new Date(data)

  if (Number.isNaN(valor.getTime())) return false

  const hoje = new Date()

  return (
    valor.getDate() === hoje.getDate() &&
    valor.getMonth() === hoje.getMonth() &&
    valor.getFullYear() === hoje.getFullYear()
  )
}

function obterStatusReserva(reserva) {
  const status = Number(reserva?.idStatusReserva)

  if (status === 2) {
    return { label: "Aprovada", classe: "approved" }
  }

  if (status === 3) {
    return { label: "Recusada", classe: "refused" }
  }

  if (status === 4) {
    return { label: "Cancelada", classe: "cancelled" }
  }

  return { label: "Pendente", classe: "pending" }
}

function obterNomeSala(reserva) {
  return (
    reserva?.nomeSala ||
    reserva?.sala?.nome ||
    reserva?.salaNome ||
    reserva?.nome_sala ||
    (reserva?.idSala ? `Sala #${reserva.idSala}` : "Sala a definir")
  )
}

function obterDataLog(log) {
  return log?.dataHora || log?.createdAt || log?.dataCriacao || null
}

function formatarHoraLog(log) {
  const data = new Date(obterDataLog(log) || 0)

  if (Number.isNaN(data.getTime()) || !obterDataLog(log)) return "Agora"

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data)
}

function criarSerieSemanal(logs) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const dias = Array.from({ length: 7 }, (_, indice) => {
    const data = new Date(hoje)
    data.setDate(hoje.getDate() - (6 - indice))

    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`

    return {
      chave,
      data,
      total: 0,
      label: new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
      })
        .format(data)
        .replace(".", "")
        .slice(0, 3),
    }
  })

  const mapa = new Map(dias.map((dia) => [dia.chave, dia]))

  logs.forEach((log) => {
    const dataLog = new Date(obterDataLog(log) || 0)

    if (Number.isNaN(dataLog.getTime())) return

    const chave = `${dataLog.getFullYear()}-${String(dataLog.getMonth() + 1).padStart(2, "0")}-${String(dataLog.getDate()).padStart(2, "0")}`

    if (mapa.has(chave)) {
      mapa.get(chave).total += 1
    }
  })

  const maior = Math.max(...dias.map((dia) => dia.total), 1)

  return dias.map((dia) => ({
    ...dia,
    altura: dia.total ? Math.max(16, Math.round((dia.total / maior) * 100)) : 8,
  }))
}

function DashboardInicioMobile({
  nomeUsuario = "Administrador",
  onNavegar = () => {},
  onAbrirAdmin = () => {},
}) {
  const [salas, setSalas] = useState([])
  const [reservas, setReservas] = useState([])
  const [logs, setLogs] = useState([])
  const [carregando, setCarregando] = useState(true)

  const primeiroNome =
    String(nomeUsuario || "Administrador")
      .trim()
      .split(/\s+/)[0] || "Administrador"

  async function carregarResumo() {
    setCarregando(true)

    try {
      const resultados = await Promise.allSettled([
        api.get("/salas"),
        api.get("/reservas"),
        api.get("/auditoria"),
      ])

      setSalas(
        resultados[0].status === "fulfilled"
          ? extrairLista(resultados[0].value, "salas")
          : []
      )

      setReservas(
        resultados[1].status === "fulfilled"
          ? extrairLista(resultados[1].value, "reservas")
          : []
      )

      setLogs(
        resultados[2].status === "fulfilled"
          ? extrairLista(resultados[2].value, "logs")
          : []
      )
    } catch (error) {
      console.error("Erro ao carregar painel mobile:", error)
      setSalas([])
      setReservas([])
      setLogs([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarResumo()
  }, [])

  const resumo = useMemo(() => {
    const pendentes = reservas.filter(
      (reserva) => Number(reserva?.idStatusReserva) === 1
    )

    const aprovadas = reservas.filter(
      (reserva) => Number(reserva?.idStatusReserva) === 2
    )

    return {
      salas: salas.length,
      pendentes: pendentes.length,
      aprovadas: aprovadas.length,
      atividadesHoje: logs.filter((log) => ehHoje(obterDataLog(log))).length,
    }
  }, [salas, reservas, logs])

  const proximaReserva = useMemo(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return [...reservas]
      .filter((reserva) => {
        const status = Number(reserva?.idStatusReserva)

        if ([3, 4].includes(status)) return false
        if (!reserva?.dataInicio) return true

        const data = /^\d{4}-\d{2}-\d{2}$/.test(String(reserva.dataInicio))
          ? new Date(`${reserva.dataInicio}T12:00:00`)
          : new Date(reserva.dataInicio)

        return Number.isNaN(data.getTime()) || data >= hoje
      })
      .sort((a, b) => {
        const primeiro = `${a?.dataInicio || "9999-12-31"} ${a?.horaInicio || "23:59"}`
        const segundo = `${b?.dataInicio || "9999-12-31"} ${b?.horaInicio || "23:59"}`

        return primeiro.localeCompare(segundo)
      })[0]
  }, [reservas])

  const atividadesRecentes = useMemo(() => {
    return [...logs]
      .sort((a, b) => {
        const primeiro = new Date(obterDataLog(a) || 0).getTime()
        const segundo = new Date(obterDataLog(b) || 0).getTime()

        return segundo - primeiro
      })
      .slice(0, 3)
  }, [logs])

  const serieSemanal = useMemo(() => criarSerieSemanal(logs), [logs])

  const cards = [
    {
      id: "salas",
      label: "Salas",
      value: resumo.salas,
      detail: "ambientes",
      icon: <IconSalas />,
      classe: "blue",
      action: () => onNavegar("salas"),
    },
    {
      id: "pendentes",
      label: "Pendentes",
      value: resumo.pendentes,
      detail: "reservas",
      icon: <IconCalendario />,
      classe: "amber",
      action: () => onNavegar("statusReservas"),
    },
    {
      id: "aprovadas",
      label: "Aprovadas",
      value: resumo.aprovadas,
      detail: "reservas",
      icon: <IconCheck />,
      classe: "green",
      action: () => onNavegar("statusReservas"),
    },
    {
      id: "atividade",
      label: "Atividade",
      value: resumo.atividadesHoje,
      detail: "hoje",
      icon: <IconAtividade />,
      classe: "cyan",
      action: () => onAbrirAdmin("auditoria"),
    },
  ]

  return (
    <section className="dashboard-inicio-mobile" aria-label="Painel inicial mobile">
      <section className="dashboard-mobile-hero">
        <div className="dashboard-mobile-hero-grid" aria-hidden="true" />
        <span className="dashboard-mobile-hero-orb" aria-hidden="true" />

        <div className="dashboard-mobile-hero-copy">
          <span>Painel acadêmico</span>
          <h1>
            Olá, <strong>{primeiroNome}</strong>.
          </h1>
          <p>Confira reservas, salas e atividades da instituição.</p>
        </div>

        <button
          type="button"
          className="dashboard-mobile-refresh"
          onClick={carregarResumo}
          disabled={carregando}
          aria-label="Atualizar painel"
        >
          <IconRefresh />
        </button>
      </section>

      <section className="dashboard-mobile-summary-grid" aria-label="Resumo do sistema">
        {cards.map((card) => (
          <button
            className={`dashboard-mobile-summary-card ${card.classe}`}
            key={card.id}
            type="button"
            onClick={card.action}
          >
            <span className="dashboard-mobile-summary-icon">{card.icon}</span>

            <span className="dashboard-mobile-summary-copy">
              <small>{card.label}</small>
              <strong>{carregando ? "—" : card.value}</strong>
              <em>{card.detail}</em>
            </span>
          </button>
        ))}
      </section>

      <section className="dashboard-mobile-section">
        <div className="dashboard-mobile-section-header">
          <div>
            <span>PRÓXIMO COMPROMISSO</span>
            <h2>Reserva em destaque</h2>
          </div>

          <button type="button" onClick={() => onNavegar("statusReservas")}>
            Ver todas <IconArrow />
          </button>
        </div>

        {proximaReserva ? (
          <article className="dashboard-mobile-reservation">
            <div className="dashboard-mobile-reservation-main">
              <span className="dashboard-mobile-reservation-icon">
                <IconCalendario />
              </span>

              <div>
                <strong>{obterNomeSala(proximaReserva)}</strong>
                <small>
                  {formatarData(proximaReserva.dataInicio)} ·{" "}
                  {proximaReserva.horaInicio || "--:--"} às{" "}
                  {proximaReserva.horaFim || "--:--"}
                </small>
              </div>

              <span
                className={`dashboard-mobile-reservation-status ${
                  obterStatusReserva(proximaReserva).classe
                }`}
              >
                {obterStatusReserva(proximaReserva).label}
              </span>
            </div>

            <div className="dashboard-mobile-reservation-meta">
              <span>{proximaReserva.qtdPessoas || 0} pessoa(s)</span>
              <span>{proximaReserva.motivo || "Reserva acadêmica"}</span>
            </div>
          </article>
        ) : (
          <article className="dashboard-mobile-empty-reservation">
            <span className="dashboard-mobile-reservation-icon">
              <IconCalendario />
            </span>

            <div>
              <strong>Nenhuma reserva próxima</strong>
              <small>Consulte os ambientes para iniciar uma nova solicitação.</small>
            </div>

            <button type="button" onClick={() => onNavegar("salas")}>
              Consultar salas
            </button>
          </article>
        )}
      </section>

      <section className="dashboard-mobile-shortcuts">
        <button
          type="button"
          className="dashboard-mobile-shortcut rooms"
          onClick={() => onNavegar("salas")}
        >
          <span className="dashboard-mobile-shortcut-icon">
            <IconSalas />
          </span>

          <span>
            <strong>Explorar salas</strong>
            <small>Consulte ambientes e recursos disponíveis.</small>
          </span>

          <IconArrow />
        </button>

        <button
          type="button"
          className="dashboard-mobile-shortcut chatbot"
          onClick={() => onNavegar("chatbot")}
        >
          <span className="dashboard-mobile-shortcut-icon">
            <IconChat />
          </span>

          <span>
            <strong>Assistente de reservas</strong>
            <small>Faça uma solicitação guiada pelo chatbot.</small>
          </span>

          <IconArrow />
        </button>
      </section>

      <section className="dashboard-mobile-section">
        <div className="dashboard-mobile-section-header">
          <div>
            <span>ÚLTIMOS 7 DIAS</span>
            <h2>Atividade do sistema</h2>
          </div>

          <span className="dashboard-mobile-activity-badge">
            <IconHistory />
            {logs.length}
          </span>
        </div>

        <div className="dashboard-mobile-chart">
          {serieSemanal.map((dia) => (
            <div className="dashboard-mobile-chart-column" key={dia.chave}>
              <span>{dia.total}</span>
              <div>
                <i style={{ height: `${dia.altura}%` }} />
              </div>
              <small>{dia.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-mobile-section dashboard-mobile-recent-section">
        <div className="dashboard-mobile-section-header">
          <div>
            <span>HISTÓRICO RECENTE</span>
            <h2>Últimas atividades</h2>
          </div>

          <button
            type="button"
            className="dashboard-mobile-history-button"
            onClick={() => onAbrirAdmin("auditoria")}
            aria-label="Abrir auditoria"
          >
            <IconHistory />
          </button>
        </div>

        <div className="dashboard-mobile-recent-list">
          {atividadesRecentes.length ? (
            atividadesRecentes.map((log, index) => (
              <article
                className="dashboard-mobile-recent-item"
                key={`${log?.id || index}-${index}`}
              >
                <span />

                <div>
                  <strong>
                    {log?.descricao || log?.acao || log?.modulo || "Atividade SIGSAS"}
                  </strong>
                  <small>
                    {log?.modulo || "SIGSAS"} · {formatarHoraLog(log)}
                  </small>
                </div>
              </article>
            ))
          ) : (
            <div className="dashboard-mobile-recent-empty">
              <IconAtividade />
              <span>Nenhuma atividade registrada até o momento.</span>
            </div>
          )}
        </div>
      </section>
    </section>
  )
}

export default DashboardInicioMobile
