import { useEffect, useState } from "react"
import Toast from "./Toast"
import SalasAdmin from "./SalasAdmin"

function Admin() {
  const [instituicoes, setInstituicoes] = useState([])
  const [campi, setCampi] = useState([])
  const [edificios, setEdificios] = useState([])

  const [busca, setBusca] = useState("")
  const [modal, setModal] = useState(null)
  const [telaAdmin, setTelaAdmin] = useState("dashboard")

  const [nomeInst, setNomeInst] = useState("")
  const [nomeCampus, setNomeCampus] = useState("")
  const [endereco, setEndereco] = useState("")
  const [instId, setInstId] = useState("")
  const [nomeEdificio, setNomeEdificio] = useState("")
  const [campusId, setCampusId] = useState("")

  const [itemSelecionado, setItemSelecionado] = useState(null)
  const [tipoSelecionado, setTipoSelecionado] = useState("")
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    setInstituicoes(JSON.parse(localStorage.getItem("instituicoes")) || [])
    setCampi(JSON.parse(localStorage.getItem("campi")) || [])
    setEdificios(JSON.parse(localStorage.getItem("edificios")) || [])
  }, [])

  useEffect(() => {
    localStorage.setItem("instituicoes", JSON.stringify(instituicoes))
  }, [instituicoes])

  useEffect(() => {
    localStorage.setItem("campi", JSON.stringify(campi))
  }, [campi])

  useEffect(() => {
    localStorage.setItem("edificios", JSON.stringify(edificios))
  }, [edificios])

  function showToast(mensagem, tipo = "sucesso") {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, mensagem, tipo }])
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  function normalizarTexto(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  const termoBusca = normalizarTexto(busca)

  let instFiltradas = instituicoes
  let campiFiltrados = campi
  let edificiosFiltrados = edificios

  if (termoBusca) {
    const instituicoesDiretas = instituicoes.filter((i) =>
      normalizarTexto(i.nome).includes(termoBusca)
    )

    const campiDiretos = campi.filter((c) =>
      normalizarTexto(c.nome).includes(termoBusca)
    )

    const edificiosDiretos = edificios.filter((e) =>
      normalizarTexto(e.nome).includes(termoBusca)
    )

    const instituicaoIdsPorCampus = campiDiretos.map((c) => c.instituicaoId)
    const campusIdsPorEdificio = edificiosDiretos.map((e) => e.campusId)

    const campiDosEdificios = campi.filter((c) =>
      campusIdsPorEdificio.includes(c.id)
    )

    const instituicaoIdsDosCampiDosEdificios = campiDosEdificios.map(
      (c) => c.instituicaoId
    )

    const idsInstituicoes = [
      ...new Set([
        ...instituicoesDiretas.map((i) => i.id),
        ...instituicaoIdsPorCampus,
        ...instituicaoIdsDosCampiDosEdificios,
      ]),
    ]

    instFiltradas = instituicoes.filter((i) => idsInstituicoes.includes(i.id))

    const idsCampi = [
      ...new Set([
        ...campiDiretos.map((c) => c.id),
        ...campi
          .filter((c) => idsInstituicoes.includes(c.instituicaoId))
          .map((c) => c.id),
        ...campusIdsPorEdificio,
      ]),
    ]

    campiFiltrados = campi.filter((c) => idsCampi.includes(c.id))

    const idsEdificios = [
      ...new Set([
        ...edificiosDiretos.map((e) => e.id),
        ...edificios
          .filter((e) => idsCampi.includes(e.campusId))
          .map((e) => e.id),
      ]),
    ]

    edificiosFiltrados = edificios.filter((e) => idsEdificios.includes(e.id))
  }

  function limparFormulario() {
    setNomeInst("")
    setNomeCampus("")
    setEndereco("")
    setInstId("")
    setNomeEdificio("")
    setCampusId("")
    setItemSelecionado(null)
    setTipoSelecionado("")
  }

  function fecharModal() {
    setModal(null)
    limparFormulario()
  }

  function abrirModalCadastro(tipo) {
    limparFormulario()
    setModal(tipo)
  }

  function abrirModalLista(tipo) {
    setItemSelecionado(null)
    setTipoSelecionado("")
    setModal(tipo)
  }

  function selecionarItemParaEditar(item, tipo) {
    setItemSelecionado(item)
    setTipoSelecionado(tipo)

    if (tipo === "inst") {
      setNomeInst(item.nome)
    }

    if (tipo === "campus") {
      setNomeCampus(item.nome)
      setEndereco(item.endereco || "")
      setInstId(String(item.instituicaoId || ""))
    }

    if (tipo === "edificio") {
      setNomeEdificio(item.nome)
      setCampusId(String(item.campusId || ""))
    }
  }

  function addInstituicao(e) {
    e.preventDefault()

    if (!nomeInst.trim()) return

    setInstituicoes((prev) => [
      ...prev,
      {
        id: Date.now(),
        nome: nomeInst,
      },
    ])

    showToast("Instituição salva com sucesso", "sucesso")
    fecharModal()
  }

  function addCampus(e) {
    e.preventDefault()

    if (!nomeCampus.trim() || !instId) return

    setCampi((prev) => [
      ...prev,
      {
        id: Date.now(),
        nome: nomeCampus,
        endereco,
        instituicaoId: Number(instId),
      },
    ])

    showToast("Campus salvo com sucesso", "sucesso")
    fecharModal()
  }

  function addEdificio(e) {
    e.preventDefault()

    if (!nomeEdificio.trim() || !campusId) return

    setEdificios((prev) => [
      ...prev,
      {
        id: Date.now(),
        nome: nomeEdificio,
        campusId: Number(campusId),
      },
    ])

    showToast("Edifício salvo com sucesso", "sucesso")
    fecharModal()
  }

  function salvarEdicao(e) {
    e.preventDefault()

    if (!itemSelecionado || !tipoSelecionado) return

    if (tipoSelecionado === "inst") {
      setInstituicoes((prev) =>
        prev.map((i) =>
          i.id === itemSelecionado.id ? { ...i, nome: nomeInst } : i
        )
      )
      showToast("Instituição editada com sucesso", "editado")
    }

    if (tipoSelecionado === "campus") {
      setCampi((prev) =>
        prev.map((c) =>
          c.id === itemSelecionado.id
            ? {
                ...c,
                nome: nomeCampus,
                endereco,
                instituicaoId: Number(instId),
              }
            : c
        )
      )
      showToast("Campus editado com sucesso", "editado")
    }

    if (tipoSelecionado === "edificio") {
      setEdificios((prev) =>
        prev.map((e) =>
          e.id === itemSelecionado.id
            ? {
                ...e,
                nome: nomeEdificio,
                campusId: Number(campusId),
              }
            : e
        )
      )
      showToast("Edifício editado com sucesso", "editado")
    }

    limparFormulario()
  }

  function excluirSelecionado() {
    if (!itemSelecionado || !tipoSelecionado) return

    if (tipoSelecionado === "inst") {
      const confirmar = window.confirm("Deseja excluir esta instituição?")
      if (!confirmar) return

      const campiRemovidos = campi
        .filter((c) => c.instituicaoId === itemSelecionado.id)
        .map((c) => c.id)

      setInstituicoes((prev) => prev.filter((i) => i.id !== itemSelecionado.id))
      setCampi((prev) => prev.filter((c) => c.instituicaoId !== itemSelecionado.id))
      setEdificios((prev) =>
        prev.filter((e) => !campiRemovidos.includes(e.campusId))
      )

      showToast("Instituição excluída com sucesso", "erro")
    }

    if (tipoSelecionado === "campus") {
      const confirmar = window.confirm("Deseja excluir este campus?")
      if (!confirmar) return

      setCampi((prev) => prev.filter((c) => c.id !== itemSelecionado.id))
      setEdificios((prev) => prev.filter((e) => e.campusId !== itemSelecionado.id))

      showToast("Campus excluído com sucesso", "erro")
    }

    if (tipoSelecionado === "edificio") {
      const confirmar = window.confirm("Deseja excluir este edifício?")
      if (!confirmar) return

      setEdificios((prev) => prev.filter((e) => e.id !== itemSelecionado.id))
      showToast("Edifício excluído com sucesso", "erro")
    }

    limparFormulario()
  }

  function getNomeInstituicao(id) {
    return instituicoes.find((i) => i.id === id)?.nome || "?"
  }

  function getNomeCampus(id) {
    return campi.find((c) => c.id === id)?.nome || "?"
  }

  if (telaAdmin === "salas") {
    return <SalasAdmin voltar={() => setTelaAdmin("dashboard")} />
  }

  return (
    <div className="admin-page">
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            mensagem={toast.mensagem}
            tipo={toast.tipo}
            onClose={removeToast}
          />
        ))}
      </div>

      <div className="card dashboard-grid">
        <div className="dash-box">🏛 Instituições: {instituicoes.length}</div>
        <div className="dash-box">🏫 Campi: {campi.length}</div>
        <div className="dash-box">🏢 Edifícios: {edificios.length}</div>
      </div>

      <div className="card">
        <input
          placeholder="Buscar instituição, campus ou edifício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="grid-3">
        <div className="card admin-menu-card">
          <h3>Instituição</h3>
          <p>Cadastre e gerencie as instituições.</p>
          <button className="btn primary" onClick={() => abrirModalCadastro("instituicaoCadastro")}>
            Abrir
          </button>
        </div>

        <div className="card admin-menu-card">
          <h3>Campi</h3>
          <p>Cadastre e gerencie os campi vinculados às instituições.</p>
          <button className="btn primary" onClick={() => abrirModalCadastro("campusCadastro")}>
            Abrir
          </button>
        </div>

        <div className="card admin-menu-card">
          <h3>Edifício</h3>
          <p>Cadastre e gerencie os edifícios vinculados aos campi.</p>
          <button className="btn primary" onClick={() => abrirModalCadastro("edificioCadastro")}>
            Abrir
          </button>
        </div>

        <div className="card admin-menu-card">
          <h3>Salas</h3>
          <p>Cadastre e gerencie as salas vinculadas aos edifícios.</p>
          <button className="btn primary" onClick={() => setTelaAdmin("salas")}>
            Abrir
          </button>
        </div>
      </div>

      <div className="grid-3">
        <div className="card admin-card">
          <div className="card-title-actions">
            <h3>Instituições</h3>
            <button className="btn edit" onClick={() => abrirModalLista("instituicaoLista")}>
              Editar
            </button>
          </div>

          {instFiltradas.map((i) => (
            <div key={i.id} className="list-row no-button-row">
              <span>{i.nome}</span>
            </div>
          ))}
        </div>

        <div className="card admin-card">
          <div className="card-title-actions">
            <h3>Campi</h3>
            <button className="btn edit" onClick={() => abrirModalLista("campusLista")}>
              Editar
            </button>
          </div>

          {campiFiltrados.map((c) => (
            <div key={c.id} className="list-row no-button-row">
              <span>
                {c.nome}
                <br />
                <small>{getNomeInstituicao(c.instituicaoId)}</small>
              </span>
            </div>
          ))}
        </div>

        <div className="card admin-card">
          <div className="card-title-actions">
            <h3>Edifícios</h3>
            <button className="btn edit" onClick={() => abrirModalLista("edificioLista")}>
              Editar
            </button>
          </div>

          {edificiosFiltrados.map((e) => (
            <div key={e.id} className="list-row no-button-row">
              <span>
                {e.nome}
                <br />
                <small>{getNomeCampus(e.campusId)}</small>
              </span>
            </div>
          ))}
        </div>
      </div>

      {modal === "instituicaoCadastro" && (
        <div className="popup">
          <div className="modal-box">
            <h3>Nova instituição</h3>

            <form onSubmit={addInstituicao} className="form-col">
              <input
                value={nomeInst}
                onChange={(e) => setNomeInst(e.target.value)}
                placeholder="Nome da instituição"
                required
              />

              <button className="btn primary" type="submit">
                Adicionar
              </button>

              <button className="btn secondary" type="button" onClick={fecharModal}>
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {modal === "campusCadastro" && (
        <div className="popup">
          <div className="modal-box">
            <h3>Novo campus</h3>

            <form onSubmit={addCampus} className="form-col">
              <select
                value={instId}
                onChange={(e) => setInstId(e.target.value)}
                required
              >
                <option value="">Selecione a instituição</option>
                {instituicoes.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </select>

              <input
                value={nomeCampus}
                onChange={(e) => setNomeCampus(e.target.value)}
                placeholder="Nome do campus"
                required
              />

              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Endereço"
              />

              <button className="btn primary" type="submit">
                Adicionar
              </button>

              <button className="btn secondary" type="button" onClick={fecharModal}>
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {modal === "edificioCadastro" && (
        <div className="popup">
          <div className="modal-box">
            <h3>Novo edifício</h3>

            <form onSubmit={addEdificio} className="form-col">
              <select
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                required
              >
                <option value="">Selecione o campus</option>
                {campi.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>

              <input
                value={nomeEdificio}
                onChange={(e) => setNomeEdificio(e.target.value)}
                placeholder="Nome do edifício"
                required
              />

              <button className="btn primary" type="submit">
                Adicionar
              </button>

              <button className="btn secondary" type="button" onClick={fecharModal}>
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {modal === "instituicaoLista" && (
        <div className="popup">
          <div className="modal-box modal-large">
            <h3>Editar instituições</h3>

            <div className="modal-split">
              <div className="modal-list">
                {instFiltradas.map((i) => (
                  <button
                    key={i.id}
                    className={`modal-list-item ${itemSelecionado?.id === i.id ? "active" : ""}`}
                    onClick={() => selecionarItemParaEditar(i, "inst")}
                    type="button"
                  >
                    {i.nome}
                  </button>
                ))}
              </div>

              <div className="modal-editor">
                {itemSelecionado ? (
                  <form onSubmit={salvarEdicao} className="form-col">
                    <input
                      value={nomeInst}
                      onChange={(e) => setNomeInst(e.target.value)}
                      placeholder="Nome da instituição"
                      required
                    />

                    <button className="btn primary" type="submit">
                      Salvar
                    </button>

                    <button className="btn delete" type="button" onClick={excluirSelecionado}>
                      Excluir
                    </button>
                  </form>
                ) : (
                  <p>Selecione uma instituição para editar.</p>
                )}
              </div>
            </div>

            <button className="btn secondary" type="button" onClick={fecharModal}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {modal === "campusLista" && (
        <div className="popup">
          <div className="modal-box modal-large">
            <h3>Editar campi</h3>

            <div className="modal-split">
              <div className="modal-list">
                {campiFiltrados.map((c) => (
                  <button
                    key={c.id}
                    className={`modal-list-item ${itemSelecionado?.id === c.id ? "active" : ""}`}
                    onClick={() => selecionarItemParaEditar(c, "campus")}
                    type="button"
                  >
                    {c.nome} - {getNomeInstituicao(c.instituicaoId)}
                  </button>
                ))}
              </div>

              <div className="modal-editor">
                {itemSelecionado ? (
                  <form onSubmit={salvarEdicao} className="form-col">
                    <select
                      value={instId}
                      onChange={(e) => setInstId(e.target.value)}
                      required
                    >
                      <option value="">Selecione a instituição</option>
                      {instituicoes.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nome}
                        </option>
                      ))}
                    </select>

                    <input
                      value={nomeCampus}
                      onChange={(e) => setNomeCampus(e.target.value)}
                      placeholder="Nome do campus"
                      required
                    />

                    <input
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Endereço"
                    />

                    <button className="btn primary" type="submit">
                      Salvar
                    </button>

                    <button className="btn delete" type="button" onClick={excluirSelecionado}>
                      Excluir
                    </button>
                  </form>
                ) : (
                  <p>Selecione um campus para editar.</p>
                )}
              </div>
            </div>

            <button className="btn secondary" type="button" onClick={fecharModal}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {modal === "edificioLista" && (
        <div className="popup">
          <div className="modal-box modal-large">
            <h3>Editar edifícios</h3>

            <div className="modal-split">
              <div className="modal-list">
                {edificiosFiltrados.map((e) => (
                  <button
                    key={e.id}
                    className={`modal-list-item ${itemSelecionado?.id === e.id ? "active" : ""}`}
                    onClick={() => selecionarItemParaEditar(e, "edificio")}
                    type="button"
                  >
                    {e.nome} - {getNomeCampus(e.campusId)}
                  </button>
                ))}
              </div>

              <div className="modal-editor">
                {itemSelecionado ? (
                  <form onSubmit={salvarEdicao} className="form-col">
                    <select
                      value={campusId}
                      onChange={(e) => setCampusId(e.target.value)}
                      required
                    >
                      <option value="">Selecione o campus</option>
                      {campi.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>

                    <input
                      value={nomeEdificio}
                      onChange={(e) => setNomeEdificio(e.target.value)}
                      placeholder="Nome do edifício"
                      required
                    />

                    <button className="btn primary" type="submit">
                      Salvar
                    </button>

                    <button className="btn delete" type="button" onClick={excluirSelecionado}>
                      Excluir
                    </button>
                  </form>
                ) : (
                  <p>Selecione um edifício para editar.</p>
                )}
              </div>
            </div>

            <button className="btn secondary" type="button" onClick={fecharModal}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin