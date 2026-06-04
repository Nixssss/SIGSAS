import { useEffect, useMemo, useState } from "react"
import api from "../../services/api"
import ConfirmModal from "../ConfirmModal"
import SkeletonLoader from "../SkeletonLoader"

const usuarioInicial = {
  nome: "",
  email: "",
  senha: "",
  perfil: "usuario",
  matricula: "",
  cargo: "",
  idInstituicao: "",
}

function UsuariosAdmin({ showToast }) {
  const [usuarios, setUsuarios] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [cargos, setCargos] = useState([])

  const [form, setForm] = useState(usuarioInicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)

  const [busca, setBusca] = useState("")
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
      const [usuariosRes, instituicoesRes, cargosRes] = await Promise.all([
        api.get("/usuarios"),
        api.get("/instituicoes"),
        api.get("/cargos"),
      ])

      setUsuarios(Array.isArray(usuariosRes.data) ? usuariosRes.data : [])
      setInstituicoes(
        Array.isArray(instituicoesRes.data) ? instituicoesRes.data : []
      )
      setCargos(Array.isArray(cargosRes.data) ? cargosRes.data : [])
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      showToast?.("Erro ao carregar usuários", "erro")
    } finally {
      setCarregando(false)
    }
  }

  function alterarCampo(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }))
  }

  function abrirNovoUsuario() {
    setForm(usuarioInicial)
    setEditandoId(null)
    setModalAberto(true)
  }

  function fecharModal() {
    setForm(usuarioInicial)
    setEditandoId(null)
    setModalAberto(false)
  }

  function editarUsuario(usuario) {
    setEditandoId(usuario.id)

    setForm({
      nome: usuario.nome || "",
      email: usuario.email || "",
      senha: "",
      perfil: usuario.perfil || "usuario",
      matricula: usuario.matricula || "",
      cargo: usuario.cargo || "",
      idInstituicao: usuario.idInstituicao || "",
    })

    setModalAberto(true)
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  function getNomeInstituicao(idInstituicao) {
    const instituicao = instituicoes.find(
      (item) => Number(item.id) === Number(idInstituicao)
    )

    return instituicao?.nome || "Sem instituição"
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
      ].join(" ")

      return normalizarTexto(textoUsuario).includes(termo)
    })
  }, [usuarios, busca, instituicoes])

  async function salvarUsuario(e) {
    e.preventDefault()

    if (!form.nome.trim()) {
      showToast?.("Informe o nome do usuário", "erro")
      return
    }

    if (!form.email.trim()) {
      showToast?.("Informe o e-mail do usuário", "erro")
      return
    }

    if (!editandoId && !form.senha.trim()) {
      showToast?.("Informe uma senha inicial", "erro")
      return
    }

    const payload = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      perfil: form.perfil,
      matricula: form.matricula.trim() || null,
      cargo: form.cargo || null,
      idInstituicao: form.idInstituicao ? Number(form.idInstituicao) : null,
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
      showToast?.("Usuário excluído com sucesso", "sucesso")
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

  if (carregando) {
    return (
      <div className="usuarios-admin">
        <section className="usuarios-hero">
          <div>
            <h2>Gestão de Usuários</h2>
            <p>Carregando usuários, instituições e cargos...</p>
          </div>
        </section>

        <SkeletonLoader tipo="tabela" linhas={7} colunas={7} />
      </div>
    )
  }

  return (
    <div className="usuarios-admin">
      <section className="usuarios-hero">
        <div>
          <h2>Gestão de Usuários</h2>
          <p>
            Gerencie usuários cadastrados por convite ou criados manualmente
            pela administração.
          </p>
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
            placeholder="Buscar por nome, e-mail, matrícula, cargo ou instituição..."
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
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id}>
                  <td>
                    <strong>{usuario.nome}</strong>
                  </td>

                  <td>{usuario.email}</td>

                  <td>
                    <span
                      className={`usuario-badge ${normalizarTexto(
                        usuario.perfil
                      )}`}
                    >
                      {usuario.perfil}
                    </span>
                  </td>

                  <td>{usuario.matricula || "—"}</td>

                  <td>{usuario.cargo || "—"}</td>

                  <td>
                    {usuario.instituicao ||
                      getNomeInstituicao(usuario.idInstituicao)}
                  </td>

                  <td>
                    <div className="usuarios-row-actions">
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => editarUsuario(usuario)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn danger"
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
                  <td colSpan="7">
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

      {modalAberto && (
        <div className="usuario-modal-overlay">
          <div className="usuario-modal">
            <div className="usuario-modal-header">
              <div>
                <h3>{editandoId ? "Editar usuário" : "Novo usuário"}</h3>
                <p>
                  {editandoId
                    ? "Altere os dados cadastrados deste usuário."
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

            <form
              className="usuarios-form usuario-modal-form"
              onSubmit={salvarUsuario}
            >
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
                  <option value="usuario">Usuário</option>
                  <option value="admin">Administrador</option>
                  <option value="Administrador">Administrador</option>
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

              <label className="usuarios-form-full">
                Instituição
                <select
                  value={form.idInstituicao}
                  onChange={(e) =>
                    alterarCampo("idInstituicao", e.target.value)
                  }
                >
                  <option value="">Sem instituição</option>
                  {instituicoes.map((instituicao) => (
                    <option key={instituicao.id} value={instituicao.id}>
                      {instituicao.nome}
                    </option>
                  ))}
                </select>
              </label>

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
        </div>
      )}

      <ConfirmModal
        aberto={!!usuarioExcluir}
        tipo="danger"
        titulo="Excluir usuário?"
        mensagem={
          usuarioExcluir
            ? `Tem certeza que deseja excluir o usuário "${usuarioExcluir.nome}"? Essa ação não poderá ser desfeita.`
            : ""
        }
        textoCancelar="Cancelar"
        textoConfirmar="Excluir"
        carregando={excluindo}
        onCancelar={() => setUsuarioExcluir(null)}
        onConfirmar={confirmarExclusaoUsuario}
      />
    </div>
  )
}

export default UsuariosAdmin