import { useState } from "react"
import { instituicoesService } from "../../services/adminService"

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
  const [carregando, setCarregando] = useState(false)

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

  async function addInstituicao(e) {
    e.preventDefault()

    if (!nomeInst.trim()) return

    try {
      setCarregando(true)

      const novaInstituicao = await instituicoesService.criar({
        nome: nomeInst.trim(),
      })

      setInstituicoes((prev) => [...prev, novaInstituicao])

      showToast("Instituição salva com sucesso", "sucesso")
      fecharCadastro()
    } catch (error) {
      console.error("Erro ao salvar instituição:", error)
      showToast("Erro ao salvar instituição", "erro")
    } finally {
      setCarregando(false)
    }
  }

  async function salvarEdicao(e) {
    e.preventDefault()

    if (!itemSelecionado || !nomeInst.trim()) return

    try {
      setCarregando(true)

      const instituicaoAtualizada = await instituicoesService.atualizar(
        itemSelecionado.id,
        {
          nome: nomeInst.trim(),
        }
      )

      setInstituicoes((prev) =>
        prev.map((i) =>
          i.id === itemSelecionado.id ? instituicaoAtualizada : i
        )
      )

      showToast("Instituição editada com sucesso", "editado")
      setItemSelecionado(null)
      setNomeInst("")
    } catch (error) {
      console.error("Erro ao editar instituição:", error)
      showToast("Erro ao editar instituição", "erro")
    } finally {
      setCarregando(false)
    }
  }

  async function excluirSelecionado() {
    if (!itemSelecionado) return

    const confirmar = window.confirm(
      "Deseja excluir esta instituição? Campi, edifícios e salas vinculados também serão excluídos."
    )

    if (!confirmar) return

    try {
      setCarregando(true)

      const idsCampiDaInstituicao = campi
        .filter((c) => c.idInstituicao === itemSelecionado.id)
        .map((c) => c.id)

      const idsEdificiosDaInstituicao = edificios
        .filter((e) => idsCampiDaInstituicao.includes(e.idCampus))
        .map((e) => e.id)

      await instituicoesService.excluir(itemSelecionado.id)

      setInstituicoes((prev) =>
        prev.filter((i) => i.id !== itemSelecionado.id)
      )

      if (setCampi) {
        setCampi((prev) =>
          prev.filter((c) => c.idInstituicao !== itemSelecionado.id)
        )
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
    } catch (error) {
      console.error("Erro ao excluir instituição:", error)
      showToast("Erro ao excluir instituição", "erro")
    } finally {
      setCarregando(false)
    }
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
                    disabled={carregando}
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
                  <p>Selecione uma instituição para editar.</p>
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

export default InstituicoesAdmin