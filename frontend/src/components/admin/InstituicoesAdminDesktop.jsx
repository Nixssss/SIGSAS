import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { instituicoesService } from "../../services/adminService"

function InstituicoesAdminDesktop({
  modoResumo = false,
  instituicoes = [],
  setInstituicoes,
  campi = [],
  setCampi,
  edificios = [],
  setEdificios,
  salas = [],
  setSalas,
  showToast,
}) {
  const [listaInstituicoes, setListaInstituicoes] = useState(instituicoes)
  const [modalCadastro, setModalCadastro] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [nomeInstituicao, setNomeInstituicao] = useState("")
  const [itemSelecionado, setItemSelecionado] = useState(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    setListaInstituicoes(Array.isArray(instituicoes) ? instituicoes : [])
  }, [instituicoes])

  useEffect(() => {
    carregarInstituicoes()

    function atualizarInstituicoes() {
      carregarInstituicoes()
    }

    window.addEventListener("focus", atualizarInstituicoes)
    window.addEventListener("instituicoes-atualizadas", atualizarInstituicoes)

    return () => {
      window.removeEventListener("focus", atualizarInstituicoes)
      window.removeEventListener("instituicoes-atualizadas", atualizarInstituicoes)
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

  function extrairLista(response) {
    if (Array.isArray(response)) return response
    if (Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.dados)) return response.dados
    if (Array.isArray(response?.items)) return response.items
    if (Array.isArray(response?.results)) return response.results
    if (Array.isArray(response?.instituicoes)) return response.instituicoes

    return []
  }

  async function carregarInstituicoes() {
    try {
      setCarregando(true)

      const response = await instituicoesService.listar()
      const dados = extrairLista(response)

      setListaInstituicoes(dados)

      if (setInstituicoes) {
        setInstituicoes(dados)
      }
    } catch (error) {
      console.error("Erro ao carregar instituições:", error)
      showToast?.("Erro ao carregar instituições", "erro")
    } finally {
      setCarregando(false)
    }
  }

  function limparFormulario() {
    setNomeInstituicao("")
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

  function getIdInstituicao(instituicao) {
    return (
      instituicao?.id ||
      instituicao?.idInstituicao ||
      instituicao?.id_instituicao ||
      instituicao?.idinstituicao
    )
  }

  function getNomeInstituicao(instituicao) {
    return (
      instituicao?.nome ||
      instituicao?.nomeInstituicao ||
      instituicao?.nome_instituicao ||
      instituicao?.sigla ||
      "Instituição sem nome"
    )
  }

  function selecionarInstituicao(item) {
    setItemSelecionado(item)
    setNomeInstituicao(getNomeInstituicao(item))
  }

  async function adicionarInstituicao(e) {
    e.preventDefault()

    if (!nomeInstituicao.trim()) {
      showToast?.("Informe o nome da instituição", "erro")
      return
    }

    try {
      setCarregando(true)

      await instituicoesService.criar({
        nome: nomeInstituicao.trim(),
      })

      await carregarInstituicoes()

      window.dispatchEvent(new Event("instituicoes-atualizadas"))

      showToast?.("Instituição cadastrada com sucesso", "sucesso")
      fecharCadastro()
    } catch (error) {
      console.error("Erro ao cadastrar instituição:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao cadastrar instituição", "erro")
      }
    } finally {
      setCarregando(false)
    }
  }

  async function salvarEdicao(e) {
    e.preventDefault()

    if (!itemSelecionado || !nomeInstituicao.trim()) {
      showToast?.("Selecione uma instituição e informe o nome", "erro")
      return
    }

    try {
      setCarregando(true)

      const idInstituicao = getIdInstituicao(itemSelecionado)

      await instituicoesService.atualizar(idInstituicao, {
        nome: nomeInstituicao.trim(),
      })

      await carregarInstituicoes()

      window.dispatchEvent(new Event("instituicoes-atualizadas"))

      showToast?.("Instituição editada com sucesso", "editado")
      limparFormulario()
    } catch (error) {
      console.error("Erro ao editar instituição:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao editar instituição", "erro")
      }
    } finally {
      setCarregando(false)
    }
  }

  async function excluirSelecionado() {
    if (!itemSelecionado) return

    const confirmar = window.confirm(
      "Deseja excluir esta instituição? Campi, edifícios e salas vinculados também poderão ser afetados."
    )

    if (!confirmar) return

    try {
      setCarregando(true)

      const idInstituicao = getIdInstituicao(itemSelecionado)

      await instituicoesService.excluir(idInstituicao)

      await carregarInstituicoes()

      if (setCampi) {
        setCampi((prev) =>
          prev.filter(
            (campus) =>
              String(campus.idInstituicao || campus.id_instituicao) !==
              String(idInstituicao)
          )
        )
      }

      if (setEdificios) {
        setEdificios((prev) =>
          prev.filter((edificio) => {
            const campusDoEdificio = campi.find(
              (campus) =>
                String(campus.id || campus.idCampus) ===
                String(edificio.idCampus || edificio.id_campus)
            )

            return (
              String(
                campusDoEdificio?.idInstituicao ||
                  campusDoEdificio?.id_instituicao
              ) !== String(idInstituicao)
            )
          })
        )
      }

      if (setSalas) {
        setSalas((prev) => prev)
      }

      window.dispatchEvent(new Event("instituicoes-atualizadas"))
      window.dispatchEvent(new Event("campi-atualizados"))
      window.dispatchEvent(new Event("edificios-atualizados"))

      showToast?.("Instituição excluída com sucesso", "excluido")
      limparFormulario()
    } catch (error) {
      console.error("Erro ao excluir instituição:", error)

      if (error.response?.data?.detail) {
        showToast?.(error.response.data.detail, "erro")
      } else {
        showToast?.("Erro ao excluir instituição", "erro")
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
          <h3>Nova instituição</h3>

          <form onSubmit={adicionarInstituicao} className="form-col">
            <input
              value={nomeInstituicao}
              onChange={(e) => setNomeInstituicao(e.target.value)}
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
          <h3>Editar instituições</h3>

          <div className="modal-split">
            <div className="modal-list">
              {listaInstituicoes.map((instituicao) => {
                const idInstituicao = getIdInstituicao(instituicao)

                return (
                  <button
                    key={idInstituicao || getNomeInstituicao(instituicao)}
                    className={`modal-list-item ${
                      String(getIdInstituicao(itemSelecionado)) ===
                      String(idInstituicao)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => selecionarInstituicao(instituicao)}
                    type="button"
                    disabled={carregando}
                  >
                    {getNomeInstituicao(instituicao)}
                  </button>
                )
              })}

              {listaInstituicoes.length === 0 && (
                <p style={{ marginTop: "10px" }}>
                  Nenhuma instituição cadastrada.
                </p>
              )}
            </div>

            <div className="modal-editor">
              {itemSelecionado ? (
                <form onSubmit={salvarEdicao} className="form-col">
                  <input
                    value={nomeInstituicao}
                    onChange={(e) => setNomeInstituicao(e.target.value)}
                    placeholder="Nome da instituição"
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
      </div>,
      document.body
    )

  return (
    <>
      <div className="card admin-card">
        <div className="card-title-actions">
          <h3>Instituições</h3>

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

        {carregando && listaInstituicoes.length === 0 && (
          <p>Carregando instituições...</p>
        )}

        {listaInstituicoes.map((instituicao) => (
          <div
            key={getIdInstituicao(instituicao) || getNomeInstituicao(instituicao)}
            className="list-row no-button-row"
          >
            <span>
              <strong>{getNomeInstituicao(instituicao)}</strong>
            </span>
          </div>
        ))}

        {!carregando && listaInstituicoes.length === 0 && (
          <p>Nenhuma instituição cadastrada.</p>
        )}
      </div>

      {modalCadastroPortal}
      {modalEditarPortal}
    </>
  )
}

export default InstituicoesAdminDesktop