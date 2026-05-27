import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { campiService } from "../../services/adminService"

function CampiAdmin({
  modoResumo = false,
  campi = [],
  setCampi,
  instituicoes = [],
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

  useEffect(() => {
    if (modalCadastro || modalEditar) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [modalCadastro, modalEditar])

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
    if (carregando) return

    limparFormulario()
    setModalCadastro(false)
  }

  function abrirEditar() {
    limparFormulario()
    setModalEditar(true)
  }

  function fecharEditar() {
    if (carregando) return

    limparFormulario()
    setModalEditar(false)
  }

  function getIdCampus(campus) {
    return (
      campus?.id ||
      campus?.idCampus ||
      campus?.id_campus ||
      campus?.idcampus
    )
  }

  function getNomeCampus(campus) {
    return (
      campus?.nome ||
      campus?.nomeCampus ||
      campus?.nome_campus ||
      "Campus sem nome"
    )
  }

  function getIdInstituicaoCampus(campus) {
    return (
      campus?.idInstituicao ||
      campus?.id_instituicao ||
      campus?.instituicaoId ||
      campus?.instituicao_id ||
      campus?.idInstituicaoFk ||
      campus?.instituicao?.id ||
      campus?.instituicao?.idInstituicao
    )
  }

  function getIdInstituicao(instituicao) {
    return (
      instituicao?.id ||
      instituicao?.idInstituicao ||
      instituicao?.id_instituicao
    )
  }

  function getNomeInstituicaoLocal(instituicao) {
    return (
      instituicao?.nome ||
      instituicao?.nomeInstituicao ||
      instituicao?.nome_instituicao ||
      instituicao?.sigla ||
      "Instituição sem nome"
    )
  }

  function nomeInstituicao(id) {
    if (getNomeInstituicao) return getNomeInstituicao(id)

    const instituicao = instituicoes.find(
      (i) => String(getIdInstituicao(i)) === String(id)
    )

    return instituicao ? getNomeInstituicaoLocal(instituicao) : "?"
  }

  function selecionarCampus(item) {
    setItemSelecionado(item)
    setNomeCampus(getNomeCampus(item))
    setEndereco(item.endereco || "")
    setIdInstituicao(String(getIdInstituicaoCampus(item) || ""))
  }

  async function addCampus(e) {
    e.preventDefault()

    if (!nomeCampus.trim() || !idInstituicao) {
      showToast?.("Preencha o nome do campus e selecione a instituição", "erro")
      return
    }

    try {
      setCarregando(true)

      const novoCampus = await campiService.criar({
        nome: nomeCampus.trim(),
        endereco,
        idInstituicao: Number(idInstituicao),
      })

      if (setCampi) {
        setCampi((prev) => [...prev, novoCampus])
      }

      window.dispatchEvent(new Event("campi-atualizados"))

      showToast?.("Campus salvo com sucesso", "sucesso")
      fecharCadastro()
    } catch (error) {
      console.error("Erro ao salvar campus:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao salvar campus", "erro")
      }
    } finally {
      setCarregando(false)
    }
  }

  async function salvarEdicao(e) {
    e.preventDefault()

    if (!itemSelecionado || !nomeCampus.trim() || !idInstituicao) {
      showToast?.("Selecione um campus e preencha os dados", "erro")
      return
    }

    try {
      setCarregando(true)

      const idCampus = getIdCampus(itemSelecionado)

      const campusAtualizado = await campiService.atualizar(idCampus, {
        nome: nomeCampus.trim(),
        endereco,
        idInstituicao: Number(idInstituicao),
      })

      if (setCampi) {
        setCampi((prev) =>
          prev.map((c) =>
            String(getIdCampus(c)) === String(idCampus) ? campusAtualizado : c
          )
        )
      }

      window.dispatchEvent(new Event("campi-atualizados"))

      showToast?.("Campus editado com sucesso", "editado")
      limparFormulario()
    } catch (error) {
      console.error("Erro ao editar campus:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao editar campus", "erro")
      }
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

      const idCampus = getIdCampus(itemSelecionado)

      const idsEdificiosDoCampus = edificios
        .filter((e) => String(e.idCampus) === String(idCampus))
        .map((e) => e.id)

      await campiService.excluir(idCampus)

      if (setCampi) {
        setCampi((prev) =>
          prev.filter((c) => String(getIdCampus(c)) !== String(idCampus))
        )
      }

      if (setEdificios) {
        setEdificios((prev) =>
          prev.filter((e) => String(e.idCampus) !== String(idCampus))
        )
      }

      if (setSalas) {
        setSalas((prev) =>
          prev.filter((s) => !idsEdificiosDoCampus.includes(s.idEdificio))
        )
      }

      window.dispatchEvent(new Event("campi-atualizados"))

      showToast?.("Campus, edifícios e salas excluídos", "excluido")
      limparFormulario()
    } catch (error) {
      console.error("Erro ao excluir campus:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao excluir campus", "erro")
      }
    } finally {
      setCarregando(false)
    }
  }

  const modalCadastroPortal =
    modalCadastro &&
    createPortal(
      <div className="popup" onMouseDown={fecharCadastro}>
        <div className="modal-box" onMouseDown={(e) => e.stopPropagation()}>
          <h3>Novo campus</h3>

          <form onSubmit={addCampus} className="form-col">
            <select
              value={idInstituicao}
              onChange={(e) => setIdInstituicao(e.target.value)}
              required
            >
              <option value="">Selecione a instituição</option>

              {instituicoes.map((i) => {
                const idInstituicaoItem = getIdInstituicao(i)

                return (
                  <option key={idInstituicaoItem} value={idInstituicaoItem}>
                    {getNomeInstituicaoLocal(i)}
                  </option>
                )
              })}
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
      </div>,
      document.body
    )

  const modalEditarPortal =
    modalEditar &&
    createPortal(
      <div className="popup" onMouseDown={fecharEditar}>
        <div
          className="modal-box modal-large"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h3>Editar campi</h3>

          <div className="modal-split">
            <div className="modal-list">
              {campi.map((c) => {
                const idCampus = getIdCampus(c)
                const idInstituicaoCampus = getIdInstituicaoCampus(c)

                return (
                  <button
                    key={idCampus || getNomeCampus(c)}
                    className={`modal-list-item ${
                      String(getIdCampus(itemSelecionado)) === String(idCampus)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => selecionarCampus(c)}
                    type="button"
                    disabled={carregando}
                  >
                    {getNomeCampus(c)} - {nomeInstituicao(idInstituicaoCampus)}
                  </button>
                )
              })}

              {campi.length === 0 && (
                <p style={{ marginTop: "10px" }}>Nenhum campus cadastrado.</p>
              )}
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

                    {instituicoes.map((i) => {
                      const idInstituicaoItem = getIdInstituicao(i)

                      return (
                        <option key={idInstituicaoItem} value={idInstituicaoItem}>
                          {getNomeInstituicaoLocal(i)}
                        </option>
                      )
                    })}
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

                  <button
                    className="btn primary"
                    type="submit"
                    disabled={carregando}
                  >
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
      </div>,
      document.body
    )

  return (
    <>
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

        {campi.map((c) => {
          const idCampus = getIdCampus(c)
          const idInstituicaoCampus = getIdInstituicaoCampus(c)

          return (
            <div
              key={idCampus || getNomeCampus(c)}
              className="list-row no-button-row"
            >
              <span>
                <strong>{getNomeCampus(c)}</strong>
                <br />
                <small>Instituição: {nomeInstituicao(idInstituicaoCampus)}</small>
              </span>
            </div>
          )
        })}

        {campi.length === 0 && <p>Nenhum campus cadastrado.</p>}
      </div>

      {modalCadastroPortal}
      {modalEditarPortal}
    </>
  )
}

export default CampiAdmin