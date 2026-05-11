import { useEffect, useState } from "react"

function Salas() {
  const [salas, setSalas] = useState([])
  const [edificios, setEdificios] = useState([])
  const [campi, setCampi] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [busca, setBusca] = useState("")

  useEffect(() => {
    setSalas(JSON.parse(localStorage.getItem("salas")) || [])
    setEdificios(JSON.parse(localStorage.getItem("edificios")) || [])
    setCampi(JSON.parse(localStorage.getItem("campi")) || [])
    setInstituicoes(JSON.parse(localStorage.getItem("instituicoes")) || [])
  }, [])

  function getNomeEdificio(id) {
    return edificios.find((e) => e.id === id)?.nome || "?"
  }

  function getCampusPorEdificio(edificioId) {
    const edificio = edificios.find((e) => e.id === edificioId)
    return campi.find((c) => c.id === edificio?.campusId) || null
  }

  function getInstituicaoPorCampus(campusId) {
    const campus = campi.find((c) => c.id === campusId)
    return instituicoes.find((i) => i.id === campus?.instituicaoId) || null
  }

  const salasFiltradas = salas.filter((s) =>
    s.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div>
      <div className="card">
        <h3>Salas</h3>

        <input
          placeholder="Buscar sala..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {salasFiltradas.map((s) => {
        const campus = getCampusPorEdificio(s.edificioId)
        const instituicao = campus ? getInstituicaoPorCampus(campus.id) : null

        return (
          <div className="card card-actions" key={s.id}>
            <div>
              <p>
                <strong>{s.nome}</strong>
                <br />
                Instituição: {instituicao?.nome || "?"}
                <br />
                Campus: {campus?.nome || "?"}
                <br />
                Edifício: {getNomeEdificio(s.edificioId)}
              </p>
            </div>

            <div className="actions">
              <button className="btn primary">Reservar</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Salas