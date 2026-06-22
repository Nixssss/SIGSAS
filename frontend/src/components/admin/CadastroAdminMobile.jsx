import { useEffect, useState } from "react"
import api from "../../services/api"
import { convitesService } from "../../services/conviteService"

import "../../styles/admin/CadastroAdminMobile.css"
const perfis = ["Administrador", "Coordenador", "Professor"]

function CadastroAdminMobile({ showToast }) {
  const [email, setEmail] = useState("")
  const [validadeHoras, setValidadeHoras] = useState(48)
  const [perfilConvidado, setPerfilConvidado] = useState("Professor")

  const [cursos, setCursos] = useState([])
  const [cursosSelecionados, setCursosSelecionados] = useState([])
  const [buscaCurso, setBuscaCurso] = useState("")

  const [convites, setConvites] = useState([])
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    await Promise.all([carregarConvites(), carregarCursos()])
  }

  async function carregarConvites() {
    try {
      const dados = await convitesService.listar()
      setConvites(Array.isArray(dados) ? dados : [])
    } catch (error) {
      console.error("Erro ao carregar convites:", error)
      showToast?.("Erro ao carregar convites", "erro")
    }
  }

  async function carregarCursos() {
    try {
      const response = await api.get("/cursos")
      setCursos(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Erro ao carregar cursos:", error)
      showToast?.("Erro ao carregar cursos", "erro")
    }
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  function getUsuarioLogadoId() {
    const usuario = JSON.parse(localStorage.getItem("logado") || "null")
    return usuario?.id || usuario?.idUsuario || null
  }

  function getCursoDono() {
    return cursos.find((curso) => normalizarTexto(curso.nome) === "dono")
  }

  function getCursosVisiveis() {
    if (perfilConvidado === "Administrador") {
      return cursos.filter((curso) => normalizarTexto(curso.nome) === "dono")
    }

    return cursos.filter((curso) => normalizarTexto(curso.nome) !== "dono")
  }

  function getCursosFiltrados() {
    const cursosVisiveis = getCursosVisiveis()
    const termo = normalizarTexto(buscaCurso)

    if (!termo) return cursosVisiveis

    return cursosVisiveis.filter((curso) =>
      normalizarTexto(curso.nome).includes(termo)
    )
  }

  function alterarPerfil(novoPerfil) {
    setPerfilConvidado(novoPerfil)
    setBuscaCurso("")

    if (novoPerfil === "Administrador") {
      const cursoDono = getCursoDono()

      setCursosSelecionados(
        cursoDono
          ? [
              {
                idCurso: cursoDono.id,
                tipoVinculo: "Administrador",
              },
            ]
          : []
      )

      return
    }

    setCursosSelecionados([])
  }

  function cursoEstaSelecionado(idCurso) {
    return cursosSelecionados.some(
      (curso) => Number(curso.idCurso) === Number(idCurso)
    )
  }

  function alternarCursoProfessor(idCurso) {
    setCursosSelecionados((atual) => {
      const jaSelecionado = atual.some(
        (curso) => Number(curso.idCurso) === Number(idCurso)
      )

      if (jaSelecionado) {
        return atual.filter((curso) => Number(curso.idCurso) !== Number(idCurso))
      }

      return [
        ...atual,
        {
          idCurso: Number(idCurso),
          tipoVinculo: "Professor",
        },
      ]
    })
  }

  function alternarCursoCoordenador(idCurso) {
    setCursosSelecionados((atual) => {
      const jaSelecionado = atual.some(
        (curso) => Number(curso.idCurso) === Number(idCurso)
      )

      if (jaSelecionado) {
        return atual.filter((curso) => Number(curso.idCurso) !== Number(idCurso))
      }

      return [
        ...atual,
        {
          idCurso: Number(idCurso),
          tipoVinculo: "Coordenador",
        },
      ]
    })
  }

  function validarFormulario() {
    if (!email.trim()) {
      showToast?.("Informe o email do convidado", "erro")
      return false
    }

    if (!perfilConvidado) {
      showToast?.("Selecione o perfil do convidado", "erro")
      return false
    }

    if (perfilConvidado === "Administrador") {
      return true
    }

    if (perfilConvidado === "Coordenador" && cursosSelecionados.length === 0) {
      showToast?.("Coordenador deve ter pelo menos um curso", "erro")
      return false
    }

    if (perfilConvidado === "Professor" && cursosSelecionados.length === 0) {
      showToast?.("Professor deve ter pelo menos um curso", "erro")
      return false
    }

    return true
  }

  async function gerarConvite(e) {
    e.preventDefault()

    if (!validarFormulario()) return

    try {
      setCarregando(true)

      let cursosPayload = cursosSelecionados.map((curso) => ({
        idCurso: Number(curso.idCurso),
        tipoVinculo: curso.tipoVinculo || perfilConvidado,
      }))

      if (perfilConvidado === "Administrador") {
        cursosPayload = []
      }

      await convitesService.criar({
        email: email.trim().toLowerCase(),
        validadeHoras: Number(validadeHoras),
        criadoPor: getUsuarioLogadoId(),
        perfilConvidado,
        cursos: cursosPayload,
      })

      setEmail("")
      setValidadeHoras(48)
      setPerfilConvidado("Professor")
      setCursosSelecionados([])
      setBuscaCurso("")

      await carregarConvites()

      showToast?.("Convite criado e enviado por email", "sucesso")
    } catch (error) {
      console.error("Erro ao gerar/enviar convite:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao gerar ou enviar convite", "erro")
      }
    } finally {
      setCarregando(false)
    }
  }

  async function copiarLink(link) {
    try {
      await navigator.clipboard.writeText(link)
      showToast?.("Link copiado", "sucesso")
    } catch {
      showToast?.("Não foi possível copiar o link", "erro")
    }
  }

  async function reenviarConvite(convite) {
    try {
      setCarregando(true)

      await convitesService.reenviar(convite.idConvite)

      showToast?.("Convite reenviado por email", "sucesso")
    } catch (error) {
      console.error("Erro ao reenviar convite:", error)

      showToast?.(
        error?.response?.data?.detail || "Erro ao reenviar convite",
        "erro"
      )
    } finally {
      setCarregando(false)
    }
  }

  async function excluirConvite(idConvite) {
    const confirmar = window.confirm("Deseja excluir este convite?")
    if (!confirmar) return

    try {
      setCarregando(true)

      await convitesService.excluir(idConvite)
      await carregarConvites()

      showToast?.("Convite excluído", "excluido")
    } catch (error) {
      console.error("Erro ao excluir convite:", error)
      showToast?.("Erro ao excluir convite", "erro")
    } finally {
      setCarregando(false)
    }
  }

  function formatarData(data) {
    if (!data) return "Não informado"
    return new Date(data).toLocaleString("pt-BR")
  }

  function getStatusConvite(convite) {
    if (convite.usado) return "Usado"

    const agora = new Date()
    const expiracao = new Date(convite.expiraEm)

    if (expiracao < agora) return "Expirado"

    return "Ativo"
  }

  function getClasseStatusConvite(convite) {
    return normalizarTexto(getStatusConvite(convite))
  }

  function getClassePerfilConvite(perfil) {
    const texto = normalizarTexto(perfil)

    if (texto.includes("administrador")) return "administrador"
    if (texto.includes("coordenador")) return "coordenador"
    if (texto.includes("professor")) return "professor"

    return "usuario"
  }

  function montarTextoCursosConvite(convite) {
    if (!Array.isArray(convite.cursos) || convite.cursos.length === 0) {
      if (convite.perfilConvidado === "Administrador") {
        return "DONO automático"
      }

      return "Sem curso informado"
    }

    return convite.cursos
      .map((curso) => curso.nomeCurso || `Curso #${curso.idCurso}`)
      .join(", ")
  }

  function renderizarBuscaCursos(totalCursos, totalFiltrados) {
    return (
      <div className="convite-cursos-search">
        <span className="convite-cursos-search-icon"></span>

        <input
          type="text"
          value={buscaCurso}
          onChange={(e) => setBuscaCurso(e.target.value)}
          placeholder="Pesquisar curso..."
        />

        <small>
          {totalFiltrados}/{totalCursos}
        </small>
      </div>
    )
  }

  function renderizarCursosConvite() {
    const cursosVisiveis = getCursosVisiveis()
    const cursosFiltrados = getCursosFiltrados()

    if (perfilConvidado === "Administrador") {
      const cursoDono = getCursoDono()

      return (
        <div className="convite-cursos-box">
          <div className="convite-cursos-header">
            <strong>Curso / Permissão</strong>
            <small>
              Administrador possui acesso total. O vínculo será definido
              automaticamente como DONO.
            </small>
          </div>

          <div className="convite-cursos-dono">
            {cursoDono ? `DONO - ${cursoDono.nome}` : "Curso DONO não encontrado"}
          </div>
        </div>
      )
    }

    if (perfilConvidado === "Coordenador") {
      return (
        <div className="convite-cursos-box">
          <div className="convite-cursos-header">
            <strong>Cursos coordenados</strong>
            <small>
              O coordenador poderá aprovar ou recusar reservas dos cursos
              selecionados.
            </small>
          </div>

          {renderizarBuscaCursos(cursosVisiveis.length, cursosFiltrados.length)}

          <div className="convite-cursos-grid">
            {cursosFiltrados.map((curso) => (
              <label
                key={curso.id}
                className={`convite-curso-option ${
                  cursoEstaSelecionado(curso.id) ? "selecionado" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={cursoEstaSelecionado(curso.id)}
                  onChange={() => alternarCursoCoordenador(curso.id)}
                />

                <span>{curso.nome}</span>
              </label>
            ))}
          </div>

          {cursosFiltrados.length === 0 && (
            <p className="convite-cursos-empty">
              Nenhum curso encontrado para esta pesquisa.
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="convite-cursos-box">
        <div className="convite-cursos-header">
          <strong>Cursos do professor</strong>
          <small>
            Selecione um ou mais cursos. O convidado poderá confirmar esses
            cursos na tela de cadastro.
          </small>
        </div>

        {renderizarBuscaCursos(cursosVisiveis.length, cursosFiltrados.length)}

        <div className="convite-cursos-grid">
          {cursosFiltrados.map((curso) => (
            <label
              key={curso.id}
              className={`convite-curso-option ${
                cursoEstaSelecionado(curso.id) ? "selecionado" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={cursoEstaSelecionado(curso.id)}
                onChange={() => alternarCursoProfessor(curso.id)}
              />

              <span>{curso.nome}</span>
            </label>
          ))}
        </div>

        {cursosFiltrados.length === 0 && (
          <p className="convite-cursos-empty">
            Nenhum curso encontrado para esta pesquisa.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="cadastro-admin-page">
      <div className="card convite-admin-card">
        <div className="convite-admin-header">
          <div>
            <h3>Gerar convite de cadastro</h3>

            <p>
              Defina o perfil e os cursos antes de enviar o link de cadastro.
            </p>
          </div>
        </div>

        <form onSubmit={gerarConvite} className="convite-admin-form">
          <label>
            E-mail do convidado

            <input
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Validade em horas

            <input
              type="number"
              placeholder="Validade em horas"
              value={validadeHoras}
              min="1"
              onChange={(e) => setValidadeHoras(e.target.value)}
              required
            />
          </label>

          <label>
            Perfil do convidado

            <select
              value={perfilConvidado}
              onChange={(e) => alterarPerfil(e.target.value)}
            >
              {perfis.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {perfil}
                </option>
              ))}
            </select>
          </label>

          <div className="convite-admin-full">{renderizarCursosConvite()}</div>

          <button className="btn primary" type="submit" disabled={carregando}>
            {carregando ? "Enviando..." : "Gerar e enviar convite"}
          </button>
        </form>
      </div>

      <div className="card convite-list-card">
        <h3>Convites gerados</h3>

        {convites.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhum convite gerado.</p>
        )}

        {convites.map((convite, indice) => (
          <div
            key={convite.idConvite}
            className={`convite-list-row status-${getClasseStatusConvite(
              convite
            )} ${indice % 2 === 0 ? "linha-par" : "linha-impar"}`}
          >
            <div className="convite-list-info">
              <strong>{convite.email}</strong>

              <div className="convite-meta-grid">
                <small>
                  Status:{" "}
                  <span
                    className={`convite-status-badge status-${getClasseStatusConvite(
                      convite
                    )}`}
                  >
                    {getStatusConvite(convite)}
                  </span>
                </small>

                <small>
                  Perfil:{" "}
                  <span
                    className={`convite-perfil-badge perfil-${getClassePerfilConvite(
                      convite.perfilConvidado
                    )}`}
                  >
                    {convite.perfilConvidado || "Não informado"}
                  </span>
                </small>
                <small>Criado em: {formatarData(convite.criadoEm)}</small>
                <small>Expira em: {formatarData(convite.expiraEm)}</small>

                {convite.usadoEm && (
                  <small>Usado em: {formatarData(convite.usadoEm)}</small>
                )}
              </div>

              <small
                className="convite-cursos-resumo"
                title={montarTextoCursosConvite(convite)}
                data-cursos={montarTextoCursosConvite(convite)}
              >
                Cursos: {montarTextoCursosConvite(convite)}
              </small>

              <small className="convite-link-text" title={convite.linkCadastro}>
                Link: {convite.linkCadastro}
              </small>
            </div>

            <div className="convite-mobile-actions">
              <button
                className="convite-action-button convite-action-copy"
                type="button"
                onClick={() => copiarLink(convite.linkCadastro)}
                disabled={carregando}
              >
                Copiar
              </button>

              <button
                className="convite-action-button convite-action-resend"
                type="button"
                onClick={() => reenviarConvite(convite)}
                disabled={carregando || convite.usado}
              >
                Reenviar
              </button>

              <button
                className="convite-action-button convite-action-delete"
                type="button"
                onClick={() => excluirConvite(convite.idConvite)}
                disabled={carregando}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CadastroAdminMobile