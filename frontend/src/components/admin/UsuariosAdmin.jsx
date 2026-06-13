import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import api from "../../services/api"
import SkeletonLoader from "../SkeletonLoader"

const usuarioInicial = {
  nome: "",
  email: "",
  senha: "",
  perfil: "Professor",
  matricula: "",
  cargo: "",
  idInstituicao: "",
  cursos: [],
}

const perfis = ["Administrador", "Coordenador", "Professor"]

function UsuariosAdmin({ showToast }) {
  const [usuarios, setUsuarios] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [cargos, setCargos] = useState([])
  const [cursos, setCursos] = useState([])

  const [form, setForm] = useState(usuarioInicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)

  const [busca, setBusca] = useState("")
  const [buscaCurso, setBuscaCurso] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [usuarioExcluir, setUsuarioExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    setCarregando(true)

    try {
      const [usuariosRes, instituicoesRes, cargosRes, cursosRes] =
        await Promise.all([
          api.get("/usuarios"),
          api.get("/instituicoes"),
          api.get("/cargos"),
          api.get("/cursos"),
        ])

      setUsuarios(Array.isArray(usuariosRes.data) ? usuariosRes.data : [])
      setInstituicoes(
        Array.isArray(instituicoesRes.data) ? instituicoesRes.data : []
      )
      setCargos(Array.isArray(cargosRes.data) ? cargosRes.data : [])
      setCursos(Array.isArray(cursosRes.data) ? cursosRes.data : [])
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      showToast?.("Erro ao carregar usuários", "erro")
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

  function obterClassePerfil(perfil) {
    const perfilNormalizado = normalizarTexto(perfil)

    if (
      perfilNormalizado.includes("administrador") ||
      perfilNormalizado === "admin"
    ) {
      return "administrador"
    }

    if (perfilNormalizado.includes("coordenador")) {
      return "coordenador"
    }

    if (perfilNormalizado.includes("professor")) {
      return "professor"
    }

    return "usuario"
  }

  function formatarPerfil(perfil) {
    const classe = obterClassePerfil(perfil)

    if (classe === "administrador") return "Administrador"
    if (classe === "coordenador") return "Coordenador"
    if (classe === "professor") return "Professor"

    return "Usuário"
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

  function getTotalCursosUsuario(usuario) {
    if (!Array.isArray(usuario.cursos)) return 0
    return usuario.cursos.length
  }

  function getNomeInstituicao(idInstituicao) {
    const instituicao = instituicoes.find(
      (item) => Number(item.id) === Number(idInstituicao)
    )

    return instituicao?.nome || "Sem instituição"
  }

  function getCursoDono() {
    return cursos.find((curso) => normalizarTexto(curso.nome) === "dono")
  }

  function getCursosVisiveisParaSelecao() {
    if (form.perfil === "Administrador") {
      return cursos.filter((curso) => normalizarTexto(curso.nome) === "dono")
    }

    return cursos.filter((curso) => normalizarTexto(curso.nome) !== "dono")
  }

  function getCursosFiltradosParaSelecao() {
    const cursosVisiveis = getCursosVisiveisParaSelecao()
    const termo = normalizarTexto(buscaCurso)

    if (!termo) return cursosVisiveis

    return cursosVisiveis.filter((curso) =>
      normalizarTexto(curso.nome).includes(termo)
    )
  }

  function alterarCampo(campo, valor) {
    setForm((atual) => {
      const novoForm = {
        ...atual,
        [campo]: valor,
      }

      if (campo === "perfil") {
        setBuscaCurso("")

        if (valor === "Administrador") {
          const cursoDono = getCursoDono()

          novoForm.cursos = cursoDono
            ? [
                {
                  idCurso: cursoDono.id,
                  tipoVinculo: "Administrador",
                },
              ]
            : []
        }

        if (valor === "Coordenador") {
          novoForm.cursos = []
        }

        if (valor === "Professor") {
          novoForm.cursos = []
        }
      }

      return novoForm
    })
  }

  function cursoEstaSelecionado(idCurso) {
    return form.cursos.some((curso) => Number(curso.idCurso) === Number(idCurso))
  }

  function alternarCursoProfessor(idCurso) {
    setForm((atual) => {
      const jaSelecionado = atual.cursos.some(
        (curso) => Number(curso.idCurso) === Number(idCurso)
      )

      if (jaSelecionado) {
        return {
          ...atual,
          cursos: atual.cursos.filter(
            (curso) => Number(curso.idCurso) !== Number(idCurso)
          ),
        }
      }

      return {
        ...atual,
        cursos: [
          ...atual.cursos,
          {
            idCurso: Number(idCurso),
            tipoVinculo: "Professor",
          },
        ],
      }
    })
  }

  function selecionarCursoCoordenador(idCurso) {
    setForm((atual) => ({
      ...atual,
      cursos: [
        {
          idCurso: Number(idCurso),
          tipoVinculo: "Coordenador",
        },
      ],
    }))
  }

  function abrirNovoUsuario() {
    const cursoDono = getCursoDono()

    setForm({
      ...usuarioInicial,
      perfil: "Professor",
      cursos: [],
    })

    setBuscaCurso("")
    setEditandoId(null)
    setModalAberto(true)

    if (!cursoDono && cursos.length > 0) {
      console.warn("Curso DONO não encontrado.")
    }
  }

  function fecharModal() {
    setForm(usuarioInicial)
    setBuscaCurso("")
    setEditandoId(null)
    setModalAberto(false)
  }

  function editarUsuario(usuario) {
    setEditandoId(usuario.id)

    let cursosUsuario = Array.isArray(usuario.cursos)
      ? usuario.cursos.map((curso) => ({
          idCurso: curso.idCurso,
          tipoVinculo: curso.tipoVinculo || usuario.perfil || "Professor",
        }))
      : []

    const perfilUsuario = usuario.perfil || "Professor"

    if (perfilUsuario === "Administrador" && cursosUsuario.length === 0) {
      const cursoDono = getCursoDono()

      if (cursoDono) {
        cursosUsuario = [
          {
            idCurso: cursoDono.id,
            tipoVinculo: "Administrador",
          },
        ]
      }
    }

    setForm({
      nome: usuario.nome || "",
      email: usuario.email || "",
      senha: "",
      perfil: perfilUsuario,
      matricula: usuario.matricula || "",
      cargo: usuario.cargo || "",
      idInstituicao: usuario.idInstituicao || "",
      cursos: cursosUsuario,
    })

    setBuscaCurso("")
    setModalAberto(true)
  }

  function montarTextoCursos(usuario) {
    if (!Array.isArray(usuario.cursos) || usuario.cursos.length === 0) {
      return "Sem curso"
    }

    return usuario.cursos
      .map((curso) => curso.nomeCurso || `Curso #${curso.idCurso}`)
      .join(", ")
  }

  const usuariosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca)

    if (!termo) return usuarios

    return usuarios.filter((usuario) => {
      const textoUsuario = [
        usuario.nome,
        usuario.email,
        usuario.perfil,
        usuario.matricula,
        usuario.cargo,
        usuario.instituicao,
        getNomeInstituicao(usuario.idInstituicao),
        montarTextoCursos(usuario),
      ].join(" ")

      return normalizarTexto(textoUsuario).includes(termo)
    })
  }, [usuarios, busca, instituicoes])

  function validarFormulario() {
    if (!form.nome.trim()) {
      showToast?.("Informe o nome do usuário", "erro")
      return false
    }

    if (!form.email.trim()) {
      showToast?.("Informe o e-mail do usuário", "erro")
      return false
    }

    if (!editandoId && !form.senha.trim()) {
      showToast?.("Informe uma senha inicial", "erro")
      return false
    }

    if (!perfis.includes(form.perfil)) {
      showToast?.("Selecione um perfil válido", "erro")
      return false
    }

    if (form.perfil === "Administrador") {
      return true
    }

    if (form.perfil === "Coordenador" && form.cursos.length !== 1) {
      showToast?.("Coordenador deve estar vinculado a exatamente um curso", "erro")
      return false
    }

    if (form.perfil === "Professor" && form.cursos.length === 0) {
      showToast?.("Professor deve estar vinculado a pelo menos um curso", "erro")
      return false
    }

    return true
  }

  async function salvarUsuario(e) {
    e.preventDefault()

    if (!validarFormulario()) return

    let cursosPayload = form.cursos.map((curso) => ({
      idCurso: Number(curso.idCurso),
      tipoVinculo: curso.tipoVinculo || form.perfil,
    }))

    if (form.perfil === "Administrador") {
      const cursoDono = getCursoDono()

      cursosPayload = cursoDono
        ? [
            {
              idCurso: Number(cursoDono.id),
              tipoVinculo: "Administrador",
            },
          ]
        : []
    }

    const payload = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      perfil: form.perfil,
      matricula: form.matricula.trim() || null,
      cargo: form.cargo || null,
      idInstituicao: form.idInstituicao ? Number(form.idInstituicao) : null,
      cursos: cursosPayload,
    }

    if (form.senha.trim()) {
      payload.senha = form.senha.trim()
    }

    setSalvando(true)

    try {
      if (editandoId) {
        await api.put(`/usuarios/${editandoId}`, payload)
        showToast?.("Usuário atualizado com sucesso", "sucesso")
      } else {
        await api.post("/usuarios", payload)
        showToast?.("Usuário criado com sucesso", "sucesso")
      }

      fecharModal()
      await carregarTudo()
    } catch (error) {
      console.error("Erro ao salvar usuário:", error)

      const detalhe = error?.response?.data?.detail || "Erro ao salvar usuário"

      showToast?.(detalhe, "erro")
    } finally {
      setSalvando(false)
    }
  }

  function pedirExclusaoUsuario(usuario) {
    setUsuarioExcluir(usuario)
  }

  async function confirmarExclusaoUsuario() {
    if (!usuarioExcluir) return

    setExcluindo(true)

    try {
      await api.delete(`/usuarios/${usuarioExcluir.id}`)
      showToast?.("Usuário excluído com sucesso", "excluido")
      setUsuarioExcluir(null)
      await carregarTudo()
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)

      const detalhe = error?.response?.data?.detail || "Erro ao excluir usuário"

      showToast?.(detalhe, "erro")
    } finally {
      setExcluindo(false)
    }
  }

  function renderizarBuscaCursos(totalCursos, totalFiltrados) {
    return (
      <div className="usuarios-cursos-search">
        <span className="usuarios-cursos-search-icon">🔎</span>

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

  function renderizarCursosFormulario() {
    const cursosVisiveis = getCursosVisiveisParaSelecao()
    const cursosFiltrados = getCursosFiltradosParaSelecao()

    if (form.perfil === "Administrador") {
      const cursoDono = getCursoDono()

      return (
        <div className="usuarios-cursos-box">
          <div className="usuarios-cursos-header">
            <strong>Curso / Permissão</strong>
            <small>
              Administrador possui acesso total ao sistema. O vínculo será
              definido automaticamente como DONO.
            </small>
          </div>

          <div className="usuarios-cursos-dono">
            {cursoDono ? `DONO - ${cursoDono.nome}` : "Curso DONO não encontrado"}
          </div>
        </div>
      )
    }

    if (form.perfil === "Coordenador") {
      return (
        <div className="usuarios-cursos-box">
          <div className="usuarios-cursos-header">
            <strong>Curso coordenado</strong>
            <small>
              O coordenador pode coordenar apenas um curso. Ele aprovará ou
              recusará reservas somente deste curso.
            </small>
          </div>

          {renderizarBuscaCursos(cursosVisiveis.length, cursosFiltrados.length)}

          <div className="usuarios-cursos-grid">
            {cursosFiltrados.map((curso) => (
              <label
                key={curso.id}
                className={`usuarios-curso-option ${
                  cursoEstaSelecionado(curso.id) ? "selecionado" : ""
                }`}
              >
                <input
                  type="radio"
                  name="cursoCoordenador"
                  checked={cursoEstaSelecionado(curso.id)}
                  onChange={() => selecionarCursoCoordenador(curso.id)}
                />
                <span>{curso.nome}</span>
              </label>
            ))}
          </div>

          {cursosFiltrados.length === 0 && (
            <p className="usuarios-cursos-empty">
              Nenhum curso encontrado para esta pesquisa.
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="usuarios-cursos-box">
        <div className="usuarios-cursos-header">
          <strong>Cursos em que o professor dará aula</strong>
          <small>
            Selecione um ou mais cursos. Na reserva, o professor poderá informar
            para qual curso está solicitando a sala.
          </small>
        </div>

        {renderizarBuscaCursos(cursosVisiveis.length, cursosFiltrados.length)}

        <div className="usuarios-cursos-grid">
          {cursosFiltrados.map((curso) => (
            <label
              key={curso.id}
              className={`usuarios-curso-option ${
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
          <p className="usuarios-cursos-empty">
            Nenhum curso encontrado para esta pesquisa.
          </p>
        )}
      </div>
    )
  }

  function renderizarModalUsuario() {
    if (!modalAberto) return null

    return createPortal(
      <div className="usuario-modal-overlay">
        <div className="usuario-modal">
          <div className="usuario-modal-header">
            <div>
              <h3>{editandoId ? "Editar usuário" : "Novo usuário"}</h3>
              <p>
                {editandoId
                  ? "Altere os dados cadastrados, perfil e cursos deste usuário."
                  : "Preencha os dados para criar um novo usuário."}
              </p>
            </div>

            <button
              type="button"
              className="usuario-modal-close"
              onClick={fecharModal}
            >
              ×
            </button>
          </div>

          <form className="usuarios-form usuario-modal-form" onSubmit={salvarUsuario}>
            <label>
              Nome
              <input
                value={form.nome}
                onChange={(e) => alterarCampo("nome", e.target.value)}
                placeholder="Nome completo"
              />
            </label>

            <label>
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(e) => alterarCampo("email", e.target.value)}
                placeholder="email@exemplo.com"
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={form.senha}
                onChange={(e) => alterarCampo("senha", e.target.value)}
                placeholder={
                  editandoId
                    ? "Deixe em branco para manter a senha"
                    : "Senha inicial"
                }
              />
            </label>

            <label>
              Perfil
              <select
                value={form.perfil}
                onChange={(e) => alterarCampo("perfil", e.target.value)}
              >
                {perfis.map((perfil) => (
                  <option key={perfil} value={perfil}>
                    {perfil}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Matrícula
              <input
                value={form.matricula}
                onChange={(e) => alterarCampo("matricula", e.target.value)}
                placeholder="Ex: 31645704"
              />
            </label>

            <label>
              Cargo
              <select
                value={form.cargo}
                onChange={(e) => alterarCampo("cargo", e.target.value)}
              >
                <option value="">Selecione um cargo</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id} value={cargo.nome}>
                    {cargo.nome}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Instituição
              <select
                value={form.idInstituicao}
                onChange={(e) => alterarCampo("idInstituicao", e.target.value)}
              >
                <option value="">Sem instituição</option>
                {instituicoes.map((instituicao) => (
                  <option key={instituicao.id} value={instituicao.id}>
                    {instituicao.nome}
                  </option>
                ))}
              </select>
            </label>

            {renderizarCursosFormulario()}

            <div className="usuarios-form-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={fecharModal}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button type="submit" className="btn primary" disabled={salvando}>
                {salvando
                  ? "Salvando..."
                  : editandoId
                  ? "Salvar alterações"
                  : "Criar usuário"}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )
  }

  function renderizarModalExclusao() {
    if (!usuarioExcluir) return null

    return createPortal(
      <div className="usuario-modal-overlay">
        <div className="usuario-modal usuario-delete-modal">
          <div className="usuario-modal-header">
            <div>
              <h3>Excluir usuário?</h3>
              <p>
                Tem certeza que deseja excluir o usuário "
                <strong>{usuarioExcluir.nome}</strong>"? Essa ação não poderá
                ser desfeita.
              </p>
            </div>

            <button
              type="button"
              className="usuario-modal-close"
              onClick={() => setUsuarioExcluir(null)}
              disabled={excluindo}
            >
              ×
            </button>
          </div>

          <div className="usuario-delete-body">
            <div className="usuario-delete-alert">
              <span aria-hidden="true">!</span>

              <div>
                <strong>Atenção</strong>
                <p>
                  Ao confirmar, este usuário será removido do sistema. Verifique
                  se ele não possui vínculos importantes antes de continuar.
                </p>
              </div>
            </div>

            <div className="usuario-delete-preview">
              <span
                className={`usuario-avatar perfil-${obterClassePerfil(
                  usuarioExcluir.perfil
                )}`}
                aria-hidden="true"
              >
                {getIniciais(usuarioExcluir.nome)}
              </span>

              <div>
                <strong>{usuarioExcluir.nome}</strong>
                <small>{usuarioExcluir.email || "Sem e-mail informado"}</small>
                <em>{formatarPerfil(usuarioExcluir.perfil)}</em>
              </div>
            </div>
          </div>

          <div className="usuarios-form-actions usuario-delete-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setUsuarioExcluir(null)}
              disabled={excluindo}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn danger"
              onClick={confirmarExclusaoUsuario}
              disabled={excluindo}
            >
              {excluindo ? "Excluindo..." : "Excluir usuário"}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  if (carregando) {
    return (
      <div className="usuarios-admin">
        <section className="usuarios-hero">
          <div>
            <h2>Gestão de Usuários</h2>
            <p>Carregando usuários, instituições, cargos e cursos...</p>
          </div>
        </section>

        <SkeletonLoader tipo="tabela" linhas={7} colunas={8} />
      </div>
    )
  }

  return (
    <div className="usuarios-admin">
      <section className="usuarios-hero">
        <div>
          <h2>Gestão de Usuários</h2>
          <p>Gerencie usuários, perfis e vínculos acadêmicos por curso.</p>
        </div>

        <div className="usuarios-hero-actions">
          <button
            type="button"
            className="btn secondary usuarios-refresh"
            onClick={carregarTudo}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>

          <button
            type="button"
            className="btn primary usuarios-new"
            onClick={abrirNovoUsuario}
          >
            Novo usuário
          </button>
        </div>
      </section>

      <section className="usuarios-list-card">
        <div className="usuarios-search-area">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail, matrícula, cargo, instituição ou curso..."
          />

          <span>{usuariosFiltrados.length} usuário(s)</span>
        </div>

        <div className="usuarios-table-wrapper">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Matrícula</th>
                <th>Cargo</th>
                <th>Instituição</th>
                <th>Cursos</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {usuariosFiltrados.map((usuario, indice) => (
                <tr
                  key={usuario.id}
                  className={`usuario-row ${
                    indice % 2 === 0 ? "linha-par" : "linha-impar"
                  }`}
                >
                  <td className="usuarios-nome-cell">
                    <div className="usuario-identidade">
                      <span
                        className={`usuario-avatar perfil-${obterClassePerfil(
                          usuario.perfil
                        )}`}
                        aria-hidden="true"
                      >
                        {getIniciais(usuario.nome)}
                      </span>

                      <div>
                        <strong>{usuario.nome}</strong>
                        <small>ID #{usuario.id}</small>
                      </div>
                    </div>
                  </td>

                  <td className="usuarios-email-cell">
                    <span title={usuario.email}>{usuario.email}</span>
                  </td>

                  <td className="usuarios-perfil-cell">
                    <span
                      className={`usuario-badge perfil-${obterClassePerfil(
                        usuario.perfil
                      )}`}
                    >
                      {formatarPerfil(usuario.perfil)}
                    </span>
                  </td>

                  <td className="usuarios-matricula-cell">
                    {usuario.matricula || "—"}
                  </td>

                  <td className="usuarios-cargo-cell">
                    {usuario.cargo || "—"}
                  </td>

                  <td className="usuarios-instituicao-cell">
                    <span
                      title={
                        usuario.instituicao ||
                        getNomeInstituicao(usuario.idInstituicao)
                      }
                    >
                      {usuario.instituicao ||
                        getNomeInstituicao(usuario.idInstituicao)}
                    </span>
                  </td>

                  <td className="usuarios-cursos-cell">
                    <span
                      className="usuarios-cursos-preview"
                      title={montarTextoCursos(usuario)}
                      data-cursos={montarTextoCursos(usuario)}
                    >
                      {montarTextoCursos(usuario)}
                    </span>

                    {getTotalCursosUsuario(usuario) > 0 && (
                      <small>{getTotalCursosUsuario(usuario)} curso(s)</small>
                    )}
                  </td>

                  <td className="usuarios-acoes-cell">
                    <div className="usuarios-row-actions">
                      <button
                        type="button"
                        className="btn secondary usuarios-edit-btn"
                        onClick={() => editarUsuario(usuario)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn danger usuarios-delete-btn"
                        onClick={() => pedirExclusaoUsuario(usuario)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="usuarios-empty">
                      Nenhum usuário encontrado.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {renderizarModalUsuario()}
      {renderizarModalExclusao()}
    </div>
  )
}

export default UsuariosAdmin