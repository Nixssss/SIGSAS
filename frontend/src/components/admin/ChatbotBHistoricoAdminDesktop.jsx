import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import api from "../../services/api"

const STATUS_LABELS = {
  em_andamento: "Em andamento",
  concluida_com_reserva: "Concluída com reserva",
  finalizada_sem_reserva: "Finalizada sem reserva",
  abandonada: "Abandonada",
  erro: "Erro",
}

const STATUS_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Em andamento", value: "em_andamento" },
  { label: "Concluída com reserva", value: "concluida_com_reserva" },
  { label: "Finalizada sem reserva", value: "finalizada_sem_reserva" },
  { label: "Abandonada", value: "abandonada" },
  { label: "Erro", value: "erro" },
]

function ChatbotBHistoricoAdminDesktop({ showToast }) {
  const [conversas, setConversas] = useState([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const [detalhando, setDetalhando] = useState(false)
  const [exportandoId, setExportandoId] = useState(null)

  const [busca, setBusca] = useState("")
  const [status, setStatus] = useState("")
  const [idUsuario, setIdUsuario] = useState("")
  const [sessionId, setSessionId] = useState("")

  const [conversaSelecionada, setConversaSelecionada] = useState(null)
  const [mensagensSelecionadas, setMensagensSelecionadas] = useState([])

  useEffect(() => {
    carregarHistorico()
  }, [])

  const resumo = useMemo(() => {
    const dados = {
      totalConversas: total,
      emAndamento: 0,
      concluidas: 0,
      abandonadas: 0,
      erros: 0,
    }

    conversas.forEach((conversa) => {
      if (conversa.status === "em_andamento") dados.emAndamento += 1
      if (conversa.status === "concluida_com_reserva") dados.concluidas += 1
      if (conversa.status === "abandonada") dados.abandonadas += 1
      if (conversa.status === "erro") dados.erros += 1
    })

    return dados
  }, [conversas, total])

  function formatarData(data) {
    if (!data) return "—"

    try {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(data))
    } catch {
      return String(data)
    }
  }

  function formatarStatus(valor) {
    return STATUS_LABELS[valor] || valor || "Não informado"
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  function getIniciais(nome) {
    const partes = String(nome || "U")
      .trim()
      .split(" ")
      .filter(Boolean)

    if (partes.length === 0) return "U"
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()

    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
  }

  async function carregarHistorico() {
    setCarregando(true)

    try {
      const params = {
        limit: 100,
      }

      if (busca.trim()) params.busca = busca.trim()
      if (status) params.status = status
      if (idUsuario.trim()) params.id_usuario = idUsuario.trim()
      if (sessionId.trim()) params.session_id = sessionId.trim()

      const response = await api.get("/chatbotb-historico", { params })
      const data = response.data || {}

      setConversas(Array.isArray(data.items) ? data.items : [])
      setTotal(Number(data.total || 0))
    } catch (error) {
      console.error("Erro ao carregar histórico do chatbotb:", error)
      showToast?.("Erro ao carregar histórico do chatbotb", "erro")
    } finally {
      setCarregando(false)
    }
  }

  function limparFiltros() {
    setBusca("")
    setStatus("")
    setIdUsuario("")
    setSessionId("")

    setTimeout(() => {
      carregarHistorico()
    }, 80)
  }

  async function abrirConversa(idConversa) {
    setDetalhando(true)

    try {
      const response = await api.get(`/chatbotb-historico/${idConversa}`)
      const data = response.data || {}

      setConversaSelecionada(data.conversa || null)
      setMensagensSelecionadas(
        Array.isArray(data.mensagens) ? data.mensagens : []
      )
    } catch (error) {
      console.error("Erro ao detalhar conversa do chatbotb:", error)
      showToast?.("Erro ao abrir conversa do chatbotb", "erro")
    } finally {
      setDetalhando(false)
    }
  }

  function fecharModal() {
    setConversaSelecionada(null)
    setMensagensSelecionadas([])
  }

  async function exportarTxtConversa(idConversa) {
    setExportandoId(idConversa)

    try {
      const response = await api.get(`/chatbotb-historico/${idConversa}/txt`, {
        responseType: "blob",
      })

      const blob = new Blob([response.data], {
        type: "text/plain;charset=utf-8",
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = `chatbotb_conversa_${idConversa}.txt`
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)
      showToast?.("Histórico exportado em TXT", "sucesso")
    } catch (error) {
      console.error("Erro ao exportar TXT:", error)
      showToast?.("Erro ao exportar histórico em TXT", "erro")
    } finally {
      setExportandoId(null)
    }
  }

  async function exportarTxtUsuario(idUsuarioExportar) {
    if (!idUsuarioExportar) {
      showToast?.("Conversa sem usuário vinculado para exportar", "erro")
      return
    }

    setExportandoId(`usuario-${idUsuarioExportar}`)

    try {
      const response = await api.get(
        `/chatbotb-historico/usuario/${idUsuarioExportar}/txt`,
        {
          responseType: "blob",
        }
      )

      const blob = new Blob([response.data], {
        type: "text/plain;charset=utf-8",
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = `chatbotb_usuario_${idUsuarioExportar}.txt`
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)
      showToast?.("Histórico do usuário exportado em TXT", "sucesso")
    } catch (error) {
      console.error("Erro ao exportar TXT do usuário:", error)
      showToast?.("Erro ao exportar histórico do usuário", "erro")
    } finally {
      setExportandoId(null)
    }
  }

  function renderizarModal() {
    if (!conversaSelecionada) return null

    return createPortal(
      <div className="chatbotb-modal-overlay">
        <div className="chatbotb-modal">
          <div className="chatbotb-modal-header">
            <div>
              <span className="chatbotb-modal-kicker">
                Histórico do Assistente de Reservas
              </span>
              <h3>Conversa #{conversaSelecionada.id}</h3>
              <p>
                {conversaSelecionada.nome_usuario || "Usuário não informado"} ·{" "}
                {formatarStatus(conversaSelecionada.status)}
              </p>
            </div>

            <button
              type="button"
              className="chatbotb-modal-close"
              onClick={fecharModal}
            >
              ×
            </button>
          </div>

          <div className="chatbotb-modal-meta">
            <article>
              <span>Usuário</span>
              <strong>{conversaSelecionada.nome_usuario || "Não informado"}</strong>
            </article>

            <article>
              <span>Email</span>
              <strong>{conversaSelecionada.email_usuario || "Não informado"}</strong>
            </article>

            <article>
              <span>Perfil</span>
              <strong>{conversaSelecionada.perfil_usuario || "Não informado"}</strong>
            </article>

            <article>
              <span>Session ID</span>
              <strong title={conversaSelecionada.session_id}>
                {conversaSelecionada.session_id}
              </strong>
            </article>

            <article>
              <span>Início</span>
              <strong>{formatarData(conversaSelecionada.data_inicio)}</strong>
            </article>

            <article>
              <span>Fim</span>
              <strong>{formatarData(conversaSelecionada.data_fim)}</strong>
            </article>

            <article>
              <span>Mensagens</span>
              <strong>{conversaSelecionada.total_mensagens || 0}</strong>
            </article>

            <article>
              <span>Reserva</span>
              <strong>
                {conversaSelecionada.id_reserva_gerada
                  ? `#${conversaSelecionada.id_reserva_gerada}`
                  : "Não vinculada"}
              </strong>
            </article>
          </div>

          <div className="chatbotb-modal-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => exportarTxtConversa(conversaSelecionada.id)}
              disabled={!!exportandoId}
            >
              {exportandoId === conversaSelecionada.id
                ? "Exportando..."
                : "Exportar conversa TXT"}
            </button>

            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                exportarTxtUsuario(conversaSelecionada.id_usuario)
              }
              disabled={!!exportandoId || !conversaSelecionada.id_usuario}
            >
              {exportandoId === `usuario-${conversaSelecionada.id_usuario}`
                ? "Exportando..."
                : "Exportar usuário TXT"}
            </button>
          </div>

          <div className="chatbotb-timeline">
            {mensagensSelecionadas.map((mensagem) => (
              <div
                key={mensagem.id}
                className={`chatbotb-message ${
                  mensagem.autor === "usuario" ? "usuario" : "bot"
                }`}
              >
                <div className="chatbotb-message-avatar">
                  {mensagem.autor === "usuario" ? "U" : "S"}
                </div>

                <div className="chatbotb-message-body">
                  <div className="chatbotb-message-head">
                    <strong>
                      {mensagem.autor === "usuario" ? "Usuário" : "SIGSAS"}
                    </strong>

                    <span>{formatarData(mensagem.data_hora)}</span>
                  </div>

                  <p>{mensagem.mensagem}</p>

                  <div className="chatbotb-message-tags">
                    {mensagem.etapa && <span>{mensagem.etapa}</span>}
                    {mensagem.tipo_interacao && (
                      <span>{mensagem.tipo_interacao}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {mensagensSelecionadas.length === 0 && (
              <div className="chatbotb-empty">
                Nenhuma mensagem encontrada nesta conversa.
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    )
  }

  const conversasFiltradasLocal = useMemo(() => {
    const termo = normalizarTexto(busca)

    if (!termo) return conversas

    return conversas.filter((conversa) => {
      const texto = [
        conversa.nome_usuario,
        conversa.email_usuario,
        conversa.perfil_usuario,
        conversa.session_id,
        conversa.status,
        conversa.id,
        conversa.id_usuario,
      ].join(" ")

      return normalizarTexto(texto).includes(termo)
    })
  }, [conversas, busca])

  return (
    <div className="chatbotb-admin">
      <section className="chatbotb-hero">
        <div>
          <span className="chatbotb-kicker">Histórico do chatbotb</span>
          <h2>Histórico do Assistente de Reservas</h2>
          <p>
            Consulte conversas, acompanhe sessões dos usuários e exporte os
            registros em TXT para auditoria e rastreabilidade.
          </p>
        </div>

        <div className="chatbotb-hero-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={carregarHistorico}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </section>

      <section className="chatbotb-metrics">
        <article>
          <span>Total</span>
          <strong>{resumo.totalConversas}</strong>
          <small>conversa(s)</small>
        </article>

        <article>
          <span>Em andamento</span>
          <strong>{resumo.emAndamento}</strong>
          <small>nesta página</small>
        </article>

        <article>
          <span>Com reserva</span>
          <strong>{resumo.concluidas}</strong>
          <small>nesta página</small>
        </article>

        <article>
          <span>Abandonadas</span>
          <strong>{resumo.abandonadas}</strong>
          <small>nesta página</small>
        </article>

        <article>
          <span>Erros</span>
          <strong>{resumo.erros}</strong>
          <small>nesta página</small>
        </article>
      </section>

      <section className="chatbotb-card">
        <div className="chatbotb-filtros">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por usuário, email, perfil, sessão ou status..."
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>

          <input
            value={idUsuario}
            onChange={(e) => setIdUsuario(e.target.value)}
            placeholder="ID do usuário"
          />

          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Session ID"
          />

          <button
            type="button"
            className="btn primary"
            onClick={carregarHistorico}
            disabled={carregando}
          >
            Filtrar
          </button>

          <button
            type="button"
            className="btn secondary"
            onClick={limparFiltros}
            disabled={carregando}
          >
            Limpar
          </button>
        </div>

        <div className="chatbotb-table-wrapper">
          <table className="chatbotb-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Status</th>
                <th>Mensagens</th>
                <th>Reserva</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Sessão</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {conversasFiltradasLocal.map((conversa) => (
                <tr key={conversa.id}>
                  <td className="chatbotb-user-cell">
                    <div>
                      <span className="chatbotb-user-avatar">
                        {getIniciais(conversa.nome_usuario)}
                      </span>

                      <div>
                        <strong>
                          {conversa.nome_usuario || "Usuário não informado"}
                        </strong>
                        <small>{conversa.email_usuario || "Sem email"}</small>
                        <em>ID #{conversa.id_usuario || "—"}</em>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`chatbotb-status ${conversa.status}`}>
                      {formatarStatus(conversa.status)}
                    </span>
                  </td>

                  <td>
                    <strong>{conversa.total_mensagens || 0}</strong>
                  </td>

                  <td>
                    {conversa.id_reserva_gerada
                      ? `#${conversa.id_reserva_gerada}`
                      : "—"}
                  </td>

                  <td>{formatarData(conversa.data_inicio)}</td>

                  <td>{formatarData(conversa.data_fim)}</td>

                  <td className="chatbotb-session-cell">
                    <span title={conversa.session_id}>
                      {conversa.session_id || "—"}
                    </span>
                  </td>

                  <td>
                    <div className="chatbotb-row-actions">
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => abrirConversa(conversa.id)}
                        disabled={detalhando}
                      >
                        Ver conversa
                      </button>

                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => exportarTxtConversa(conversa.id)}
                        disabled={!!exportandoId}
                      >
                        {exportandoId === conversa.id ? "..." : "TXT"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {conversasFiltradasLocal.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="chatbotb-empty">
                      {carregando
                        ? "Carregando histórico..."
                        : "Nenhuma conversa encontrada."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {renderizarModal()}
    </div>
  )
}

export default ChatbotBHistoricoAdminDesktop
