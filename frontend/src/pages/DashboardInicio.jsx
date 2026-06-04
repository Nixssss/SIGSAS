import { useEffect, useMemo, useState } from "react"
import api from "../services/api"

function DashboardInicio() {
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
      const status = String(log.status || "").toLowerCase()

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
          <h1>Olá, Administrador! 👋</h1>
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
          {carregando ? "Atualizando..." : "Atualizar painel"}
        </button>
      </section>

      <section className="metric-grid">
        <div className="metric-card card-blue">
          <div className="metric-icon">🏢</div>
          <div>
            <span>Total de Salas</span>
            <strong>{metricas.totalSalas}</strong>
            <small>ambientes cadastrados</small>
          </div>
        </div>

        <div className="metric-card card-orange">
          <div className="metric-icon">⏳</div>
          <div>
            <span>Reservas Pendentes</span>
            <strong>{metricas.reservasPendentes}</strong>
            <small>aguardando análise</small>
          </div>
        </div>

        <div className="metric-card card-green">
          <div className="metric-icon">✅</div>
          <div>
            <span>Reservas Aprovadas</span>
            <strong>{metricas.reservasAprovadas}</strong>
            <small>confirmadas no sistema</small>
          </div>
        </div>

        <div className="metric-card card-red">
          <div className="metric-icon">✕</div>
          <div>
            <span>Reservas Canceladas</span>
            <strong>{metricas.reservasCanceladas}</strong>
            <small>cancelamentos registrados</small>
          </div>
        </div>

        <div className="metric-card card-yellow">
          <div className="metric-icon">⚠️</div>
          <div>
            <span>Problemas Reportados</span>
            <strong>{metricas.problemasAbertos}</strong>
            <small>pendentes ou em análise</small>
          </div>
        </div>

        <div className="metric-card card-purple">
          <div className="metric-icon">💡</div>
          <div>
            <span>Sugestões Recebidas</span>
            <strong>{metricas.sugestoesNovas}</strong>
            <small>ideias para melhoria</small>
          </div>
        </div>

        <div className="metric-card card-cyan">
          <div className="metric-icon">📄</div>
          <div>
            <span>Logs de Hoje</span>
            <strong>{metricas.logsHoje}</strong>
            <small>ações registradas hoje</small>
          </div>
        </div>

        <div className="metric-card card-emerald">
          <div className="metric-icon">👥</div>
          <div>
            <span>Usuários Ativos</span>
            <strong>{metricas.usuariosAtivos}</strong>
            <small>com ações registradas</small>
          </div>
        </div>
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
                background: `conic-gradient(
                  var(--success) 0 ${calcularPorcentagem(
                    logsPorStatus.sucesso
                  )}%,
                  var(--warning) ${calcularPorcentagem(
                    logsPorStatus.sucesso
                  )}% ${
                  calcularPorcentagem(logsPorStatus.sucesso) +
                  calcularPorcentagem(logsPorStatus.iniciado)
                }%,
                  var(--danger) ${
                    calcularPorcentagem(logsPorStatus.sucesso) +
                    calcularPorcentagem(logsPorStatus.iniciado)
                  }% ${
                  calcularPorcentagem(logsPorStatus.sucesso) +
                  calcularPorcentagem(logsPorStatus.iniciado) +
                  calcularPorcentagem(logsPorStatus.erro)
                }%,
                  var(--accent) ${
                    calcularPorcentagem(logsPorStatus.sucesso) +
                    calcularPorcentagem(logsPorStatus.iniciado) +
                    calcularPorcentagem(logsPorStatus.erro)
                  }% 100%
                )`,
              }}
            >
              <div>
                <strong>{totalLogsStatus}</strong>
                <small>Total</small>
              </div>
            </div>

            <div className="status-list">
              <p>
                <span className="dot success" />
                Sucesso <b>{calcularPorcentagem(logsPorStatus.sucesso)}%</b>
              </p>

              <p>
                <span className="dot warning" />
                Iniciado <b>{calcularPorcentagem(logsPorStatus.iniciado)}%</b>
              </p>

              <p>
                <span className="dot danger" />
                Erro <b>{calcularPorcentagem(logsPorStatus.erro)}%</b>
              </p>

              <p>
                <span className="dot accent" />
                Abandono <b>{calcularPorcentagem(logsPorStatus.abandono)}%</b>
              </p>

              <p>
                <span className="dot cancelado" />
                Cancelado{" "}
                <b>{calcularPorcentagem(logsPorStatus.cancelado)}%</b>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardInicio