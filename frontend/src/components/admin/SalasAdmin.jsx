import { useEffect, useState } from "react"
import {
  salasService,
  tiposSalaService,
  recursosService,
} from "../../services/adminService"

function SalasAdmin({
  salas,
  setSalas,
  instituicoes,
  campi,
  edificios,
  showToast,
}) {
  const [tiposSala, setTiposSala] = useState([])
  const [recursosDisponiveis, setRecursosDisponiveis] = useState([])
  const [recursosPorTipo, setRecursosPorTipo] = useState({})

  const [nome, setNome] = useState("")
  const [numero, setNumero] = useState("")
  const [capacidade, setCapacidade] = useState("")
  const [metragem, setMetragem] = useState("")
  const [andar, setAndar] = useState("")
  const [idTipoSala, setIdTipoSala] = useState("")
  const [recursos, setRecursos] = useState([])
  const [ativo, setAtivo] = useState(true)

  const [idInstituicao, setIdInstituicao] = useState("")
  const [idCampus, setIdCampus] = useState("")
  const [idEdificio, setIdEdificio] = useState("")

  const [busca, setBusca] = useState("")
  const [modalEditar, setModalEditar] = useState(false)
  const [salaSelecionada, setSalaSelecionada] = useState(null)
  const [carregando, setCarregando] = useState(false)

  const campiFiltradosCadastro = campi.filter(
    (c) => c.idInstituicao === Number(idInstituicao)
  )

  const edificiosFiltradosCadastro = edificios.filter(
    (e) => e.idCampus === Number(idCampus)
  )

  const campiFiltradosEdicao = salaSelecionada
    ? campi.filter(
        (c) => c.idInstituicao === Number(salaSelecionada.idInstituicao)
      )
    : []

  const edificiosFiltradosEdicao = salaSelecionada
    ? edificios.filter((e) => e.idCampus === Number(salaSelecionada.idCampus))
    : []

  async function carregarTiposERecursos() {
    try {
      const [tiposApi, recursosApi] = await Promise.all([
        tiposSalaService.listar(),
        recursosService.listar(),
      ])

      setTiposSala(tiposApi)
      setRecursosDisponiveis(recursosApi)

      const mapa = {}

      await Promise.all(
        tiposApi.map(async (tipo) => {
          const recursosDoTipo = await tiposSalaService.listarRecursos(tipo.id)
          mapa[tipo.id] = recursosDoTipo
        })
      )

      setRecursosPorTipo(mapa)
    } catch (error) {
      console.error("Erro ao carregar tipos e recursos:", error)
      showToast("Erro ao carregar tipos de sala e recursos", "erro")
    }
  }

  useEffect(() => {
    carregarTiposERecursos()
  }, [])

  function getTipoSala(id) {
    return tiposSala.find((t) => t.id === Number(id))?.nome || "?"
  }

  function getRecursosPorTipo(id) {
    return recursosPorTipo[Number(id)] || []
  }

  function getNomeRecurso(id) {
    return recursosDisponiveis.find((r) => r.id === Number(id))?.nome || "?"
  }

  function getNomesRecursos(ids = []) {
    return ids.map((id) => getNomeRecurso(id)).filter((nome) => nome !== "?")
  }

  function alterarTipoSala(valor) {
    setIdTipoSala(valor)

    const recursosPadrao = getRecursosPorTipo(valor).map((r) => r.id)
    setRecursos(recursosPadrao)
  }

  function alterarTipoSalaEdicao(valor) {
    const recursosPadrao = getRecursosPorTipo(valor).map((r) => r.id)

    setSalaSelecionada((prev) => ({
      ...prev,
      idTipoSala: valor,
      recursos: recursosPadrao,
    }))
  }

  function toggleRecursoCadastro(idRecurso) {
    setRecursos((prev) =>
      prev.includes(idRecurso)
        ? prev.filter((r) => r !== idRecurso)
        : [...prev, idRecurso]
    )
  }

  function toggleRecursoEdicao(idRecurso) {
    setSalaSelecionada((prev) => {
      const recursosAtuais = prev.recursos || []

      return {
        ...prev,
        recursos: recursosAtuais.includes(idRecurso)
          ? recursosAtuais.filter((r) => r !== idRecurso)
          : [...recursosAtuais, idRecurso],
      }
    })
  }

  function getNomeEdificio(id) {
    return edificios.find((e) => e.id === Number(id))?.nome || "?"
  }

  function limparCadastro() {
    setNome("")
    setNumero("")
    setCapacidade("")
    setMetragem("")
    setAndar("")
    setIdTipoSala("")
    setRecursos([])
    setAtivo(true)
    setIdInstituicao("")
    setIdCampus("")
    setIdEdificio("")
  }

  function getCampusPorEdificio(id) {
    const edificio = edificios.find((e) => e.id === Number(id))
    return campi.find((c) => c.id === edificio?.idCampus) || null
  }

  function getInstituicaoPorCampus(id) {
    const campus = campi.find((c) => c.id === Number(id))
    return instituicoes.find((i) => i.id === campus?.idInstituicao) || null
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
    const campus = getCampusPorEdificio(s.idEdificio)
    const instituicao = campus ? getInstituicaoPorCampus(campus.id) : null
    const nomesRecursos = getNomesRecursos(s.recursos || [])

    return (
      normalizarTexto(s.nome).includes(termoBusca) ||
      normalizarTexto(s.numero).includes(termoBusca) ||
      normalizarTexto(getTipoSala(s.idTipoSala)).includes(termoBusca) ||
      normalizarTexto(getNomeEdificio(s.idEdificio)).includes(termoBusca) ||
      normalizarTexto(campus?.nome).includes(termoBusca) ||
      normalizarTexto(instituicao?.nome).includes(termoBusca) ||
      normalizarTexto(nomesRecursos.join(" ")).includes(termoBusca)
    )
  })

  async function adicionarSala(e) {
    e.preventDefault()

    if (
      !nome.trim() ||
      !numero.trim() ||
      !capacidade ||
      !metragem ||
      !andar ||
      !idTipoSala ||
      !idEdificio
    ) {
      showToast("Preencha todos os campos obrigatórios da sala", "erro")
      return
    }

    try {
      setCarregando(true)

      const novaSala = await salasService.criar({
        idTipoSala: Number(idTipoSala),
        idEdificio: Number(idEdificio),
        nome: nome.trim(),
        numero: numero.trim(),
        capacidade: Number(capacidade),
        metragem: Number(metragem),
        andar: Number(andar),
        recursos,
        ativo,
      })

      setSalas((prev) => [...prev, novaSala])
      showToast("Sala salva com sucesso", "sucesso")
      limparCadastro()
    } catch (error) {
      console.error("Erro ao salvar sala:", error)
      showToast("Erro ao salvar sala", "erro")
    } finally {
      setCarregando(false)
    }
  }

  function abrirEditarSalas() {
    setModalEditar(true)
    setSalaSelecionada(null)
  }

  function fecharEditarSalas() {
    setModalEditar(false)
    setSalaSelecionada(null)
  }

  function selecionarSala(sala) {
    const edificio = edificios.find((e) => e.id === sala.idEdificio)
    const campus = campi.find((c) => c.id === edificio?.idCampus)

    setSalaSelecionada({
      ...sala,
      idInstituicao: String(campus?.idInstituicao || ""),
      idCampus: String(edificio?.idCampus || ""),
      idEdificio: String(sala.idEdificio || ""),
      idTipoSala: String(sala.idTipoSala || ""),
      recursos: sala.recursos || [],
      ativo: Boolean(sala.ativo),
    })
  }

  async function salvarEdicaoSala(e) {
    e.preventDefault()

    if (
      !salaSelecionada?.nome?.trim() ||
      !salaSelecionada?.numero?.trim() ||
      !salaSelecionada?.capacidade ||
      !salaSelecionada?.metragem ||
      !salaSelecionada?.andar ||
      !salaSelecionada?.idTipoSala ||
      !salaSelecionada?.idEdificio
    ) {
      showToast("Preencha todos os campos da sala", "erro")
      return
    }

    try {
      setCarregando(true)

      const salaAtualizada = await salasService.atualizar(
        salaSelecionada.idSala,
        {
          idTipoSala: Number(salaSelecionada.idTipoSala),
          idEdificio: Number(salaSelecionada.idEdificio),
          nome: salaSelecionada.nome.trim(),
          numero: salaSelecionada.numero.trim(),
          capacidade: Number(salaSelecionada.capacidade),
          metragem: Number(salaSelecionada.metragem),
          andar: Number(salaSelecionada.andar),
          recursos: salaSelecionada.recursos || [],
          ativo: Boolean(salaSelecionada.ativo),
        }
      )

      setSalas((prev) =>
        prev.map((s) =>
          s.idSala === salaSelecionada.idSala ? salaAtualizada : s
        )
      )

      setSalaSelecionada({
        ...salaAtualizada,
        idInstituicao: salaSelecionada.idInstituicao,
        idCampus: salaSelecionada.idCampus,
        idEdificio: String(salaAtualizada.idEdificio),
        idTipoSala: String(salaAtualizada.idTipoSala),
        recursos: salaAtualizada.recursos || [],
        ativo: Boolean(salaAtualizada.ativo),
      })

      showToast("Sala editada com sucesso", "editado")
    } catch (error) {
      console.error("Erro ao editar sala:", error)
      showToast("Erro ao editar sala", "erro")
    } finally {
      setCarregando(false)
    }
  }

  async function excluirSalaSelecionada() {
    if (!salaSelecionada) return

    const confirmar = window.confirm("Deseja excluir esta sala?")
    if (!confirmar) return

    try {
      setCarregando(true)

      await salasService.excluir(salaSelecionada.idSala)

      setSalas((prev) =>
        prev.filter((s) => s.idSala !== salaSelecionada.idSala)
      )

      showToast("Sala excluída com sucesso", "erro")
      setSalaSelecionada(null)
    } catch (error) {
      console.error("Erro ao excluir sala:", error)
      showToast("Erro ao excluir sala", "erro")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
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
            value={idTipoSala}
            onChange={(e) => alterarTipoSala(e.target.value)}
            required
          >
            <option value="">Selecione o tipo da sala</option>
            {tiposSala.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>

          {idTipoSala && (
            <div className="recursos-box">
              <strong>Recursos da sala</strong>

              <p
                style={{
                  marginTop: "6px",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Os recursos padrão do tipo selecionado já ficam marcados.
                Você pode marcar ou desmarcar qualquer recurso cadastrado.
              </p>

              <div className="recursos-grid">
                {recursosDisponiveis.map((recurso) => (
                  <label key={recurso.id} className="checkbox-line">
                    <input
                      type="checkbox"
                      checked={recursos.includes(recurso.id)}
                      onChange={() => toggleRecursoCadastro(recurso.id)}
                    />
                    {recurso.nome}
                  </label>
                ))}
              </div>

              {recursosDisponiveis.length === 0 && (
                <p
                  style={{
                    marginTop: "8px",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  Nenhum recurso cadastrado no banco.
                </p>
              )}
            </div>
          )}

          <input
            placeholder="Número da sala"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Capacidade"
            value={capacidade}
            onChange={(e) => setCapacidade(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Metragem (m²)"
            value={metragem}
            onChange={(e) => setMetragem(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Andar"
            value={andar}
            onChange={(e) => setAndar(e.target.value)}
            required
          />

          <select
            value={idInstituicao}
            onChange={(e) => {
              setIdInstituicao(e.target.value)
              setIdCampus("")
              setIdEdificio("")
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
            value={idCampus}
            onChange={(e) => {
              setIdCampus(e.target.value)
              setIdEdificio("")
            }}
            required
            disabled={!idInstituicao}
          >
            <option value="">Selecione o campus</option>
            {campiFiltradosCadastro.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <select
            value={idEdificio}
            onChange={(e) => setIdEdificio(e.target.value)}
            required
            disabled={!idCampus}
          >
            <option value="">Selecione o edifício</option>
            {edificiosFiltradosCadastro.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>

          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
            Sala ativa
          </label>

          <button className="btn primary" type="submit" disabled={carregando}>
            {carregando ? "Salvando..." : "Salvar sala"}
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
          placeholder="Buscar sala, tipo, recurso, instituição, campus ou edifício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {salasFiltradas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma sala cadastrada.</p>
        )}

        {salasFiltradas.map((s) => {
          const campus = getCampusPorEdificio(s.idEdificio)
          const instituicao = campus ? getInstituicaoPorCampus(campus.id) : null
          const recursosSala = getNomesRecursos(s.recursos || [])

          return (
            <div key={s.idSala} className="list-row no-button-row">
              <span>
                <strong>{s.nome}</strong>
                <br />
                <small>Tipo: {getTipoSala(s.idTipoSala)}</small>
                <br />
                <small>Número: {s.numero}</small>
                <br />
                <small>Capacidade: {s.capacidade}</small>
                <br />
                <small>Metragem: {s.metragem} m²</small>
                <br />
                <small>Andar: {s.andar}</small>
                <br />
                <small>Status: {s.ativo ? "Ativo" : "Inativo"}</small>
                <br />
                <small>
                  Recursos:{" "}
                  {recursosSala.length > 0
                    ? recursosSala.join(", ")
                    : "Nenhum recurso informado"}
                </small>
                <br />
                <small>Instituição: {instituicao?.nome || "?"}</small>
                <br />
                <small>Campus: {campus?.nome || "?"}</small>
                <br />
                <small>Edifício: {getNomeEdificio(s.idEdificio)}</small>
              </span>
            </div>
          )
        })}
      </div>

      {modalEditar && (
        <div className="popup">
          <div className="modal-box modal-large">
            <h3>Editar salas</h3>

            <div className="modal-split">
              <div className="modal-list">
                {salasFiltradas.map((s) => (
                  <button
                    key={s.idSala}
                    type="button"
                    className={`modal-list-item ${
                      salaSelecionada?.idSala === s.idSala ? "active" : ""
                    }`}
                    onClick={() => selecionarSala(s)}
                    disabled={carregando}
                  >
                    {s.nome} - {getNomeEdificio(s.idEdificio)}
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
                      value={salaSelecionada.idTipoSala}
                      onChange={(e) => alterarTipoSalaEdicao(e.target.value)}
                      required
                    >
                      <option value="">Selecione o tipo da sala</option>
                      {tiposSala.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>

                    {salaSelecionada.idTipoSala && (
                      <div className="recursos-box">
                        <strong>Recursos da sala</strong>

                        <p
                          style={{
                            marginTop: "6px",
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          Os recursos padrão do tipo selecionado já ficam
                          marcados. Você pode marcar ou desmarcar qualquer
                          recurso cadastrado.
                        </p>

                        <div className="recursos-grid">
                          {recursosDisponiveis.map((recurso) => (
                            <label key={recurso.id} className="checkbox-line">
                              <input
                                type="checkbox"
                                checked={(
                                  salaSelecionada.recursos || []
                                ).includes(recurso.id)}
                                onChange={() => toggleRecursoEdicao(recurso.id)}
                              />
                              {recurso.nome}
                            </label>
                          ))}
                        </div>

                        {recursosDisponiveis.length === 0 && (
                          <p
                            style={{
                              marginTop: "8px",
                              color: "#64748b",
                              fontSize: "13px",
                            }}
                          >
                            Nenhum recurso cadastrado no banco.
                          </p>
                        )}
                      </div>
                    )}

                    <input
                      value={salaSelecionada.numero}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          numero: e.target.value,
                        }))
                      }
                      placeholder="Número da sala"
                      required
                    />

                    <input
                      type="number"
                      value={salaSelecionada.capacidade}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          capacidade: e.target.value,
                        }))
                      }
                      placeholder="Capacidade"
                      required
                    />

                    <input
                      type="number"
                      value={salaSelecionada.metragem}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          metragem: e.target.value,
                        }))
                      }
                      placeholder="Metragem"
                      required
                    />

                    <input
                      type="number"
                      value={salaSelecionada.andar}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          andar: e.target.value,
                        }))
                      }
                      placeholder="Andar"
                      required
                    />

                    <select
                      value={salaSelecionada.idInstituicao}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          idInstituicao: e.target.value,
                          idCampus: "",
                          idEdificio: "",
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
                      value={salaSelecionada.idCampus}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          idCampus: e.target.value,
                          idEdificio: "",
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
                      value={salaSelecionada.idEdificio}
                      onChange={(e) =>
                        setSalaSelecionada((prev) => ({
                          ...prev,
                          idEdificio: e.target.value,
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

                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={salaSelecionada.ativo}
                        onChange={(e) =>
                          setSalaSelecionada((prev) => ({
                            ...prev,
                            ativo: e.target.checked,
                          }))
                        }
                      />
                      Sala ativa
                    </label>

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
                      onClick={excluirSalaSelecionada}
                      disabled={carregando}
                    >
                      {carregando ? "Excluindo..." : "Excluir"}
                    </button>
                  </form>
                ) : (
                  <p>Selecione uma sala para editar.</p>
                )}
              </div>
            </div>

            <button
              className="btn secondary"
              type="button"
              onClick={fecharEditarSalas}
              disabled={carregando}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default SalasAdmin