import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  edificiosService,
  campiService,
} from "../../services/adminService"

function EdificiosAdmin({
  modoResumo = false,
  edificios = [],
  setEdificios,
  campi = [],
  setCampi,
  salas = [],
  setSalas,
  getNomeCampus,
  showToast,
}) {
  const [listaEdificios, setListaEdificios] = useState(edificios)
  const [listaCampi, setListaCampi] = useState(campi)

  const [modalCadastro, setModalCadastro] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)

  const [nomeEdificio, setNomeEdificio] = useState("")
  const [idCampus, setIdCampus] = useState("")
  const [itemSelecionado, setItemSelecionado] = useState(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    setListaEdificios(Array.isArray(edificios) ? edificios : [])
  }, [edificios])

  useEffect(() => {
    setListaCampi(Array.isArray(campi) ? campi : [])
  }, [campi])

  useEffect(() => {
    carregarDados()

    function atualizarEdificios() {
      carregarDados()
    }

    window.addEventListener("focus", atualizarEdificios)
    window.addEventListener("edificios-atualizados", atualizarEdificios)
    window.addEventListener("campi-atualizados", atualizarEdificios)

    return () => {
      window.removeEventListener("focus", atualizarEdificios)
      window.removeEventListener("edificios-atualizados", atualizarEdificios)
      window.removeEventListener("campi-atualizados", atualizarEdificios)
    }
  }, [])

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

  function extrairLista(response, chave) {
    if (Array.isArray(response)) return response
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.dados)) return response.dados
    if (Array.isArray(response?.items)) return response.items
    if (Array.isArray(response?.results)) return response.results
    if (Array.isArray(response?.[chave])) return response[chave]

    return []
  }

  async function carregarDados() {
    try {
      setCarregando(true)

      const [edificiosResponse, campiResponse] = await Promise.all([
        edificiosService.listar(),
        campiService.listar(),
      ])

      const edificiosApi = extrairLista(edificiosResponse, "edificios")
      const campiApi = extrairLista(campiResponse, "campi")

      setListaEdificios(edificiosApi)
      setListaCampi(campiApi)

      if (setEdificios) {
        setEdificios(edificiosApi)
      }

      if (setCampi) {
        setCampi(campiApi)
      }
    } catch (error) {
      console.error("Erro ao carregar edifícios:", error)
      showToast?.("Erro ao carregar edifícios", "erro")
    } finally {
      setCarregando(false)
    }
  }

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

  function getIdEdificio(edificio) {
    return (
      edificio?.id ||
      edificio?.idEdificio ||
      edificio?.id_edificio ||
      edificio?.idedificio
    )
  }

  function getNomeEdificio(edificio) {
    return (
      edificio?.nome ||
      edificio?.nomeEdificio ||
      edificio?.nome_edificio ||
      "Edifício sem nome"
    )
  }

  function getIdCampusEdificio(edificio) {
    return (
      edificio?.idCampus ||
      edificio?.id_campus ||
      edificio?.campusId ||
      edificio?.campus_id ||
      edificio?.idCampusFk ||
      edificio?.campus?.id ||
      edificio?.campus?.idCampus
    )
  }

  function getIdCampusLocal(campus) {
    return campus?.id || campus?.idCampus || campus?.id_campus || campus?.idcampus
  }

  function getNomeCampusLocal(campus) {
    return (
      campus?.nome ||
      campus?.nomeCampus ||
      campus?.nome_campus ||
      "Campus sem nome"
    )
  }

  function nomeCampus(id) {
    if (getNomeCampus) return getNomeCampus(id)

    const campus = listaCampi.find(
      (item) => String(getIdCampusLocal(item)) === String(id)
    )

    return campus ? getNomeCampusLocal(campus) : "Campus não informado"
  }

  function selecionarEdificio(item) {
    setItemSelecionado(item)
    setNomeEdificio(getNomeEdificio(item))
    setIdCampus(String(getIdCampusEdificio(item) || ""))
  }

  async function adicionarEdificio(e) {
    e.preventDefault()

    if (!nomeEdificio.trim() || !idCampus) {
      showToast?.("Informe o nome do edifício e selecione o campus", "erro")
      return
    }

    try {
      setCarregando(true)

      await edificiosService.criar({
        nome: nomeEdificio.trim(),
        idCampus: Number(idCampus),
      })

      await carregarDados()

      window.dispatchEvent(new Event("edificios-atualizados"))

      showToast?.("Edifício cadastrado com sucesso", "sucesso")
      fecharCadastro()
    } catch (error) {
      console.error("Erro ao cadastrar edifício:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao cadastrar edifício", "erro")
      }
    } finally {
      setCarregando(false)
    }
  }

  async function salvarEdicao(e) {
    e.preventDefault()

    if (!itemSelecionado || !nomeEdificio.trim() || !idCampus) {
      showToast?.("Selecione um edifício e preencha os dados", "erro")
      return
    }

    try {
      setCarregando(true)

      const idEdificio = getIdEdificio(itemSelecionado)

      await edificiosService.atualizar(idEdificio, {
        nome: nomeEdificio.trim(),
        idCampus: Number(idCampus),
      })

      await carregarDados()

      window.dispatchEvent(new Event("edificios-atualizados"))

      showToast?.("Edifício editado com sucesso", "editado")
      limparFormulario()
    } catch (error) {
      console.error("Erro ao editar edifício:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao editar edifício", "erro")
      }
    } finally {
      setCarregando(false)
    }
  }

  async function excluirSelecionado() {
    if (!itemSelecionado) return

    const confirmar = window.confirm(
      "Deseja excluir este edifício? Salas vinculadas também poderão ser afetadas."
    )

    if (!confirmar) return

    try {
      setCarregando(true)

      const idEdificio = getIdEdificio(itemSelecionado)

      await edificiosService.excluir(idEdificio)

      await carregarDados()

      if (setSalas) {
        setSalas((prev) =>
          prev.filter(
            (sala) =>
              String(sala.idEdificio || sala.id_edificio) !== String(idEdificio)
          )
        )
      }

      window.dispatchEvent(new Event("edificios-atualizados"))
      window.dispatchEvent(new Event("salas-atualizadas"))

      showToast?.("Edifício excluído com sucesso", "excluido")
      limparFormulario()
    } catch (error) {
      console.error("Erro ao excluir edifício:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao excluir edifício", "erro")
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
          <h3>Novo edifício</h3>

          <form onSubmit={adicionarEdificio} className="form-col">
            <select
              value={idCampus}
              onChange={(e) => setIdCampus(e.target.value)}
              required
            >
              <option value="">Selecione o campus</option>

              {listaCampi.map((campus) => {
                const idCampusItem = getIdCampusLocal(campus)

                return (
                  <option key={idCampusItem} value={idCampusItem}>
                    {getNomeCampusLocal(campus)}
                  </option>
                )
              })}
            </select>

            <input
              value={nomeEdificio}
              onChange={(e) => setNomeEdificio(e.target.value)}
              placeholder="Nome do edifício"
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
          <h3>Editar edifícios</h3>

          <div className="modal-split">
            <div className="modal-list">
              {listaEdificios.map((edificio) => {
                const idEdificio = getIdEdificio(edificio)
                const idCampusEdificio = getIdCampusEdificio(edificio)

                return (
                  <button
                    key={idEdificio || getNomeEdificio(edificio)}
                    className={`modal-list-item ${
                      String(getIdEdificio(itemSelecionado)) ===
                      String(idEdificio)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => selecionarEdificio(edificio)}
                    type="button"
                    disabled={carregando}
                  >
                    {getNomeEdificio(edificio)} - {nomeCampus(idCampusEdificio)}
                  </button>
                )
              })}

              {listaEdificios.length === 0 && (
                <p style={{ marginTop: "10px" }}>
                  Nenhum edifício cadastrado.
                </p>
              )}
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

                    {listaCampi.map((campus) => {
                      const idCampusItem = getIdCampusLocal(campus)

                      return (
                        <option key={idCampusItem} value={idCampusItem}>
                          {getNomeCampusLocal(campus)}
                        </option>
                      )
                    })}
                  </select>

                  <input
                    value={nomeEdificio}
                    onChange={(e) => setNomeEdificio(e.target.value)}
                    placeholder="Nome do edifício"
                    required
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
                <p>Selecione um edifício para editar.</p>
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
          <h3>Edifícios</h3>

          {!modoResumo && (
            <button
              className="btn primary"
              type="button"
              onClick={abrirCadastro}
            >
              Adicionar
            </button>
          )}

          {modoResumo && (
            <button className="btn edit" type="button" onClick={abrirEditar}>
              Editar
            </button>
          )}
        </div>

        {carregando && listaEdificios.length === 0 && (
          <p>Carregando edifícios...</p>
        )}

        {listaEdificios.map((edificio) => {
          const idEdificio = getIdEdificio(edificio)
          const idCampusEdificio = getIdCampusEdificio(edificio)

          return (
            <div
              key={idEdificio || getNomeEdificio(edificio)}
              className="list-row no-button-row"
            >
              <span>
                <strong>{getNomeEdificio(edificio)}</strong>
                <br />
                <small>Campus: {nomeCampus(idCampusEdificio)}</small>
              </span>
            </div>
          )
        })}

        {!carregando && listaEdificios.length === 0 && (
          <p>Nenhum edifício cadastrado.</p>
        )}
      </div>

      {modalCadastroPortal}
      {modalEditarPortal}
    </>
  )
}

export default EdificiosAdmin