import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import api from "../../services/api"
import ConfirmModal from "../ConfirmModal"
import SkeletonLoader from "../SkeletonLoader"

import "../../styles/admin/ReportesProblemasAdminMobile.css"

function ReportesProblemasAdminMobile({ showToast }) {
  const [reportes, setReportes] = useState([])
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("")
  const [prioridadeFiltro, setPrioridadeFiltro] = useState("")
  const [selecionado, setSelecionado] = useState(null)
  const [respostaAdmin, setRespostaAdmin] = useState("")
  const [novoStatus, setNovoStatus] = useState("")
  const [reporteExcluir, setReporteExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    carregarReportes()
  }, [])

  useEffect(() => {
    if (selecionado) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [selecionado])

  async function carregarReportes() {
    setCarregando(true)

    try {
      const response = await api.get("/reportes-problemas")
      setReportes(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error(error)
      showToast?.("Erro ao carregar reportes", "erro")
    } finally {
      setCarregando(false)
    }
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  }

  function gerarClasseFeedback(valor) {
    const classe = normalizarTexto(valor)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    return classe || "sem-informacao"
  }

  function obterClasseStatus(status) {
    const texto = normalizarTexto(status)

    if (texto.includes("aberto")) return "aberto"
    if (texto.includes("analise")) return "analise"
    if (texto.includes("resolvido")) return "resolvido"
    if (texto.includes("recusado")) return "recusado"

    return gerarClasseFeedback(status)
  }

  function obterClassePrioridade(prioridade) {
    const texto = normalizarTexto(prioridade)

    if (texto.includes("baixa")) return "baixa"
    if (texto.includes("media")) return "media"
    if (texto.includes("alta")) return "alta"
    if (texto.includes("critica")) return "critica"

    return gerarClasseFeedback(prioridade)
  }

  function montarTextoTooltip(reporte) {
    return [reporte.titulo, reporte.descricao].filter(Boolean).join(" — ")
  }

  function abrirDetalhes(reporte) {
    setSelecionado(reporte)
    setRespostaAdmin(reporte.respostaAdmin || "")
    setNovoStatus(reporte.status || "Aberto")
  }

  function fecharDetalhes() {
    setSelecionado(null)
    setRespostaAdmin("")
    setNovoStatus("")
  }

  async function salvarAtualizacao() {
    if (!selecionado) return

    try {
      await api.put(`/reportes-problemas/${selecionado.id}`, {
        status: novoStatus,
        respostaAdmin,
      })

      showToast?.("Reporte atualizado com sucesso", "sucesso")
      fecharDetalhes()
      await carregarReportes()
    } catch (error) {
      console.error(error)
      showToast?.("Erro ao atualizar reporte", "erro")
    }
  }

  function pedirExclusao(reporte) {
    setReporteExcluir(reporte)
  }

  async function confirmarExclusao() {
    if (!reporteExcluir) return

    setExcluindo(true)

    try {
      await api.delete(`/reportes-problemas/${reporteExcluir.id}`)
      showToast?.("Reporte excluído com sucesso", "sucesso")
      setReporteExcluir(null)
      await carregarReportes()
    } catch (error) {
      console.error(error)
      showToast?.("Erro ao excluir reporte", "erro")
    } finally {
      setExcluindo(false)
    }
  }

  const reportesFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca)

    return reportes.filter((reporte) => {
      const texto = [
        reporte.titulo,
        reporte.descricao,
        reporte.modulo,
        reporte.prioridade,
        reporte.status,
        reporte.nomeUsuario,
        reporte.emailUsuario,
      ].join(" ")

      const passouBusca = termo ? normalizarTexto(texto).includes(termo) : true
      const passouStatus = statusFiltro ? reporte.status === statusFiltro : true
      const passouPrioridade = prioridadeFiltro ? reporte.prioridade === prioridadeFiltro : true

      return passouBusca && passouStatus && passouPrioridade
    })
  }, [reportes, busca, statusFiltro, prioridadeFiltro])

  function formatarData(data) {
    if (!data) return "—"

    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function renderizarModalDetalhes() {
    if (!selecionado) return null

    return createPortal(
      <div className="feedback-modal-overlay" onMouseDown={fecharDetalhes}>
        <div className="feedback-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="feedback-modal-header">
            <div>
              <h3>{selecionado.titulo}</h3>
              <p>Reporte #{selecionado.id}</p>
            </div>

            <button type="button" onClick={fecharDetalhes}>
              ×
            </button>
          </div>

          <div className="feedback-modal-body">
            <div className="feedback-detail-grid">
              <p><b>Usuário:</b> {selecionado.nomeUsuario || "Não informado"}</p>
              <p><b>E-mail:</b> {selecionado.emailUsuario || "—"}</p>
              <p><b>Módulo:</b> {selecionado.modulo || "—"}</p>
              <p><b>Prioridade:</b> {selecionado.prioridade}</p>
              <p><b>Criado em:</b> {formatarData(selecionado.dataCriacao)}</p>
              <p><b>Atualizado em:</b> {formatarData(selecionado.dataAtualizacao)}</p>
            </div>

            <label>
              Descrição do problema
              <textarea value={selecionado.descricao} readOnly rows={6} />
            </label>

            <label>
              Status
              <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}>
                <option value="Aberto">Aberto</option>
                <option value="Em análise">Em análise</option>
                <option value="Resolvido">Resolvido</option>
                <option value="Recusado">Recusado</option>
              </select>
            </label>

            <label>
              Resposta da administração
              <textarea
                value={respostaAdmin}
                onChange={(e) => setRespostaAdmin(e.target.value)}
                rows={5}
                placeholder="Informe uma resposta ou observação..."
              />
            </label>
          </div>

          <div className="feedback-modal-actions">
            <button className="btn secondary" onClick={fecharDetalhes}>
              Fechar
            </button>

            <button className="btn primary" onClick={salvarAtualizacao}>
              Salvar atualização
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  if (carregando) {
    return (
      <div className="feedback-admin feedback-page-problemas reportes-mobile-pro">
        <section className="feedback-admin-hero">
          <div>
            <h2>Reportes de Problemas</h2>
            <p>Carregando problemas enviados pelos usuários...</p>
          </div>
        </section>

        <SkeletonLoader tipo="tabela" linhas={6} colunas={7} />
      </div>
    )
  }

  return (
    <div className="feedback-admin feedback-page-problemas reportes-mobile-pro">
      <section className="feedback-admin-hero">
        <div>
          <h2>Reportes de Problemas</h2>
          <p>Gerencie problemas enviados pelos usuários do SIGSAS.</p>
        </div>

        <button className="btn secondary" onClick={carregarReportes}>
          Atualizar
        </button>
      </section>

      <section className="feedback-admin-card">
        <div className="feedback-admin-filtros">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, usuário, módulo ou descrição..."
          />

          <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em análise">Em análise</option>
            <option value="Resolvido">Resolvido</option>
            <option value="Recusado">Recusado</option>
          </select>

          <select value={prioridadeFiltro} onChange={(e) => setPrioridadeFiltro(e.target.value)}>
            <option value="">Todas prioridades</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
            <option value="Crítica">Crítica</option>
          </select>

          <span>{reportesFiltrados.length} reporte(s)</span>
        </div>

        <div className="feedback-mobile-list">
          {reportesFiltrados.map((reporte) => (
            <article key={reporte.id} className="feedback-mobile-item">
              <div className="feedback-mobile-top">
                <div>
                  <span className="feedback-mobile-date">{formatarData(reporte.dataCriacao)}</span>
                  <h4>{reporte.nomeUsuario || "Não informado"}</h4>
                  <small>{reporte.emailUsuario || "—"}</small>
                </div>
              </div>

              <h5 className="feedback-mobile-title" title={montarTextoTooltip(reporte)}>
                {reporte.titulo}
              </h5>

              <div className="feedback-mobile-meta">
                <span className="feedback-mobile-module">{reporte.modulo || "Sem módulo"}</span>
                <span className={`feedback-badge feedback-badge-prioridade prioridade-${obterClassePrioridade(reporte.prioridade)}`}>
                  {reporte.prioridade || "—"}
                </span>
                <span className={`feedback-badge feedback-badge-status status-${obterClasseStatus(reporte.status)}`}>
                  {reporte.status || "—"}
                </span>
              </div>

              <p className="feedback-mobile-description">
                {reporte.descricao || "Sem descrição informada."}
              </p>

              <div className="feedback-mobile-actions">
                <button className="btn secondary feedback-detail-btn" onClick={() => abrirDetalhes(reporte)}>
                  Ver detalhes
                </button>

                <button className="btn danger feedback-delete-btn" onClick={() => pedirExclusao(reporte)}>
                  Excluir
                </button>
              </div>
            </article>
          ))}

          {reportesFiltrados.length === 0 && (
            <div className="feedback-empty">Nenhum reporte encontrado.</div>
          )}
        </div>
      </section>

      {renderizarModalDetalhes()}

      <ConfirmModal
        aberto={!!reporteExcluir}
        tipo="danger"
        titulo="Excluir reporte?"
        mensagem={
          reporteExcluir
            ? `Tem certeza que deseja excluir o reporte "${reporteExcluir.titulo}"? Essa ação não poderá ser desfeita.`
            : ""
        }
        textoCancelar="Cancelar"
        textoConfirmar="Excluir"
        carregando={excluindo}
        onCancelar={() => setReporteExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </div>
  )
}

export default ReportesProblemasAdminMobile
