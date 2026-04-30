import { useEffect, useState } from "react"

const TIPOS_SALA = [
  { id: 1, nome: "Sala normal" },
  { id: 2, nome: "Laboratório de informática" },
  { id: 3, nome: "Laboratório de química" },
  { id: 4, nome: "Laboratório de física" },
  { id: 5, nome: "Laboratório de biologia" },
  { id: 6, nome: "Sala de cozinha" },
  { id: 7, nome: "Auditório" },
  { id: 8, nome: "Biblioteca" },
  { id: 9, nome: "Sala de reunião" },
  { id: 10, nome: "Sala de professores" },
  { id: 11, nome: "Sala administrativa" },
  { id: 12, nome: "Oficina" },
  { id: 13, nome: "Estúdio" },
  { id: 14, nome: "Ginásio" },
  { id: 15, nome: "Quadra" },
]

const STATUS_RESERVA = {
  1: "Pendente",
  2: "Aprovada",
  3: "Recusada",
  4: "Cancelada",
}

function Salas() {
  const [salas] = useState(() => {
    return JSON.parse(localStorage.getItem("salas")) || []
  })

  const [edificios] = useState(() => {
    return JSON.parse(localStorage.getItem("edificios")) || []
  })

  const [campi] = useState(() => {
    return JSON.parse(localStorage.getItem("campi")) || []
  })

  const [instituicoes] = useState(() => {
    return JSON.parse(localStorage.getItem("instituicoes")) || []
  })

  const [reservas, setReservas] = useState(() => {
    return JSON.parse(localStorage.getItem("reservas")) || []
  })

  const [busca, setBusca] = useState("")
  const [salaSelecionada, setSalaSelecionada] = useState(null)

  const [dataInicio, setDataInicio] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [horaFim, setHoraFim] = useState("")
  const [motivo, setMotivo] = useState("")
  const [justificativa, setJustificativa] = useState("")
  const [qtdPessoas, setQtdPessoas] = useState("")
  const [erroReserva, setErroReserva] = useState("")
  const [sucessoReserva, setSucessoReserva] = useState(false)

  useEffect(() => {
    localStorage.setItem("reservas", JSON.stringify(reservas))
  }, [reservas])

  function normalizarTexto(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  function getTipoSala(id) {
    return TIPOS_SALA.find((t) => t.id === id)?.nome || "?"
  }

  function getNomeEdificio(id) {
    return edificios.find((e) => e.id === id)?.nome || "?"
  }

  function getCampusPorEdificio(idEdificio) {
    const edificio = edificios.find((e) => e.id === idEdificio)
    return campi.find((c) => c.id === edificio?.idCampus) || null
  }

  function getInstituicaoPorCampus(idCampus) {
    const campus = campi.find((c) => c.id === idCampus)
    return instituicoes.find((i) => i.id === campus?.idInstituicao) || null
  }

  function getUsuarioLogado() {
    const usuario = JSON.parse(localStorage.getItem("logado") || "null")

    return {
      id: usuario?.id || usuario?.idUsuario || usuario?.email || "usuario-sem-id",
      nome: usuario?.nome || usuario?.email || "Usuário não identificado",
      matricula: usuario?.matricula || "Não informada",
      cargo: usuario?.cargo || usuario?.perfil || "Não informado",
      instituicao: usuario?.instituicao || "Não informada",
    }
  }

  function dataHoraParaTimestamp(data, hora) {
    return new Date(`${data}T${hora}`).getTime()
  }

  function formatarPeriodoReserva(reserva) {
    return `${reserva.dataInicio} às ${reserva.horaInicio} até ${reserva.dataFim} às ${reserva.horaFim}`
  }

  function getReservaBloqueanteDaSala(idSala) {
    return reservas.find(
      (r) =>
        r.idSala === idSala &&
        (r.idStatusReserva === 1 || r.idStatusReserva === 2)
    )
  }

  function salaEstaBloqueada(sala) {
    return !sala.ativo || Boolean(getReservaBloqueanteDaSala(sala.idSala))
  }

  function abrirReserva(sala) {
    const reservaBloqueante = getReservaBloqueanteDaSala(sala.idSala)

    if (!sala.ativo) {
      return
    }

    if (reservaBloqueante) {
      return
    }

    setSalaSelecionada(sala)
    setErroReserva("")
    setDataInicio("")
    setHoraInicio("")
    setDataFim("")
    setHoraFim("")
    setMotivo("")
    setJustificativa("")
    setQtdPessoas("")
  }

  function fecharReserva() {
    setSalaSelecionada(null)
    setErroReserva("")
  }

  function existeConflitoReserva(novaReserva) {
    const inicioNova = dataHoraParaTimestamp(
      novaReserva.dataInicio,
      novaReserva.horaInicio
    )

    const fimNova = dataHoraParaTimestamp(
      novaReserva.dataFim,
      novaReserva.horaFim
    )

    return reservas.some((r) => {
      if (r.idSala !== novaReserva.idSala) return false

      if (r.idStatusReserva === 3 || r.idStatusReserva === 4) {
        return false
      }

      const inicioExistente = dataHoraParaTimestamp(r.dataInicio, r.horaInicio)
      const fimExistente = dataHoraParaTimestamp(r.dataFim, r.horaFim)

      return inicioNova < fimExistente && fimNova > inicioExistente
    })
  }

  function confirmarReserva(e) {
    e.preventDefault()

    if (!salaSelecionada) return

    if (
      !dataInicio ||
      !horaInicio ||
      !dataFim ||
      !horaFim ||
      !motivo.trim() ||
      !qtdPessoas
    ) {
      setErroReserva("Preencha todos os campos obrigatórios.")
      return
    }

    const quantidade = Number(qtdPessoas)

    if (quantidade <= 0) {
      setErroReserva("A quantidade de pessoas deve ser maior que zero.")
      return
    }

    if (quantidade > Number(salaSelecionada.capacidade)) {
      setErroReserva(
        `A quantidade excede a capacidade da sala (${salaSelecionada.capacidade}).`
      )
      return
    }

    const inicio = dataHoraParaTimestamp(dataInicio, horaInicio)
    const fim = dataHoraParaTimestamp(dataFim, horaFim)

    if (Number.isNaN(inicio) || Number.isNaN(fim)) {
      setErroReserva("Data ou horário inválido.")
      return
    }

    if (fim <= inicio) {
      setErroReserva("A data/hora final deve ser maior que a inicial.")
      return
    }

    const usuarioReserva = getUsuarioLogado()

    const novaReserva = {
      idReserva: Date.now(),
      idUsuarioReserva: usuarioReserva.id,
      nomeUsuarioReserva: usuarioReserva.nome,
      matriculaUsuarioReserva: usuarioReserva.matricula,
      cargoUsuarioReserva: usuarioReserva.cargo,
      instituicaoUsuarioReserva: usuarioReserva.instituicao,

      idStatusReserva: 1,
      idSala: salaSelecionada.idSala,
      idUsuarioAprovacao: null,

      dataInicio,
      horaInicio,
      dataFim,
      horaFim,
      motivo: motivo.trim(),
      dataCriacao: new Date().toISOString(),
      justificativa: justificativa.trim(),
      qtdPessoas: quantidade,
    }

    if (existeConflitoReserva(novaReserva)) {
      setErroReserva("Já existe uma reserva para essa sala nesse intervalo.")
      return
    }

    setReservas((prev) => [...prev, novaReserva])
    fecharReserva()

    setSucessoReserva(true)

    setTimeout(() => {
      setSucessoReserva(false)
    }, 2500)
  }

  const termoBusca = normalizarTexto(busca)

  const salasFiltradas = salas.filter((s) => {
    const campus = getCampusPorEdificio(s.idEdificio)
    const instituicao = campus ? getInstituicaoPorCampus(campus.id) : null

    return (
      normalizarTexto(s.nome).includes(termoBusca) ||
      normalizarTexto(s.numero).includes(termoBusca) ||
      normalizarTexto(getTipoSala(s.idTipoSala)).includes(termoBusca) ||
      normalizarTexto(getNomeEdificio(s.idEdificio)).includes(termoBusca) ||
      normalizarTexto(campus?.nome).includes(termoBusca) ||
      normalizarTexto(instituicao?.nome).includes(termoBusca) ||
      normalizarTexto((s.recursos || []).join(" ")).includes(termoBusca)
    )
  })

  return (
    <div>
      <div className="card">
        <h3>Salas</h3>

        <input
          placeholder="Buscar sala, tipo, recurso, instituição, campus ou edifício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {salasFiltradas.map((s) => {
        const campus = getCampusPorEdificio(s.idEdificio)
        const instituicao = campus ? getInstituicaoPorCampus(campus.id) : null
        const reservaBloqueante = getReservaBloqueanteDaSala(s.idSala)
        const bloqueada = salaEstaBloqueada(s)

        return (
          <div className="card card-actions" key={s.idSala}>
            <div>
              <p>
                <strong>{s.nome}</strong>

                <span className="info-tooltip">
                  !
                  <span className="tooltip-box">
                    <strong>Recursos da sala</strong>
                    <br />
                    {(s.recursos || []).length > 0
                      ? s.recursos.join(", ")
                      : "Nenhum recurso informado"}
                  </span>
                </span>

                <br />
                Tipo: {getTipoSala(s.idTipoSala)}
                <br />
                Número: {s.numero}
                <br />
                Capacidade: {s.capacidade}
                <br />
                Metragem: {s.metragem} m²
                <br />
                Andar: {s.andar}
                <br />
                Status: {!s.ativo ? "Inativa" : reservaBloqueante ? "Reservada / indisponível" : "Disponível"}
                <br />
                Instituição: {instituicao?.nome || "?"}
                <br />
                Campus: {campus?.nome || "?"}
                <br />
                Edifício: {getNomeEdificio(s.idEdificio)}

                {reservaBloqueante && (
                  <>
                    <br />
                    <strong>Período reservado:</strong>{" "}
                    {formatarPeriodoReserva(reservaBloqueante)}
                    <br />
                    <strong>Status da reserva:</strong>{" "}
                    {STATUS_RESERVA[reservaBloqueante.idStatusReserva]}
                  </>
                )}
              </p>
            </div>

            <div className="actions">
              <button
                className={bloqueada ? "btn secondary" : "btn primary"}
                disabled={bloqueada}
                onClick={() => abrirReserva(s)}
              >
                {!s.ativo
                  ? "Inativa"
                  : reservaBloqueante
                  ? "Indisponível"
                  : "Reservar"}
              </button>
            </div>
          </div>
        )
      })}

      {salaSelecionada && (
        <div className="popup">
          <div className="modal-box">
            <h3>Reservar sala</h3>

            <p style={{ marginBottom: "12px" }}>
              <strong>{salaSelecionada.nome}</strong>
              <br />
              Capacidade: {salaSelecionada.capacidade} pessoas
            </p>

            <form onSubmit={confirmarReserva} className="form-col">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />

              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
              />

              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />

              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                required
              />

              <input
                placeholder="Motivo da reserva"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              />

              <input
                type="number"
                placeholder="Quantidade de pessoas"
                value={qtdPessoas}
                onChange={(e) => setQtdPessoas(e.target.value)}
                required
              />

              <input
                placeholder="Justificativa adicional (opcional)"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />

              {erroReserva && <p className="erro">{erroReserva}</p>}

              <button className="btn primary" type="submit">
                Confirmar reserva
              </button>

              <button
                className="btn secondary"
                type="button"
                onClick={fecharReserva}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {sucessoReserva && (
        <div className="popup">
          <div className="popup-box">
            <div className="check">✔</div>
            <h3>Reserva solicitada!</h3>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Agora aguarde a aprovação do administrador.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Salas