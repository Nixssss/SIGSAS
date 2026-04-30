import { useState } from "react"

function InstituicoesAdmin({
  modoResumo = false,
  instituicoes,
  setInstituicoes,
  campi = [],
  setCampi,
  edificios = [],
  setEdificios,
  salas = [],
  setSalas,
  showToast,
}) {
  const [modalCadastro, setModalCadastro] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [nomeInst, setNomeInst] = useState("")
  const [itemSelecionado, setItemSelecionado] = useState(null)

  function abrirCadastro() {
    setNomeInst("")
    setModalCadastro(true)
  }

  function fecharCadastro() {
    setNomeInst("")
    setModalCadastro(false)
  }

  function abrirEditar() {
    setItemSelecionado(null)
    setNomeInst("")
    setModalEditar(true)
  }

  function fecharEditar() {
    setItemSelecionado(null)
    setNomeInst("")
    setModalEditar(false)
  }

  function selecionarInstituicao(item) {
    setItemSelecionado(item)
    setNomeInst(item.nome)
  }

  function addInstituicao(e) {
    e.preventDefault()

    if (!nomeInst.trim()) return

    setInstituicoes((prev) => [
      ...prev,
      {
        id: Date.now(),
        nome: nomeInst.trim(),
      },
    ])

    showToast("Instituição salva com sucesso", "sucesso")
    fecharCadastro()
  }

  function salvarEdicao(e) {
    e.preventDefault()

    if (!itemSelecionado || !nomeInst.trim()) return

    setInstituicoes((prev) =>
      prev.map((i) =>
        i.id === itemSelecionado.id ? { ...i, nome: nomeInst.trim() } : i
      )
    )

    showToast("Instituição editada com sucesso", "editado")
    setItemSelecionado(null)
    setNomeInst("")
  }

  function excluirSelecionado() {
    if (!itemSelecionado) return

    const confirmar = window.confirm(
      "Deseja excluir esta instituição? Campi, edifícios e salas vinculados também serão excluídos."
    )

    if (!confirmar) return

    const idsCampiDaInstituicao = campi
      .filter((c) => c.idInstituicao === itemSelecionado.id)
      .map((c) => c.id)

    const idsEdificiosDaInstituicao = edificios
      .filter((e) => idsCampiDaInstituicao.includes(e.idCampus))
      .map((e) => e.id)

    setInstituicoes((prev) => prev.filter((i) => i.id !== itemSelecionado.id))

    if (setCampi) {
      setCampi((prev) => prev.filter((c) => c.idInstituicao !== itemSelecionado.id))
    }

    if (setEdificios) {
      setEdificios((prev) =>
        prev.filter((e) => !idsCampiDaInstituicao.includes(e.idCampus))
      )
    }

    if (setSalas) {
      setSalas((prev) =>
        prev.filter((s) => !idsEdificiosDaInstituicao.includes(s.idEdificio))
      )
    }

    showToast("Instituição, campi, edifícios e salas excluídos", "erro")
    setItemSelecionado(null)
    setNomeInst("")
  }

  return (
    <div className="card admin-card">
      <div className="card-title-actions">
        <h3>Instituições</h3>

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

      {instituicoes.map((i) => (
        <div key={i.id} className="list-row no-button-row">
          <span>{i.nome}</span>
        </div>
      ))}

      {instituicoes.length === 0 && <p>Nenhuma instituição cadastrada.</p>}

      {modalCadastro && (
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
            <h3>Editar instituições</h3>

            <div className="modal-split">
              <div className="modal-list">
                {instituicoes.map((i) => (
                  <button
                    key={i.id}
                    className={`modal-list-item ${
                      itemSelecionado?.id === i.id ? "active" : ""
                    }`}
                    onClick={() => selecionarInstituicao(i)}
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

            <button className="btn secondary" type="button" onClick={fecharEditar}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InstituicoesAdmin