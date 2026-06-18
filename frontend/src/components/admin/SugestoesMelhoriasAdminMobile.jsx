import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import api from "../../services/api"
import ConfirmModal from "../ConfirmModal"
import SkeletonLoader from "../SkeletonLoader"

import "../../styles/admin/SugestoesMelhoriasAdminMobile.css"

function SugestoesMelhoriasAdminMobile({ showToast }) {
  const [sugestoes, setSugestoes] = useState([])
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("")
  const [selecionada, setSelecionada] = useState(null)
  const [respostaAdmin, setRespostaAdmin] = useState("")
  const [novoStatus, setNovoStatus] = useState("")
  const [sugestaoExcluir, setSugestaoExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    carregarSugestoes()
  }, [])

  useEffect(() => {
    if (selecionada) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [selecionada])

  async function carregarSugestoes() {
    setCarregando(true)

    try {
      const response = await api.get("/sugestoes-melhorias")
      setSugestoes(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error(error)
      showToast?.("Erro ao carregar sugestões", "erro")
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

    if (texto.includes("nova")) return "nova"
    if (texto.includes("analise")) return "analise"
    if (texto.includes("aprovada")) return "aprovada"
    if (texto.includes("implementada")) return "implementada"
    if (texto.includes("recusada")) return "recusada"

    return gerarClasseFeedback(status)
  }

  function montarTextoTooltip(sugestao) {
    return [sugestao.titulo, sugestao.descricao]
      .filter(Boolean)
      .join(" — ")
  }

  function abrirDetalhes(sugestao) {
    setSelecionada(sugestao)
    setRespostaAdmin(sugestao.respostaAdmin || "")
    setNovoStatus(sugestao.status || "Nova")
  }

  function fecharDetalhes() {
    setSelecionada(null)
    setRespostaAdmin("")
    setNovoStatus("")
  }

  async function salvarAtualizacao() {
    if (!selecionada) return

    try {
      await api.put(`/sugestoes-melhorias/${selecionada.id}`, {
        status: novoStatus,
        respostaAdmin,
      })

      showToast?.("Sugestão atualizada com sucesso", "sucesso")
      fecharDetalhes()
      await carregarSugestoes()
    } catch (error) {
      console.error(error)
      showToast?.("Erro ao atualizar sugestão", "erro")
    }
  }

  function pedirExclusao(sugestao) {
    setSugestaoExcluir(sugestao)
  }

  async function confirmarExclusao() {
    if (!sugestaoExcluir) return

    setExcluindo(true)

    try {
      await api.delete(`/sugestoes-melhorias/${sugestaoExcluir.id}`)
      showToast?.("Sugestão excluída com sucesso", "sucesso")
      setSugestaoExcluir(null)
      await carregarSugestoes()
    } catch (error) {
      console.error(error)
      showToast?.("Erro ao excluir sugestão", "erro")
    } finally {
      setExcluindo(false)
    }
  }

  const sugestoesFiltradas = useMemo(() => {
    const termo = normalizarTexto(busca)

    return sugestoes.filter((sugestao) => {
      const texto = [
        sugestao.titulo,
        sugestao.descricao,
        sugestao.modulo,
        sugestao.categoria,
        sugestao.status,
        sugestao.nomeUsuario,
        sugestao.emailUsuario,
      ].join(" ")

      const passouBusca = termo ? normalizarTexto(texto).includes(termo) : true
      const passouStatus = statusFiltro ? sugestao.status === statusFiltro : true
      const passouCategoria = categoriaFiltro
        ? sugestao.categoria === categoriaFiltro
        : true

      return passouBusca && passouStatus && passouCategoria
    })
  }, [sugestoes, busca, statusFiltro, categoriaFiltro])

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

  const categorias = [
    ...new Set(sugestoes.map((sugestao) => sugestao.categoria).filter(Boolean)),
  ]

  function renderizarModalDetalhes() {
    if (!selecionada) return null

    return createPortal(
      <div className="feedback-modal-overlay" onMouseDown={fecharDetalhes}>
        <div className="feedback-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="feedback-modal-header">
            <div>
              <h3>{selecionada.titulo}</h3>
              <p>Sugestão #{selecionada.id}</p>
            </div>

            <button
              type="button"
              onClick={fecharDetalhes}
              aria-label="Fechar detalhes da sugestão"
            >
              ×
            </button>
          </div>

          <div className="feedback-modal-body">
            <div className="feedback-detail-grid">
              <p><b>Usuário:</b> {selecionada.nomeUsuario || "Não informado"}</p>
              <p><b>E-mail:</b> {selecionada.emailUsuario || "—"}</p>
              <p><b>Módulo:</b> {selecionada.modulo || "—"}</p>
              <p><b>Categoria:</b> {selecionada.categoria || "—"}</p>
              <p><b>Criado em:</b> {formatarData(selecionada.dataCriacao)}</p>
              <p><b>Atualizado em:</b> {formatarData(selecionada.dataAtualizacao)}</p>
            </div>

            <label>
              Descrição da sugestão
              <textarea value={selecionada.descricao || ""} readOnly rows={6} />
            </label>

            <label>
              Status
              <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}>
                <option value="Nova">Nova</option>
                <option value="Em análise">Em análise</option>
                <option value="Aprovada">Aprovada</option>
                <option value="Implementada">Implementada</option>
                <option value="Recusada">Recusada</option>
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
      <div className="feedback-admin feedback-page-sugestoes sugestoes-mobile-pro">
        <section className="feedback-admin-hero">
          <div>
            <h2>Sugestões de Melhorias</h2>
            <p>Carregando sugestões enviadas pelos usuários...</p>
          </div>
        </section>

        <SkeletonLoader tipo="tabela" linhas={6} colunas={7} />
      </div>
    )
  }

  return (
    <div className="feedback-admin feedback-page-sugestoes sugestoes-mobile-pro">
      <section className="feedback-admin-hero">
        <div>
          <h2>Sugestões de Melhorias</h2>
          <p>Gerencie sugestões enviadas pelos usuários do SIGSAS.</p>
        </div>

        <button className="btn secondary" onClick={carregarSugestoes}>
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
            <option value="Nova">Nova</option>
            <option value="Em análise">Em análise</option>
            <option value="Aprovada">Aprovada</option>
            <option value="Implementada">Implementada</option>
            <option value="Recusada">Recusada</option>
          </select>

          <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
            <option value="">Todas categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>

          <span>{sugestoesFiltradas.length} sugestão(ões)</span>
        </div>

        <div className="sugestoes-mobile-list">
          {sugestoesFiltradas.map((sugestao) => (
            <article key={sugestao.id} className="sugestoes-mobile-item">
              <div className="sugestoes-mobile-top">
                <div>
                  <span className="sugestoes-mobile-date">
                    {formatarData(sugestao.dataCriacao)}
                  </span>
                  <h4>{sugestao.nomeUsuario || "Não informado"}</h4>
                  <small>{sugestao.emailUsuario || "—"}</small>
                </div>
              </div>

              <h5 className="sugestoes-mobile-title" title={montarTextoTooltip(sugestao)}>
                {sugestao.titulo}
              </h5>

              <div className="sugestoes-mobile-meta">
                <span className="sugestoes-mobile-module">
                  {sugestao.modulo || "Sem módulo"}
                </span>

                <span
                  className={`feedback-badge feedback-badge-categoria categoria-${gerarClasseFeedback(
                    sugestao.categoria
                  )}`}
                >
                  {sugestao.categoria || "—"}
                </span>

                <span
                  className={`feedback-badge feedback-badge-status status-${obterClasseStatus(
                    sugestao.status
                  )}`}
                >
                  {sugestao.status || "—"}
                </span>
              </div>

              <p className="sugestoes-mobile-description">
                {sugestao.descricao || "Sem descrição informada."}
              </p>

              <div className="sugestoes-mobile-actions">
                <button
                  className="btn secondary feedback-detail-btn"
                  onClick={() => abrirDetalhes(sugestao)}
                >
                  Ver detalhes
                </button>

                <button
                  className="btn danger feedback-delete-btn"
                  onClick={() => pedirExclusao(sugestao)}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}

          {sugestoesFiltradas.length === 0 && (
            <div className="feedback-empty">Nenhuma sugestão encontrada.</div>
          )}
        </div>
      </section>

      {renderizarModalDetalhes()}

      <ConfirmModal
        aberto={!!sugestaoExcluir}
        tipo="danger"
        titulo="Excluir sugestão?"
        mensagem={
          sugestaoExcluir
            ? `Tem certeza que deseja excluir a sugestão "${sugestaoExcluir.titulo}"? Essa ação não poderá ser desfeita.`
            : ""
        }
        textoCancelar="Cancelar"
        textoConfirmar="Excluir"
        carregando={excluindo}
        onCancelar={() => setSugestaoExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </div>
  )
}

export default SugestoesMelhoriasAdminMobile
