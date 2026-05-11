import { useEffect, useState } from "react"
import Toast from "./Toast"

function SalasAdmin({ voltar }) {
  const [salas, setSalas] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [campi, setCampi] = useState([])
  const [edificios, setEdificios] = useState([])

  const [nome, setNome] = useState("")
  const [instId, setInstId] = useState("")
  const [campusId, setCampusId] = useState("")
  const [edificioId, setEdificioId] = useState("")
  const [busca, setBusca] = useState("")

  const [toasts, setToasts] = useState([])
  const [modalEditar, setModalEditar] = useState(false)
  const [salaSelecionada, setSalaSelecionada] = useState(null)

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    localStorage.setItem("salas", JSON.stringify(salas))
  }, [salas])

  function carregarDados() {
    setSalas(JSON.parse(localStorage.getItem("salas")) || [])
    setInstituicoes(JSON.parse(localStorage.getItem("instituicoes")) || [])
    setCampi(JSON.parse(localStorage.getItem("campi")) || [])
    setEdificios(JSON.parse(localStorage.getItem("edificios")) || [])
  }

  function showToast(mensagem, tipo = "sucesso") {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, mensagem, tipo }])
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const campiFiltradosCadastro = campi.filter(
    (c) => c.instituicaoId === Number(instId)
  )

  const edificiosFiltradosCadastro = edificios.filter(
    (e) => e.campusId === Number(campusId)
  )

  function adicionarSala(e) {
    e.preventDefault()

    if (!nome.trim() || !instId || !campusId || !edificioId) {
      showToast("Preencha todos os campos", "erro")
      return
    }

    const novaSala = {
      id: Date.now(),
      nome: nome.trim(),
      instituicaoId: Number(instId),
      campusId: Number(campusId),
      edificioId: Number(edificioId),
    }

    setSalas((prev) => [...prev, novaSala])

    showToast("Sala salva com sucesso", "sucesso")

    setNome("")
    setInstId("")
    setCampusId("")
    setEdificioId("")
  }

  function abrirEditarSalas() {
    setModalEditar(true)
    setSalaSelecionada(null)
  }

  function fecharEditarSalas() {
    setModalEditar(false)
    limparEdicao()
  }

  function limparEdicao() {
    setSalaSelecionada(null)
  }

  function selecionarSala(sala) {
    setSalaSelecionada({
      ...sala,
      instId: String(sala.instituicaoId),
      campusId: String(sala.campusId),
      edificioId: String(sala.edificioId),
    })
  }

  function salvarEdicaoSala(e) {
    e.preventDefault()

    if (
      !salaSelecionada?.nome?.trim() ||
      !salaSelecionada?.instId ||
      !salaSelecionada?.campusId ||
      !salaSelecionada?.edificioId
    ) {
      showToast("Preencha todos os campos da sala", "erro")
      return
    }

    setSalas((prev) =>
      prev.map((s) =>
        s.id === salaSelecionada.id
          ? {
              ...s,
              nome: salaSelecionada.nome.trim(),
              instituicaoId: Number(salaSelecionada.instId),
              campusId: Number(salaSelecionada.campusId),
              edificioId: Number(salaSelecionada.edificioId),
            }
          : s
      )
    )

    showToast("Sala editada com sucesso", "editado")
  }

  function excluirSalaSelecionada() {
    if (!salaSelecionada) return

    const confirmar = window.confirm("Deseja excluir esta sala?")
    if (!confirmar) return

    setSalas((prev) => prev.filter((s) => s.id !== salaSelecionada.id))
    showToast("Sala excluída com sucesso", "erro")
    setSalaSelecionada(null)
  }

  function getNomeInstituicao(id) {
    return instituicoes.find((i) => i.id === id)?.nome || "?"
  }

  function getNomeCampus(id) {
    return campi.find((c) => c.id === id)?.nome || "?"
  }

  function getNomeEdificio(id) {
    return edificios.find((e) => e.id === id)?.nome || "?"
  }

  function normalizarTexto(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  const termoBusca = normalizarTexto(busca)

  const salasFiltradas = salas.filter((s) => {
    const nomeSala = normalizarTexto(s.nome)
    const nomeInst = normalizarTexto(getNomeInstituicao(s.instituicaoId))
    const nomeCampus = normalizarTexto(getNomeCampus(s.campusId))
    const nomeEdificio = normalizarTexto(getNomeEdificio(s.edificioId))

    return (
      nomeSala.includes(termoBusca) ||
      nomeInst.includes(termoBusca) ||
      nomeCampus.includes(termoBusca) ||
      nomeEdificio.includes(termoBusca)
    )
  })

  const campiFiltradosEdicao = salaSelecionada
    ? campi.filter((c) => c.instituicaoId === Number(salaSelecionada.instId))
    : []

  const edificiosFiltradosEdicao = salaSelecionada
    ? edificios.filter((e) => e.campusId === Number(salaSelecionada.campusId))
    : []

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

      <button className="btn secondary" onClick={voltar} type="button">
        ← Voltar
      </button>

      <div className="card">
        <h3>Nova sala</h3>

        <form onSubmit={adicionarSala} className="form-col">
          <input
            placeholder="Nome da sala"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <select
            value={instId}
            onChange={(e) => {
              setInstId(e.target.value)
              setCampusId("")
              setEdificioId("")
            }}
            required
          >
            <option value="">Selecione a instituição</option>
            {instituicoes.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>

          <select
            value={campusId}
            onChange={(e) => {
              setCampusId(e.target.value)
              setEdificioId("")
            }}
            required
            disabled={!instId}
          >
            <option value="">Selecione o campus</option>
            {campiFiltradosCadastro.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <select
            value={edificioId}
            onChange={(e) => setEdificioId(e.target.value)}
            required
            disabled={!campusId}
          >
            <option value="">Selecione o edifício</option>
            {edificiosFiltradosCadastro.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>

          <button className="btn primary" type="submit">
            Salvar sala
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-title-actions">
          <h3>Salas cadastradas</h3>
          <button className="btn edit" type="button" onClick={abrirEditarSalas}>
            Editar
          </button>
        </div>

        <input
          placeholder="Buscar sala, instituição, campus ou edifício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {salasFiltradas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma sala cadastrada.</p>
        )}

        {salasFiltradas.map((s) => (
          <div key={s.id} className="list-row no-button-row">
            <span>
              <strong>{s.nome}</strong>
              <br />
              <small>Instituição: {getNomeInstituicao(s.instituicaoId)}</small>
              <br />
              <small>Campus: {getNomeCampus(s.campusId)}</small>
              <br />
              <small>Edifício: {getNomeEdificio(s.edificioId)}</small>
            </span>
          </div>
        ))}
      </div>

      {modalEditar && (
        <div className="popup">
          <div className="modal-box modal-large">
            <h3>Editar salas</h3>

            <div className="modal-split">
              <div className="modal-list">
                {salasFiltradas.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`modal-list-item ${
                      salaSelecionada?.id === s.id ? "active" : ""
                    }`}
                    onClick={() => selecionarSala(s)}
                  >
                    {s.nome} - {getNomeEdificio(s.edificioId)}
                  </button>
                ))}
              </div>

              <div className="modal-editor">
                {salaSelecionada ? (
                  <form onSubmit={salvarEdicaoSala} className="form-col">
                    <input
                      value={salaSelecionada.nome}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          nome: e.target.value,
                        }))
                      }
                      placeholder="Nome da sala"
                      required
                    />

                    <select
                      value={salaSelecionada.instId}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          instId: e.target.value,
                          campusId: "",
                          edificioId: "",
                        }))
                      }
                      required
                    >
                      <option value="">Selecione a instituição</option>
                      {instituicoes.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nome}
                        </option>
                      ))}
                    </select>

                    <select
                      value={salaSelecionada.campusId}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          campusId: e.target.value,
                          edificioId: "",
                        }))
                      }
                      required
                    >
                      <option value="">Selecione o campus</option>
                      {campiFiltradosEdicao.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>

                    <select
                      value={salaSelecionada.edificioId}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          edificioId: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Selecione o edifício</option>
                      {edificiosFiltradosEdicao.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nome}
                        </option>
                      ))}
                    </select>

                    <button className="btn primary" type="submit">
                      Salvar
                    </button>

                    <button
                      className="btn delete"
                      type="button"
                      onClick={excluirSalaSelecionada}
                    >
                      Excluir
                    </button>
                  </form>
                ) : (
                  <p>Selecione uma sala para editar.</p>
                )}
              </div>
            </div>

            <button className="btn secondary" type="button" onClick={fecharEditarSalas}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalasAdmin