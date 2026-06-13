import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import api from "../../services/api"
import SkeletonLoader from "../SkeletonLoader"

function AuditoriaAdmin({ showToast }) {
  const [logs, setLogs] = useState([])
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("")
  const [moduloFiltro, setModuloFiltro] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [logSelecionado, setLogSelecionado] = useState(null)

  useEffect(() => {
    carregarLogs()
  }, [])

  useEffect(() => {
    if (logSelecionado) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [logSelecionado])

  async function carregarLogs() {
    setCarregando(true)

    try {
      const response = await api.get("/auditoria")
      setLogs(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Erro ao carregar auditoria:", error)
      showToast?.("Erro ao carregar auditoria", "erro")
    } finally {
      setCarregando(false)
    }
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  function formatarData(data) {
    if (!data) return "—"

    const dataObj = new Date(data)

    return dataObj.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  function formatarDataCurta(data) {
    if (!data) return "—"

    const dataObj = new Date(data)

    return dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    })
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

  function dentroDoPeriodo(data) {
    if (!dataInicio && !dataFim) return true

    const dataLog = new Date(data)

    if (dataInicio) {
      const inicio = new Date(`${dataInicio}T00:00:00`)
      if (dataLog < inicio) return false
    }

    if (dataFim) {
      const fim = new Date(`${dataFim}T23:59:59`)
      if (dataLog > fim) return false
    }

    return true
  }

  const modulos = useMemo(() => {
    const lista = logs.map((log) => log.modulo).filter(Boolean)
    return [...new Set(lista)].sort()
  }, [logs])

  const logsFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca)

    return logs.filter((log) => {
      const texto = [
        log.nomeUsuario,
        log.emailUsuario,
        log.ipMaquina,
        log.sessionId,
        log.acao,
        log.modulo,
        log.etapa,
        log.descricao,
        log.status,
        log.erro,
      ].join(" ")

      const passouBusca = termo ? normalizarTexto(texto).includes(termo) : true
      const passouStatus = statusFiltro ? log.status === statusFiltro : true
      const passouModulo = moduloFiltro ? log.modulo === moduloFiltro : true
      const passouData = dentroDoPeriodo(log.dataHora)

      return passouBusca && passouStatus && passouModulo && passouData
    })
  }, [logs, busca, statusFiltro, moduloFiltro, dataInicio, dataFim])

  const resumo = useMemo(() => {
    return logsFiltrados.reduce(
      (acc, log) => {
        acc.total += 1
        acc[log.status] = (acc[log.status] || 0) + 1

        if (ehHoje(log.dataHora)) {
          acc.hoje += 1
        }

        if (log.status === "erro") {
          acc.errosRecentes.push(log)
        }

        if (log.status === "abandono") {
          acc.abandonosRecentes.push(log)
        }

        return acc
      },
      {
        total: 0,
        sucesso: 0,
        erro: 0,
        iniciado: 0,
        cancelado: 0,
        abandono: 0,
        hoje: 0,
        errosRecentes: [],
        abandonosRecentes: [],
      }
    )
  }, [logsFiltrados])

  const logsPorModulo = useMemo(() => {
    const mapa = {}

    logsFiltrados.forEach((log) => {
      const modulo = log.modulo || "Sem módulo"
      mapa[modulo] = (mapa[modulo] || 0) + 1
    })

    return Object.entries(mapa)
      .map(([modulo, total]) => ({ modulo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 7)
  }, [logsFiltrados])

  const logsPorDia = useMemo(() => {
    const mapa = {}

    logsFiltrados.forEach((log) => {
      const chave = formatarDataCurta(log.dataHora)
      mapa[chave] = (mapa[chave] || 0) + 1
    })

    return Object.entries(mapa)
      .map(([dia, total]) => ({ dia, total }))
      .slice(0, 8)
  }, [logsFiltrados])

  const maiorModulo = Math.max(...logsPorModulo.map((item) => item.total), 1)
  const maiorDia = Math.max(...logsPorDia.map((item) => item.total), 1)

  function porcentagem(valor) {
    if (!resumo.total) return 0
    return Math.round((valor / resumo.total) * 100)
  }

  function exportarExcel() {
    const cabecalhos = [
      "ID",
      "Data/Hora",
      "Usuário",
      "E-mail",
      "IP",
      "Sessão",
      "Ação",
      "Módulo",
      "Etapa",
      "Descrição",
      "Status",
      "Erro",
    ]

    const linhas = logsFiltrados.map((log) => [
      log.id,
      formatarData(log.dataHora),
      log.nomeUsuario || "Sistema",
      log.emailUsuario || "",
      log.ipMaquina || "",
      log.sessionId || "",
      log.acao || "",
      log.modulo || "",
      log.etapa || "",
      log.descricao || "",
      log.status || "",
      log.erro || "",
    ])

    const conteudo = [cabecalhos, ...linhas]
      .map((linha) =>
        linha
          .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n")

    const blob = new Blob(["\ufeff" + conteudo], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `auditoria-sigsas-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportarPDF() {
    const janela = window.open("", "_blank")

    if (!janela) {
      alert("Permita pop-ups para exportar o PDF.")
      return
    }

    const linhas = logsFiltrados
      .map(
        (log) => `
          <tr>
            <td>${formatarData(log.dataHora)}</td>
            <td>${log.nomeUsuario || "Sistema"}</td>
            <td>${log.ipMaquina || "—"}</td>
            <td>${log.acao}</td>
            <td>${log.modulo}</td>
            <td>${log.etapa || "—"}</td>
            <td>${log.status}</td>
            <td>${log.descricao}</td>
          </tr>
        `
      )
      .join("")

    janela.document.write(`
      <html>
        <head>
          <title>Auditoria SIGSAS</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111827;
            }

            h1 {
              margin-bottom: 4px;
            }

            p {
              color: #4b5563;
              margin-top: 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 18px;
              font-size: 12px;
            }

            th,
            td {
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }

            th {
              background: #f3f4f6;
            }
          </style>
        </head>

        <body>
          <h1>Auditoria SIGSAS</h1>
          <p>Relatório gerado em ${formatarData(new Date())}</p>

          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>IP</th>
                <th>Ação</th>
                <th>Módulo</th>
                <th>Etapa</th>
                <th>Status</th>
                <th>Descrição</th>
              </tr>
            </thead>

            <tbody>
              ${linhas}
            </tbody>
          </table>
        </body>
      </html>
    `)

    janela.document.close()
    janela.focus()
    janela.print()
  }

  function limparFiltros() {
    setBusca("")
    setStatusFiltro("")
    setModuloFiltro("")
    setDataInicio("")
    setDataFim("")
  }

  function gerarClasseSegura(valor) {
    const texto = normalizarTexto(valor)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    return texto || "sem-informacao"
  }

  function formatarRotulo(valor) {
    const texto = String(valor || "—")
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .trim()

    if (!texto || texto === "—") return "—"

    return texto
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(" ")
  }

  function obterClasseStatus(status) {
    const statusNormalizado = normalizarTexto(status)

    if (statusNormalizado.includes("sucesso")) return "sucesso"
    if (statusNormalizado.includes("erro")) return "erro"
    if (statusNormalizado.includes("abandono")) return "abandono"
    if (statusNormalizado.includes("cancelado")) return "cancelado"
    if (statusNormalizado.includes("iniciado")) return "iniciado"

    return gerarClasseSegura(status)
  }

  function obterClasseAcao(acao, status) {
    const acaoNormalizada = normalizarTexto(acao)
    const statusNormalizado = normalizarTexto(status)

    if (statusNormalizado.includes("erro") || acaoNormalizada.includes("erro")) {
      return "erro"
    }

    if (acaoNormalizada.includes("login")) {
      return "login"
    }

    if (acaoNormalizada.includes("chatbot")) {
      return "chatbot"
    }

    if (acaoNormalizada.includes("reserva")) {
      return "reservas"
    }

    if (acaoNormalizada.includes("campi") || acaoNormalizada.includes("campus")) {
      return "campi"
    }

    if (acaoNormalizada.includes("usuario")) {
      return "usuarios"
    }

    if (acaoNormalizada.includes("sala")) {
      return "salas"
    }

    return "geral"
  }

  const modalDetalhes =
    logSelecionado &&
    createPortal(
      <div
        className="monitor-modal-overlay"
        onMouseDown={() => setLogSelecionado(null)}
      >
        <div
          className="monitor-modal"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="monitor-modal-header">
            <div>
              <span>Log #{logSelecionado.id}</span>
              <h3>{logSelecionado.acao}</h3>
              <p>{formatarData(logSelecionado.dataHora)}</p>
            </div>

            <button
              type="button"
              onClick={() => setLogSelecionado(null)}
              aria-label="Fechar detalhes da auditoria"
            >
              ×
            </button>
          </div>

          <div className="monitor-modal-body">
            <div className="monitor-detail-grid">
              <p>
                <b>Usuário:</b> {logSelecionado.nomeUsuario || "Sistema"}
              </p>

              <p>
                <b>E-mail:</b> {logSelecionado.emailUsuario || "—"}
              </p>

              <p>
                <b>IP:</b> {logSelecionado.ipMaquina || "—"}
              </p>

              <p>
                <b>Sessão:</b> {logSelecionado.sessionId || "—"}
              </p>

              <p>
                <b>Módulo:</b> {logSelecionado.modulo}
              </p>

              <p>
                <b>Etapa:</b> {logSelecionado.etapa || "—"}
              </p>

              <p>
                <b>Status:</b>{" "}
                <span
                  className={`monitor-status monitor-status-${obterClasseStatus(
                    logSelecionado.status
                  )}`}
                >
                  {formatarRotulo(logSelecionado.status)}
                </span>
              </p>

              <p>
                <b>ID usuário:</b> {logSelecionado.idUsuario || "—"}
              </p>
            </div>

            <label>
              O que aconteceu
              <textarea value={logSelecionado.descricao || ""} readOnly rows={6} />
            </label>

            <label>
              Erro registrado
              <textarea
                value={logSelecionado.erro || "Sem erro registrado."}
                readOnly
                rows={5}
              />
            </label>
          </div>

          <div className="monitor-modal-actions">
            <button
              className="btn primary"
              type="button"
              onClick={() => setLogSelecionado(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>,
      document.body
    )

  if (carregando) {
    return <SkeletonLoader tipo="auditoria" />
  }

  return (
    <div className="auditoria-admin monitor-auditoria">
      <section className="monitor-hero">
        <div>
          <span>Centro de monitoramento</span>
          <h2>Auditoria do Sistema</h2>
          <p>
            Acompanhe em tempo real ações, erros, abandonos, IPs, sessões e
            eventos críticos do SIGSAS.
          </p>
        </div>

        <div className="monitor-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={carregarLogs}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>

          <button type="button" className="btn secondary" onClick={exportarExcel}>
            Exportar Excel
          </button>

          <button type="button" className="btn primary" onClick={exportarPDF}>
            Exportar PDF
          </button>
        </div>
      </section>

      <section className="monitor-stats-grid">
        <div className="monitor-stat total">
          <span>Total de logs</span>
          <strong>{resumo.total}</strong>
          <small>registros filtrados</small>
        </div>

        <div className="monitor-stat sucesso">
          <span>Sucesso</span>
          <strong>{resumo.sucesso || 0}</strong>
          <small>{porcentagem(resumo.sucesso || 0)}% dos eventos</small>
        </div>

        <div className="monitor-stat erro">
          <span>Erros</span>
          <strong>{resumo.erro || 0}</strong>
          <small>{porcentagem(resumo.erro || 0)}% dos eventos</small>
        </div>

        <div className="monitor-stat abandono">
          <span>Abandonos</span>
          <strong>{resumo.abandono || 0}</strong>
          <small>{porcentagem(resumo.abandono || 0)}% dos eventos</small>
        </div>

        <div className="monitor-stat hoje">
          <span>Logs hoje</span>
          <strong>{resumo.hoje || 0}</strong>
          <small>eventos registrados hoje</small>
        </div>
      </section>

      <section className="monitor-panels">
        <div className="monitor-panel status-monitor">
          <div className="monitor-panel-header">
            <div>
              <h3>Distribuição por status</h3>
              <p>Resumo dos eventos monitorados</p>
            </div>
          </div>

          <div className="monitor-donut-area">
            <div
              className="monitor-donut"
              style={{
                background: `conic-gradient(
                  #22c55e 0 ${porcentagem(resumo.sucesso || 0)}%,
                  #f59e0b ${porcentagem(resumo.sucesso || 0)}% ${
                  porcentagem(resumo.sucesso || 0) +
                  porcentagem(resumo.iniciado || 0)
                }%,
                  #ef4444 ${
                    porcentagem(resumo.sucesso || 0) +
                    porcentagem(resumo.iniciado || 0)
                  }% ${
                  porcentagem(resumo.sucesso || 0) +
                  porcentagem(resumo.iniciado || 0) +
                  porcentagem(resumo.erro || 0)
                }%,
                  #a855f7 ${
                    porcentagem(resumo.sucesso || 0) +
                    porcentagem(resumo.iniciado || 0) +
                    porcentagem(resumo.erro || 0)
                  }% 100%
                )`,
              }}
            >
              <div>
                <strong>{resumo.total}</strong>
                <small>Total</small>
              </div>
            </div>

            <div className="monitor-legend">
              <p>
                <i className="legend-success" />
                Sucesso <b>{resumo.sucesso || 0}</b>
              </p>

              <p>
                <i className="legend-warning" />
                Iniciado <b>{resumo.iniciado || 0}</b>
              </p>

              <p>
                <i className="legend-danger" />
                Erro <b>{resumo.erro || 0}</b>
              </p>

              <p>
                <i className="legend-accent" />
                Abandono <b>{resumo.abandono || 0}</b>
              </p>
            </div>
          </div>
        </div>

        <div className="monitor-panel modulo-monitor">
          <div className="monitor-panel-header">
            <div>
              <h3>Logs por módulo</h3>
              <p>Áreas mais movimentadas do sistema</p>
            </div>
          </div>

          <div className="module-bars">
            {logsPorModulo.map((item) => (
              <div key={item.modulo} className="module-bar-row">
                <div className="module-bar-info">
                  <span>{item.modulo}</span>
                  <strong>{item.total}</strong>
                </div>

                <div className="module-bar-track">
                  <div
                    className="module-bar-fill"
                    style={{ width: `${(item.total / maiorModulo) * 100}%` }}
                  />
                </div>
              </div>
            ))}

            {logsPorModulo.length === 0 && (
              <div className="monitor-empty">Nenhum módulo encontrado.</div>
            )}
          </div>
        </div>

        <div className="monitor-panel timeline-monitor">
          <div className="monitor-panel-header">
            <div>
              <h3>Atividade por dia</h3>
              <p>Volume de registros por período</p>
            </div>
          </div>

          <div className="timeline-bars">
            {logsPorDia.map((item) => (
              <div key={item.dia} className="timeline-item">
                <div
                  className="timeline-fill"
                  style={{
                    height: `${Math.max((item.total / maiorDia) * 100, 12)}%`,
                  }}
                />
                <span>{item.dia}</span>
              </div>
            ))}

            {logsPorDia.length === 0 && (
              <div className="monitor-empty">Nenhuma atividade encontrada.</div>
            )}
          </div>
        </div>
      </section>

      <section className="monitor-alerts-grid">
        <div className="monitor-alert-card danger">
          <div className="monitor-panel-header">
            <div>
              <h3>Erros recentes</h3>
              <p>Eventos que precisam de atenção</p>
            </div>
          </div>

          <div className="monitor-alert-list">
            {resumo.errosRecentes.slice(0, 4).map((log) => (
              <button
                key={log.id}
                className="monitor-alert-item"
                onClick={() => setLogSelecionado(log)}
              >
                <strong>{log.acao}</strong>
                <span>
                  {log.nomeUsuario || "Sistema"} • {formatarData(log.dataHora)}
                </span>
              </button>
            ))}

            {resumo.errosRecentes.length === 0 && (
              <div className="monitor-empty">Nenhum erro encontrado.</div>
            )}
          </div>
        </div>

        <div className="monitor-alert-card warning">
          <div className="monitor-panel-header">
            <div>
              <h3>Abandonos recentes</h3>
              <p>Fluxos iniciados e não finalizados</p>
            </div>
          </div>

          <div className="monitor-alert-list">
            {resumo.abandonosRecentes.slice(0, 4).map((log) => (
              <button
                key={log.id}
                className="monitor-alert-item"
                onClick={() => setLogSelecionado(log)}
              >
                <strong>{log.acao}</strong>
                <span>
                  {log.nomeUsuario || "Sistema"} • {formatarData(log.dataHora)}
                </span>
              </button>
            ))}

            {resumo.abandonosRecentes.length === 0 && (
              <div className="monitor-empty">Nenhum abandono encontrado.</div>
            )}
          </div>
        </div>
      </section>

      <section className="monitor-table-card">
        <div className="monitor-filter-grid">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por usuário, IP, sessão, ação, módulo, etapa ou erro..."
          />

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="sucesso">Sucesso</option>
            <option value="erro">Erro</option>
            <option value="iniciado">Iniciado</option>
            <option value="cancelado">Cancelado</option>
            <option value="abandono">Abandono</option>
          </select>

          <select
            value={moduloFiltro}
            onChange={(e) => setModuloFiltro(e.target.value)}
          >
            <option value="">Todos os módulos</option>
            {modulos.map((modulo) => (
              <option key={modulo} value={modulo}>
                {modulo}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <button className="btn secondary" onClick={limparFiltros}>
            Limpar filtros
          </button>
        </div>

        <div className="monitor-table-header">
          <div>
            <h3>Registros de auditoria</h3>
            <p>{logsFiltrados.length} log(s) encontrados</p>
          </div>
        </div>

        <div className="monitor-table-wrapper">
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>IP</th>
                <th>Sessão</th>
                <th>Ação</th>
                <th>Módulo</th>
                <th>Etapa</th>
                <th>Status</th>
                <th>Detalhes</th>
              </tr>
            </thead>

            <tbody>
              {logsFiltrados.map((log) => (
                <tr key={log.id}>
                  <td>{formatarData(log.dataHora)}</td>

                  <td>
                    <div className="monitor-user-cell">
                      <strong>{log.nomeUsuario || "Sistema"}</strong>
                      <small>{log.emailUsuario || "—"}</small>
                    </div>
                  </td>

                  <td>{log.ipMaquina || "—"}</td>

                  <td>
                    <span className="monitor-session">
                      {log.sessionId || "—"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`monitor-action monitor-action-${obterClasseAcao(
                        log.acao,
                        log.status
                      )}`}
                      title={log.acao || "Ação não informada"}
                    >
                      {formatarRotulo(log.acao)}
                    </span>
                  </td>

                  <td>{log.modulo}</td>

                  <td>{log.etapa || "—"}</td>

                  <td>
                    <span
                      className={`monitor-status monitor-status-${obterClasseStatus(
                        log.status
                      )}`}
                    >
                      {formatarRotulo(log.status)}
                    </span>
                  </td>

                  <td>
                    <button
                      className="btn secondary monitor-detail-btn"
                      onClick={() => setLogSelecionado(log)}
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}

              {logsFiltrados.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="monitor-empty">
                      Nenhum log encontrado.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalDetalhes}
    </div>
  )
}

export default AuditoriaAdmin