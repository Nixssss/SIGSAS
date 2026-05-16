import { useState } from "react"
import { campiService } from "../../services/adminService"

function CampiAdmin({
  modoResumo = false,
  campi,
  setCampi,
  instituicoes,
  edificios = [],
  setEdificios,
  salas = [],
  setSalas,
  getNomeInstituicao,
  showToast,
}) {
  const [modalCadastro, setModalCadastro] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)

  const [nomeCampus, setNomeCampus] = useState("")
  const [endereco, setEndereco] = useState("")
  const [idInstituicao, setIdInstituicao] = useState("")
  const [itemSelecionado, setItemSelecionado] = useState(null)
  const [carregando, setCarregando] = useState(false)

  function limparFormulario() {
    setNomeCampus("")
    setEndereco("")
    setIdInstituicao("")
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

  function nomeInstituicao(id) {
    if (getNomeInstituicao) return getNomeInstituicao(id)
    return instituicoes.find((i) => i.id === id)?.nome || "?"
  }

  function selecionarCampus(item) {
    setItemSelecionado(item)
    setNomeCampus(item.nome)
    setEndereco(item.endereco || "")
    setIdInstituicao(String(item.idInstituicao || ""))
  }

  async function addCampus(e) {
    e.preventDefault()

    if (!nomeCampus.trim() || !idInstituicao) return

    try {
      setCarregando(true)

      const novoCampus = await campiService.criar({
        nome: nomeCampus.trim(),
        endereco,
        idInstituicao: Number(idInstituicao),
      })

      setCampi((prev) => [...prev, novoCampus])

      showToast("Campus salvo com sucesso", "sucesso")
      fecharCadastro()
    } catch (error) {
      console.error("Erro ao salvar campus:", error)
      showToast("Erro ao salvar campus", "erro")
    } finally {
      setCarregando(false)
    }
  }

  async function salvarEdicao(e) {
    e.preventDefault()

    if (!itemSelecionado || !nomeCampus.trim() || !idInstituicao) return

    try {
      setCarregando(true)

      const campusAtualizado = await campiService.atualizar(itemSelecionado.id, {
        nome: nomeCampus.trim(),
        endereco,
        idInstituicao: Number(idInstituicao),
      })

      setCampi((prev) =>
        prev.map((c) => (c.id === itemSelecionado.id ? campusAtualizado : c))
      )

      showToast("Campus editado com sucesso", "editado")
      limparFormulario()
    } catch (error) {
      console.error("Erro ao editar campus:", error)
      showToast("Erro ao editar campus", "erro")
    } finally {
      setCarregando(false)
    }
  }

  async function excluirSelecionado() {
    if (!itemSelecionado) return

    const confirmar = window.confirm(
      "Deseja excluir este campus? Edifícios e salas vinculados também serão excluídos."
    )

    if (!confirmar) return

    try {
      setCarregando(true)

      const idsEdificiosDoCampus = edificios
        .filter((e) => e.idCampus === itemSelecionado.id)
        .map((e) => e.id)

      await campiService.excluir(itemSelecionado.id)

      setCampi((prev) => prev.filter((c) => c.id !== itemSelecionado.id))

      if (setEdificios) {
        setEdificios((prev) => prev.filter((e) => e.idCampus !== itemSelecionado.id))
      }

      if (setSalas) {
        setSalas((prev) =>
          prev.filter((s) => !idsEdificiosDoCampus.includes(s.idEdificio))
        )
      }

      showToast("Campus, edifícios e salas excluídos", "erro")
      limparFormulario()
    } catch (error) {
      console.error("Erro ao excluir campus:", error)
      showToast("Erro ao excluir campus", "erro")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="card admin-card">
      <div className="card-title-actions">
        <h3>Campi</h3>

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

      {campi.map((c) => (
        <div key={c.id} className="list-row no-button-row">
          <span>
            {c.nome}
            <br />
            <small>{nomeInstituicao(c.idInstituicao)}</small>
          </span>
        </div>
      ))}

      {campi.length === 0 && <p>Nenhum campus cadastrado.</p>}

      {modalCadastro && (
        <div className="popup">
          <div className="modal-box">
            <h3>Novo campus</h3>

            <form onSubmit={addCampus} className="form-col">
              <select
                value={idInstituicao}
                onChange={(e) => setIdInstituicao(e.target.value)}
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

              <button className="btn primary" type="submit" disabled={carregando}>
                {carregando ? "Salvando..." : "Adicionar"}
              </button>

              <button
                className="btn secondary"
                type="button"
                onClick={fecharCadastro}
                disabled={carregando}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {modalEditar && (
        <div className="popup">
          <div className="modal-box modal-large">
            <h3>Editar campi</h3>

            <div className="modal-split">
              <div className="modal-list">
                {campi.map((c) => (
                  <button
                    key={c.id}
                    className={`modal-list-item ${
                      itemSelecionado?.id === c.id ? "active" : ""
                    }`}
                    onClick={() => selecionarCampus(c)}
                    type="button"
                    disabled={carregando}
                  >
                    {c.nome} - {nomeInstituicao(c.idInstituicao)}
                  </button>
                ))}
              </div>

              <div className="modal-editor">
                {itemSelecionado ? (
                  <form onSubmit={salvarEdicao} className="form-col">
                    <select
                      value={idInstituicao}
                      onChange={(e) => setIdInstituicao(e.target.value)}
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

                    <button className="btn primary" type="submit" disabled={carregando}>
                      {carregando ? "Salvando..." : "Salvar"}
                    </button>

                    <button
                      className="btn delete"
                      type="button"
                      onClick={excluirSelecionado}
                      disabled={carregando}
                    >
                      {carregando ? "Excluindo..." : "Excluir"}
                    </button>
                  </form>
                ) : (
                  <p>Selecione um campus para editar.</p>
                )}
              </div>
            </div>

            <button
              className="btn secondary"
              type="button"
              onClick={fecharEditar}
              disabled={carregando}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CampiAdmin