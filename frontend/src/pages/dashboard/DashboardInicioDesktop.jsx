import { useEffect, useMemo, useState } from "react"
import api from "../../services/api"

function SvgBase({ children }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

function IconSala() {
  return (
    <SvgBase>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 7h2" />
      <path d="M14 7h2" />
      <path d="M8 11h2" />
      <path d="M14 11h2" />
      <path d="M8 15h2" />
      <path d="M14 15h2" />
      <path d="M11 21v-4h2v4" />
    </SvgBase>
  )
}

function IconPendente() {
  return (
    <SvgBase>
      <path d="M7 3h10" />
      <path d="M7 21h10" />
      <path d="M8 3c0 4 2.6 5.4 4 7-1.4 1.6-4 3-4 7" />
      <path d="M16 3c0 4-2.6 5.4-4 7 1.4 1.6 4 3 4 7" />
      <path d="M10 16h4" />
    </SvgBase>
  )
}

function IconAprovada() {
  return (
    <SvgBase>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M7.8 12.4l2.8 2.8 5.7-6.3" />
    </SvgBase>
  )
}

function IconCancelada() {
  return (
    <SvgBase>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 8.5l7 7" />
      <path d="M15.5 8.5l-7 7" />
    </SvgBase>
  )
}

function IconProblema() {
  return (
    <SvgBase>
      <path d="M12 4.2 20.2 19H3.8L12 4.2z" />
      <path d="M12 9.4v4.2" />
      <path d="M12 16.8h.01" />
    </SvgBase>
  )
}

function IconSugestao() {
  return (
    <SvgBase>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M8.4 14.3A5.3 5.3 0 1 1 15.6 14c-.9.8-1.4 1.6-1.6 2.5h-4c-.2-.8-.8-1.5-1.6-2.2z" />
      <path d="M12 7.2v2.2" />
    </SvgBase>
  )
}

function IconLogs() {
  return (
    <SvgBase>
      <path d="M7 3.5h7l4 4V20.5H7z" />
      <path d="M14 3.5v5h5" />
      <path d="M9.5 12.5h5" />
      <path d="M9.5 16h5" />
    </SvgBase>
  )
}

function IconUsuarios() {
  return (
    <SvgBase>
      <circle cx="9" cy="8.8" r="3" />
      <circle cx="17" cy="9.8" r="2.3" />
      <path d="M4.2 18.7c.8-2.8 2.7-4.3 5.8-4.3s5 1.5 5.8 4.3" />
      <path d="M15.3 18.3c.5-1.9 1.9-3 4.2-3.2" />
    </SvgBase>
  )
}

function IconAtualizar() {
  return (
    <SvgBase>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4.5v5h-5" />
    </SvgBase>
  )
}

function IconPainel() {
  return (
    <SvgBase>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M7.5 8.5h3.2v3.2H7.5z" />
      <path d="M13.5 8.5h3" />
      <path d="M13.5 11.7h3" />
      <path d="M7.5 15.8h9" />
    </SvgBase>
  )
}

function MetricCard({ classe, icone, titulo, valor, descricao }) {
  return (
    <div className={`metric-card ${classe}`}>
      <div className="metric-icon">{icone}</div>
      <div>
        <span>{titulo}</span>
        <strong>{valor}</strong>
        <small>{descricao}</small>
      </div>
    </div>
  )
}

function DashboardInicioDesktop() {
  const [salas, setSalas] = useState([])
  const [reservas, setReservas] = useState([])
  const [problemas, setProblemas] = useState([])
  const [sugestoes, setSugestoes] = useState([])
  const [logs, setLogs] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarResumo()
  }, [])

  async function carregarResumo() {
    setCarregando(true)

    try {
      const resultados = await Promise.allSettled([
        api.get("/salas"),
        api.get("/reservas"),
        api.get("/reportes-problemas"),
        api.get("/sugestoes-melhorias"),
        api.get("/auditoria"),
      ])

      setSalas(
        resultados[0].status === "fulfilled" &&
          Array.isArray(resultados[0].value.data)
          ? resultados[0].value.data
          : []
      )

      setReservas(
        resultados[1].status === "fulfilled" &&
          Array.isArray(resultados[1].value.data)
          ? resultados[1].value.data
          : []
      )

      setProblemas(
        resultados[2].status === "fulfilled" &&
          Array.isArray(resultados[2].value.data)
          ? resultados[2].value.data
          : []
      )

      setSugestoes(
        resultados[3].status === "fulfilled" &&
          Array.isArray(resultados[3].value.data)
          ? resultados[3].value.data
          : []
      )

      setLogs(
        resultados[4].status === "fulfilled" &&
          Array.isArray(resultados[4].value.data)
          ? resultados[4].value.data
          : []
      )
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
    } finally {
      setCarregando(false)
    }
  }

  function ehHoje(data) {
    if (!data) return false

    const hoje = new Date()
    const dataObj = new Date(data)

    return (
      hoje.getDate() === dataObj.getDate() &&
      hoje.getMonth() === dataObj.getMonth() &&
      hoje.getFullYear() === dataObj.getFullYear()
    )
  }

  function formatarDiaCurto(data) {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
    })
      .format(data)
      .replace(".", "")
  }

  function formatarChaveData(data) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")

    return `${ano}-${mes}-${dia}`
  }

  function obterDataLog(log) {
    return log?.dataHora || log?.createdAt || log?.dataCriacao || null
  }

  function normalizarStatus(valor) {
    return String(valor || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  const metricas = useMemo(() => {
    const reservasPendentes = reservas.filter((r) => r.idStatusReserva === 1)
    const reservasAprovadas = reservas.filter((r) => r.idStatusReserva === 2)
    const reservasCanceladas = reservas.filter((r) => r.idStatusReserva === 4)

    const problemasAbertos = problemas.filter((p) =>
      ["Aberto", "Em análise"].includes(p.status)
    )

    const sugestoesNovas = sugestoes.filter((s) =>
      ["Nova", "Em análise"].includes(s.status)
    )

    const logsHoje = logs.filter((log) => ehHoje(obterDataLog(log)))

    return {
      totalSalas: salas.length,
      reservasPendentes: reservasPendentes.length,
      reservasAprovadas: reservasAprovadas.length,
      reservasCanceladas: reservasCanceladas.length,
      problemasAbertos: problemasAbertos.length,
      sugestoesNovas: sugestoesNovas.length,
      logsHoje: logsHoje.length,
      usuariosAtivos: new Set(
        logs.map((log) => log.idUsuario).filter(Boolean)
      ).size,
    }
  }, [salas, reservas, problemas, sugestoes, logs])

  const logsPorStatus = useMemo(() => {
    const resumo = {
      sucesso: 0,
      erro: 0,
      iniciado: 0,
      abandono: 0,
      cancelado: 0,
    }

    logs.forEach((log) => {
      const status = normalizarStatus(log.status)

      if (resumo[status] !== undefined) {
        resumo[status] += 1
      }
    })

    return resumo
  }, [logs])

  const totalLogsStatus = Object.values(logsPorStatus).reduce(
    (total, valor) => total + valor,
    0
  )

  function calcularPorcentagem(valor) {
    if (!totalLogsStatus) return 0
    return Math.round((valor / totalLogsStatus) * 100)
  }

  const statusDashboard = useMemo(
    () => [
      {
        chave: "sucesso",
        label: "Sucesso",
        valor: logsPorStatus.sucesso,
        classe: "success",
        cor: "#16a34a",
      },
      {
        chave: "iniciado",
        label: "Iniciado",
        valor: logsPorStatus.iniciado,
        classe: "warning",
        cor: "#0ea5e9",
      },
      {
        chave: "erro",
        label: "Erro",
        valor: logsPorStatus.erro,
        classe: "danger",
        cor: "#ef4444",
      },
      {
        chave: "abandono",
        label: "Abandono",
        valor: logsPorStatus.abandono,
        classe: "accent",
        cor: "#8b5cf6",
      },
      {
        chave: "cancelado",
        label: "Cancelado",
        valor: logsPorStatus.cancelado,
        classe: "cancelado",
        cor: "#f59e0b",
      },
    ],
    [logsPorStatus]
  )

  const graficoDonut = useMemo(() => {
    if (!totalLogsStatus) {
      return "conic-gradient(#d9e1ea 0 100%)"
    }

    let inicio = 0

    const partes = statusDashboard.map((item) => {
      const porcentagem = calcularPorcentagem(item.valor)
      const fim = inicio + porcentagem
      const trecho = `${item.cor} ${inicio}% ${fim}%`
      inicio = fim
      return trecho
    })

    if (inicio < 100) {
      partes.push(`${statusDashboard[0].cor} ${inicio}% 100%`)
    }

    return `conic-gradient(${partes.join(", ")})`
  }, [statusDashboard, totalLogsStatus])

  const graficoAtividades = useMemo(() => {
    const hoje = new Date()

    const ultimosDias = Array.from({ length: 7 }).map((_, index) => {
      const data = new Date()
      data.setDate(hoje.getDate() - (6 - index))
      data.setHours(0, 0, 0, 0)

      return {
        data,
        chave: formatarChaveData(data),
        label: formatarDiaCurto(data),
        total: 0,
      }
    })

    logs.forEach((log) => {
      const dataLog = obterDataLog(log)

      if (!dataLog) return

      const data = new Date(dataLog)

      if (Number.isNaN(data.getTime())) return

      const chave = formatarChaveData(data)
      const diaEncontrado = ultimosDias.find((dia) => dia.chave === chave)

      if (diaEncontrado) {
        diaEncontrado.total += 1
      }
    })

    const maiorValor = Math.max(...ultimosDias.map((dia) => dia.total), 1)

    return ultimosDias.map((dia) => ({
      ...dia,
      altura: dia.total === 0 ? 8 : Math.max((dia.total / maiorValor) * 100, 14),
    }))
  }, [logs])

  const totalAtividadesSemana = graficoAtividades.reduce(
    (total, dia) => total + dia.total,
    0
  )

  return (
    <div className="home-dashboard">
      <section className="home-hero">
        <div>
          <span className="home-eyebrow">Painel acadêmico</span>

          <div className="home-title-row">
            <h1>Olá, Administrador!</h1>
            <span className="home-hero-icon">
              <IconPainel />
            </span>
          </div>

          <p>
            Visão geral do SIGSAS com reservas, salas, auditoria, reportes e
            sugestões em tempo real.
          </p>
        </div>

        <button
          className="btn primary home-refresh"
          onClick={carregarResumo}
          disabled={carregando}
          type="button"
        >
          <span className="home-refresh-icon">
            <IconAtualizar />
          </span>
          {carregando ? "Atualizando..." : "Atualizar painel"}
        </button>
      </section>

      <section className="metric-grid">
        <MetricCard
          classe="card-blue"
          icone={<IconSala />}
          titulo="Total de Salas"
          valor={metricas.totalSalas}
          descricao="ambientes cadastrados"
        />

        <MetricCard
          classe="card-orange"
          icone={<IconPendente />}
          titulo="Reservas Pendentes"
          valor={metricas.reservasPendentes}
          descricao="aguardando análise"
        />

        <MetricCard
          classe="card-green"
          icone={<IconAprovada />}
          titulo="Reservas Aprovadas"
          valor={metricas.reservasAprovadas}
          descricao="confirmadas no sistema"
        />

        <MetricCard
          classe="card-red"
          icone={<IconCancelada />}
          titulo="Reservas Canceladas"
          valor={metricas.reservasCanceladas}
          descricao="cancelamentos registrados"
        />

        <MetricCard
          classe="card-yellow"
          icone={<IconProblema />}
          titulo="Problemas Reportados"
          valor={metricas.problemasAbertos}
          descricao="pendentes ou em análise"
        />

        <MetricCard
          classe="card-purple"
          icone={<IconSugestao />}
          titulo="Sugestões Recebidas"
          valor={metricas.sugestoesNovas}
          descricao="ideias para melhoria"
        />

        <MetricCard
          classe="card-cyan"
          icone={<IconLogs />}
          titulo="Logs de Hoje"
          valor={metricas.logsHoje}
          descricao="ações registradas hoje"
        />

        <MetricCard
          classe="card-emerald"
          icone={<IconUsuarios />}
          titulo="Usuários Ativos"
          valor={metricas.usuariosAtivos}
          descricao="com ações registradas"
        />
      </section>

      <section className="dashboard-panels">
        <div className="panel-card activity-panel">
          <div className="panel-header">
            <div>
              <h3>Resumo de Atividades</h3>
              <p>Movimentação dos últimos 7 dias</p>
            </div>

            <span>{totalAtividadesSemana} registros</span>
          </div>

          <div className="activity-chart-real">
            {graficoAtividades.map((dia) => (
              <div className="activity-chart-column" key={dia.chave}>
                <div className="activity-chart-value">{dia.total}</div>

                <div className="activity-chart-track">
                  <div
                    className={
                      dia.total === 0
                        ? "activity-chart-bar empty"
                        : "activity-chart-bar"
                    }
                    style={{ height: `${dia.altura}%` }}
                  />
                </div>

                <span>{dia.label}</span>
              </div>
            ))}
          </div>

          {!carregando && totalAtividadesSemana === 0 && (
            <div className="chart-empty-message">
              Nenhuma atividade registrada nos últimos 7 dias.
            </div>
          )}
        </div>

        <div className="panel-card status-panel">
          <div className="panel-header">
            <div>
              <h3>Logs por Status</h3>
              <p>Distribuição geral da auditoria</p>
            </div>
          </div>

          <div className="status-content">
            <div
              className="donut"
              style={{
                background: graficoDonut,
              }}
            >
              <div>
                <strong>{totalLogsStatus}</strong>
                <small>Total</small>
              </div>
            </div>

            <div className="status-list">
              {statusDashboard.map((item) => (
                <p key={item.chave}>
                  <span className={`dot ${item.classe}`} />
                  {item.label} <b>{calcularPorcentagem(item.valor)}%</b>
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardInicioDesktop
