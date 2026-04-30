import { useState } from "react"

function EdificiosAdmin({
  modoResumo = false,
  edificios,
  setEdificios,
  campi,
  salas = [],
  setSalas,
  getNomeCampus,
  showToast,
}) {
  const [modalCadastro, setModalCadastro] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)

  const [nomeEdificio, setNomeEdificio] = useState("")
  const [idCampus, setIdCampus] = useState("")
  const [itemSelecionado, setItemSelecionado] = useState(null)

  function limparFormulario() {
    setNomeEdificio("")
    setIdCampus("")
    setItemSelecionado(null)
  }

  function abrirCadastro() {
    limparFormulario()
    setModalCadastro(true)
  }

  function fecharCadastro() {
    limparFormulario()
    setModalCadastro(false)
  }

  function abrirEditar() {
    limparFormulario()
    setModalEditar(true)
  }

  function fecharEditar() {
    limparFormulario()
    setModalEditar(false)
  }

  function nomeCampus(id) {
    if (getNomeCampus) return getNomeCampus(id)
    return campi.find((c) => c.id === id)?.nome || "?"
  }

  function selecionarEdificio(item) {
    setItemSelecionado(item)
    setNomeEdificio(item.nome)
    setIdCampus(String(item.idCampus || ""))
  }

  function addEdificio(e) {
    e.preventDefault()

    if (!nomeEdificio.trim() || !idCampus) return

    setEdificios((prev) => [
      ...prev,
      {
        id: Date.now(),
        nome: nomeEdificio.trim(),
        idCampus: Number(idCampus),
      },
    ])

    showToast("Edifício salvo com sucesso", "sucesso")
    fecharCadastro()
  }

  function salvarEdicao(e) {
    e.preventDefault()

    if (!itemSelecionado || !nomeEdificio.trim() || !idCampus) return

    setEdificios((prev) =>
      prev.map((e) =>
        e.id === itemSelecionado.id
          ? {
              ...e,
              nome: nomeEdificio.trim(),
              idCampus: Number(idCampus),
            }
          : e
      )
    )

    showToast("Edifício editado com sucesso", "editado")
    limparFormulario()
  }

  function excluirSelecionado() {
    if (!itemSelecionado) return

    const confirmar = window.confirm(
      "Deseja excluir este edifício? Salas vinculadas também serão excluídas."
    )

    if (!confirmar) return

    setEdificios((prev) => prev.filter((e) => e.id !== itemSelecionado.id))

    if (setSalas) {
      setSalas((prev) => prev.filter((s) => s.idEdificio !== itemSelecionado.id))
    }

    showToast("Edifício e salas excluídos com sucesso", "erro")
    limparFormulario()
  }

  return (
    <div className="card admin-card">
      <div className="card-title-actions">
        <h3>Edifícios</h3>

        {!modoResumo && (
          <button className="btn primary" type="button" onClick={abrirCadastro}>
            Adicionar
          </button>
        )}

        {modoResumo && (
          <button className="btn edit" type="button" onClick={abrirEditar}>
            Editar
          </button>
        )}
      </div>

      {edificios.map((e) => (
        <div key={e.id} className="list-row no-button-row">
          <span>
            {e.nome}
            <br />
            <small>{nomeCampus(e.idCampus)}</small>
          </span>
        </div>
      ))}

      {edificios.length === 0 && <p>Nenhum edifício cadastrado.</p>}

      {modalCadastro && (
        <div className="popup">
          <div className="modal-box">
            <h3>Novo edifício</h3>

            <form onSubmit={addEdificio} className="form-col">
              <select
                value={idCampus}
                onChange={(e) => setIdCampus(e.target.value)}
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

              <button className="btn secondary" type="button" onClick={fecharCadastro}>
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {modalEditar && (
        <div className="popup">
          <div className="modal-box modal-large">
            <h3>Editar edifícios</h3>

            <div className="modal-split">
              <div className="modal-list">
                {edificios.map((e) => (
                  <button
                    key={e.id}
                    className={`modal-list-item ${
                      itemSelecionado?.id === e.id ? "active" : ""
                    }`}
                    onClick={() => selecionarEdificio(e)}
                    type="button"
                  >
                    {e.nome} - {nomeCampus(e.idCampus)}
                  </button>
                ))}
              </div>

              <div className="modal-editor">
                {itemSelecionado ? (
                  <form onSubmit={salvarEdicao} className="form-col">
                    <select
                      value={idCampus}
                      onChange={(e) => setIdCampus(e.target.value)}
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

            <button className="btn secondary" type="button" onClick={fecharEditar}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EdificiosAdmin