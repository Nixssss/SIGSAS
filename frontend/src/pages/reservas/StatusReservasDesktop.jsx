import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
  campiService,
  edificiosService,
  instituicoesService,
  reservasService,
  salasService,
  tiposSalaService,
} from "../../services/adminService"

const STATUS_RESERVA = {
  1: "Pendente",
  2: "Aprovada",
  3: "Recusada",
  4: "Cancelada",
}

const CLASSE_STATUS_RESERVA = {
  1: "pendente",
  2: "aprovada",
  3: "recusada",
  4: "cancelada",
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"]

const HORARIOS_MANUAIS = Array.from({ length: 61 }, (_, index) => {
  const totalMinutos = 8 * 60 + index * 15
  const hora = String(Math.floor(totalMinutos / 60)).padStart(2, "0")
  const minuto = String(totalMinutos % 60).padStart(2, "0")

  return `${hora}:${minuto}`
})

function IconeReservaManual({ tipo }) {
  if (tipo === "calendario") {
    return (
      <svg viewBox="0 0 24 24" className="reserva-manual-input-icon-svg">
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="reserva-manual-input-icon-svg">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
      <path d="M7 3.5 4.5 6M17 3.5 19.5 6" />
    </svg>
  )
}

function horarioParaMinutos(horario) {
  if (!horario) return null

  const [hora, minuto] = String(horario).split(":").map(Number)

  if (Number.isNaN(hora) || Number.isNaN(minuto)) return null

  return hora * 60 + minuto
}

function somarMinutosHorario(horario, minutosAdicionar) {
  const minutos = horarioParaMinutos(horario)

  if (minutos === null) return ""

  const total = minutos + minutosAdicionar
  const hora = String(Math.floor(total / 60)).padStart(2, "0")
  const minuto = String(total % 60).padStart(2, "0")

  return `${hora}:${minuto}`
}

function SeletorHorarioManual({
  label,
  valor,
  onChange,
  aberto,
  onAbrir,
  onFechar,
  horarioMinimo = "08:00",
}) {
  const horariosDisponiveis = HORARIOS_MANUAIS.filter((horario) => {
    const minutosHorario = horarioParaMinutos(horario)
    const minutosMinimo = horarioParaMinutos(horarioMinimo)

    if (minutosHorario === null || minutosMinimo === null) return true

    return minutosHorario >= minutosMinimo
  })

  function selecionarHorario(horario) {
    onChange(horario)
    onFechar()
  }

  return (
    <div className="reserva-manual-time-box">
      <label>{label}</label>

      <button
        type="button"
        className={`reserva-manual-time-trigger ${aberto ? "aberto" : ""}`}
        onClick={aberto ? onFechar : onAbrir}
      >
        <span>{valor || "--:--"}</span>
        <strong>
          <IconeReservaManual tipo="relogio" />
        </strong>
      </button>

      {aberto && (
        <div className="reserva-manual-time-panel">
          <div className="reserva-manual-time-panel-header">
            <strong>{label}</strong>
            <span>08:00 às 23:00 • intervalos de 15 min</span>
          </div>

          <div className="reserva-manual-time-list">
            {horariosDisponiveis.length === 0 && (
              <span className="reserva-manual-time-empty">
                Nenhum horário disponível após o início selecionado.
              </span>
            )}

            {horariosDisponiveis.map((horario) => (
              <button
                key={horario}
                type="button"
                className={
                  valor === horario
                    ? "reserva-manual-time-option selecionado"
                    : "reserva-manual-time-option"
                }
                onClick={() => selecionarHorario(horario)}
              >
                {horario}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatarDataInput(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

function criarDataLocal(valor) {
  if (!valor) return null

  const [ano, mes, dia] = valor.split("-").map(Number)

  return new Date(ano, mes - 1, dia)
}

function datasMesmoDia(dataA, dataB) {
  if (!dataA || !dataB) return false

  return (
    dataA.getFullYear() === dataB.getFullYear() &&
    dataA.getMonth() === dataB.getMonth() &&
    dataA.getDate() === dataB.getDate()
  )
}

function obterMesesLetivosDisponiveis(dataBase) {
  const hoje = new Date(dataBase)
  hoje.setHours(0, 0, 0, 0)

  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth()
  const meses = []

  function adicionarIntervalo(ano, inicio, fim) {
    for (let mes = inicio; mes <= fim; mes += 1) {
      const ultimoDiaMes = new Date(ano, mes + 1, 0)
      ultimoDiaMes.setHours(23, 59, 59, 999)

      if (ultimoDiaMes >= hoje) {
        meses.push(new Date(ano, mes, 1))
      }
    }
  }

  if (mesAtual <= 5) {
    adicionarIntervalo(anoAtual, Math.max(1, mesAtual), 5)
  } else if (mesAtual === 6) {
    adicionarIntervalo(anoAtual, 7, 11)
  } else if (mesAtual <= 11) {
    adicionarIntervalo(anoAtual, Math.max(7, mesAtual), 11)
  }

  if (meses.length === 0) {
    adicionarIntervalo(anoAtual + 1, 1, 5)
  }

  return meses
}

function CalendarioLetivoManual({
  label,
  valor,
  onChange,
  aberto,
  onAbrir,
  onFechar,
  minDate,
}) {
  const hoje = new Date(minDate || new Date())
  hoje.setHours(0, 0, 0, 0)

  const mesesDisponiveis = useMemo(
    () => obterMesesLetivosDisponiveis(hoje),
    [hoje.getTime()]
  )

  function obterIndiceInicial() {
    if (!valor) return 0

    const dataSelecionada = criarDataLocal(valor)

    if (!dataSelecionada) return 0

    const indiceEncontrado = mesesDisponiveis.findIndex(
      (mes) =>
        mes.getFullYear() === dataSelecionada.getFullYear() &&
        mes.getMonth() === dataSelecionada.getMonth()
    )

    return indiceEncontrado >= 0 ? indiceEncontrado : 0
  }

  const [indiceMes, setIndiceMes] = useState(obterIndiceInicial)

  useEffect(() => {
    setIndiceMes(obterIndiceInicial())
  }, [valor, mesesDisponiveis.length])

  const mesVisivel = mesesDisponiveis[indiceMes] || mesesDisponiveis[0]
  const dataSelecionada = valor ? criarDataLocal(valor) : null

  const diasCalendario = useMemo(() => {
    if (!mesVisivel) return []

    const ano = mesVisivel.getFullYear()
    const mes = mesVisivel.getMonth()
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    const dias = []

    for (let i = 0; i < primeiroDia.getDay(); i += 1) {
      dias.push(null)
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia += 1) {
      dias.push(new Date(ano, mes, dia))
    }

    return dias
  }, [mesVisivel])

  function voltarMes() {
    setIndiceMes((indiceAtual) => Math.max(0, indiceAtual - 1))
  }

  function avancarMes() {
    setIndiceMes((indiceAtual) =>
      Math.min(mesesDisponiveis.length - 1, indiceAtual + 1)
    )
  }

  function selecionarDia(data) {
    if (!data) return

    const comparacao = new Date(data)
    comparacao.setHours(0, 0, 0, 0)

    if (comparacao < hoje || data.getDay() === 0) return

    onChange(formatarDataInput(data))
    onFechar()
  }

  return (
    <div className="reserva-manual-calendar-box">
      <label>{label}</label>

      <button
        type="button"
        className={`reserva-manual-calendar-trigger ${aberto ? "aberto" : ""}`}
        onClick={aberto ? onFechar : onAbrir}
      >
        <span>{valor ? formatarDataInputVisual(valor) : "Selecione uma data"}</span>
        <strong>
          <IconeReservaManual tipo="calendario" />
        </strong>
      </button>

      {aberto && (
        <div className="reserva-manual-calendar-panel">
          <div className="reserva-manual-calendar-header">
            <button
              type="button"
              onClick={voltarMes}
              disabled={indiceMes === 0}
            >
              ‹
            </button>

            <strong>
              {MESES[mesVisivel.getMonth()]} de {mesVisivel.getFullYear()}
            </strong>

            <button
              type="button"
              onClick={avancarMes}
              disabled={indiceMes === mesesDisponiveis.length - 1}
            >
              ›
            </button>
          </div>

          <div className="reserva-manual-calendar-week">
            {DIAS_SEMANA.map((dia, index) => (
              <span key={`${dia}-${index}`} className={index === 0 ? "domingo" : ""}>
                {dia}
              </span>
            ))}
          </div>

          <div className="reserva-manual-calendar-days">
            {diasCalendario.map((data, index) => {
              if (!data) {
                return <span key={`vazio-${index}`} className="dia-vazio" />
              }

              const comparacao = new Date(data)
              comparacao.setHours(0, 0, 0, 0)

              const domingo = data.getDay() === 0
              const passado = comparacao < hoje
              const selecionado = datasMesmoDia(data, dataSelecionada)

              return (
                <button
                  key={formatarDataInput(data)}
                  type="button"
                  className={[
                    "reserva-manual-calendar-day",
                    domingo ? "domingo" : "",
                    passado ? "indisponivel" : "",
                    selecionado ? "selecionado" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={domingo || passado}
                  onClick={() => selecionarDia(data)}
                >
                  {data.getDate()}
                </button>
              )
            })}
          </div>

          <div className="reserva-manual-calendar-footer">
            <span>Meses letivos: fevereiro a junho e agosto a dezembro.</span>
            <button type="button" onClick={onFechar}>
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatarDataInputVisual(valor) {
  if (!valor) return ""

  const [ano, mes, dia] = valor.split("-")

  return `${dia}/${mes}/${ano}`
}

function StatusReservasDesktop() {
  const [reservas, setReservas] = useState([])
  const [salas, setSalas] = useState([])
  const [tiposSala, setTiposSala] = useState([])
  const [edificios, setEdificios] = useState([])
  const [campi, setCampi] = useState([])
  const [instituicoes, setInstituicoes] = useState([])

  const [notificacoesVistas, setNotificacoesVistas] = useState(() => {
    return JSON.parse(localStorage.getItem("notificacoesReservas")) || []
  })
  const [popupNotificacao, setPopupNotificacao] = useState(null)

  const [modalReservaAberto, setModalReservaAberto] = useState(false)
  const [salaManualId, setSalaManualId] = useState("")
  const [dataInicioManual, setDataInicioManual] = useState("")
  const [horaInicioManual, setHoraInicioManual] = useState("")
  const [dataFimManual, setDataFimManual] = useState("")
  const [horaFimManual, setHoraFimManual] = useState("")
  const [tipoAtividadeManual, setTipoAtividadeManual] = useState("")
  const [motivoManual, setMotivoManual] = useState("")
  const [cursoTurmaManual, setCursoTurmaManual] = useState("")
  const [qtdPessoasManual, setQtdPessoasManual] = useState("")
  const [justificativaManual, setJustificativaManual] = useState("")
  const [calendarioManualAberto, setCalendarioManualAberto] = useState("")
  const [seletorHoraManualAberto, setSeletorHoraManualAberto] = useState("")
  const [erroReservaManual, setErroReservaManual] = useState("")
  const [sucessoReservaManual, setSucessoReservaManual] = useState("")
  const [salvandoReservaManual, setSalvandoReservaManual] = useState(false)

  async function carregarDados() {
    try {
      const [
        reservasApi,
        salasApi,
        tiposSalaApi,
        edificiosApi,
        campiApi,
        instituicoesApi,
      ] = await Promise.all([
        reservasService.listar(),
        salasService.listar(),
        tiposSalaService.listar(),
        edificiosService.listar(),
        campiService.listar(),
        instituicoesService.listar(),
      ])

      setReservas(Array.isArray(reservasApi) ? reservasApi : [])
      setSalas(Array.isArray(salasApi) ? salasApi : [])
      setTiposSala(Array.isArray(tiposSalaApi) ? tiposSalaApi : [])
      setEdificios(Array.isArray(edificiosApi) ? edificiosApi : [])
      setCampi(Array.isArray(campiApi) ? campiApi : [])
      setInstituicoes(Array.isArray(instituicoesApi) ? instituicoesApi : [])
    } catch (error) {
      console.error("Erro ao carregar status de reservas:", error)
    }
  }

  useEffect(() => {
    carregarDados()

    const intervalo = setInterval(() => {
      carregarDados()
    }, 3000)

    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    verificarNotificacoes()
  }, [reservas])

  useEffect(() => {
    if (modalReservaAberto || popupNotificacao) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [modalReservaAberto, popupNotificacao])

  useEffect(() => {
    if (!horaInicioManual || !horaFimManual) return

    const minutosInicio = horarioParaMinutos(horaInicioManual)
    const minutosFim = horarioParaMinutos(horaFimManual)

    if (minutosInicio !== null && minutosFim !== null && minutosFim <= minutosInicio) {
      setHoraFimManual("")
    }
  }, [horaInicioManual, horaFimManual])

  function mesmoId(valorA, valorB) {
    return Number(valorA) === Number(valorB)
  }

  function primeiroValorValido(...valores) {
    const encontrado = valores.find(
      (valor) => valor !== undefined && valor !== null && valor !== ""
    )

    return encontrado ?? null
  }

  function textoOuNaoInformado(valor) {
    return valor !== undefined && valor !== null && valor !== ""
      ? valor
      : "Não informado"
  }

  function getUsuarioLogado() {
    const usuario = JSON.parse(localStorage.getItem("logado") || "null")

    return {
      id: Number(usuario?.id || usuario?.idUsuario || 1),
      nome: usuario?.nome || usuario?.email || "Usuário não identificado",
      matricula: usuario?.matricula || "Não informada",
      cargo: usuario?.cargo || usuario?.perfil || "Não informado",
      instituicao: usuario?.instituicao || "Não informada",
    }
  }

  function getUsuarioLogadoId() {
    return getUsuarioLogado().id
  }

  function getSala(idSala) {
    return (
      salas.find(
        (sala) =>
          mesmoId(sala.idSala, idSala) ||
          mesmoId(sala.id, idSala)
      ) || null
    )
  }

  function getEdificio(sala) {
    if (!sala) return null

    if (sala.edificio && typeof sala.edificio === "object") {
      return sala.edificio
    }

    const idEdificio = primeiroValorValido(
      sala.idEdificio,
      sala.id_edificio,
      sala.edificioId,
      sala.id_edificio_sala
    )

    return (
      edificios.find(
        (edificio) =>
          mesmoId(edificio.id, idEdificio) ||
          mesmoId(edificio.idEdificio, idEdificio)
      ) || null
    )
  }

  function getCampus(sala, edificio) {
    if (sala?.campus && typeof sala.campus === "object") {
      return sala.campus
    }

    if (edificio?.campus && typeof edificio.campus === "object") {
      return edificio.campus
    }

    const idCampus = primeiroValorValido(
      sala?.idCampus,
      sala?.id_campus,
      sala?.campusId,
      edificio?.idCampus,
      edificio?.id_campus,
      edificio?.campusId
    )

    return (
      campi.find(
        (campus) =>
          mesmoId(campus.id, idCampus) ||
          mesmoId(campus.idCampus, idCampus)
      ) || null
    )
  }

  function getInstituicao(sala, campus) {
    if (sala?.instituicao && typeof sala.instituicao === "object") {
      return sala.instituicao
    }

    if (campus?.instituicao && typeof campus.instituicao === "object") {
      return campus.instituicao
    }

    const idInstituicao = primeiroValorValido(
      sala?.idInstituicao,
      sala?.id_instituicao,
      sala?.instituicaoId,
      campus?.idInstituicao,
      campus?.id_instituicao,
      campus?.instituicaoId
    )

    return (
      instituicoes.find(
        (instituicao) =>
          mesmoId(instituicao.id, idInstituicao) ||
          mesmoId(instituicao.idInstituicao, idInstituicao)
      ) || null
    )
  }

  function getIdGenerico(item) {
    return Number(
      item?.id ||
        item?.idSala ||
        item?.idEdificio ||
        item?.idCampus ||
        item?.idInstituicao ||
        item?.idTipoSala
    )
  }

  function getTipoSala(idTipoSala) {
    return (
      tiposSala.find((tipo) => getIdGenerico(tipo) === Number(idTipoSala))
        ?.nome ||
      tiposSala.find((tipo) => Number(tipo.idTipoSala) === Number(idTipoSala))
        ?.nome ||
      "Tipo não informado"
    )
  }

  function getDetalhesSala(idSala) {
    const sala = getSala(idSala)
    const edificio = getEdificio(sala)
    const campus = getCampus(sala, edificio)
    const instituicao = getInstituicao(sala, campus)

    return {
      nome: textoOuNaoInformado(sala?.nome),
      tipo: textoOuNaoInformado(getTipoSala(sala?.idTipoSala)),
      numero: textoOuNaoInformado(sala?.numero),
      capacidade: textoOuNaoInformado(sala?.capacidade),
      andar: textoOuNaoInformado(sala?.andar),
      edificio: textoOuNaoInformado(edificio?.nome || sala?.nomeEdificio),
      campus: textoOuNaoInformado(campus?.nome || sala?.nomeCampus),
      instituicao: textoOuNaoInformado(
        instituicao?.nome || sala?.nomeInstituicao
      ),
    }
  }

  function getNomeSala(idSala) {
    return getDetalhesSala(idSala).nome
  }

  function salaEstaAtiva(sala) {
    return sala?.ativo === true || sala?.ativo === 1 || sala?.ativo === "1"
  }

  function formatarDataBR(data) {
    if (!data) return "Não informada"

    const texto = String(data).trim()

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
      const [ano, mes, dia] = texto.slice(0, 10).split("-")
      return `${dia}/${mes}/${ano}`
    }

    const dataConvertida = new Date(texto)

    if (Number.isNaN(dataConvertida.getTime())) {
      return "Não informada"
    }

    return dataConvertida.toLocaleDateString("pt-BR")
  }

  function formatarHoraBR(hora) {
    if (!hora) return "Não informada"

    const texto = String(hora).trim()

    if (/^\d{2}:\d{2}/.test(texto)) {
      return texto.slice(0, 5)
    }

    return texto
  }

  function formatarDataHoraCriacao(data) {
    if (!data) return "Não informado"

    const dataConvertida = new Date(data)

    if (Number.isNaN(dataConvertida.getTime())) {
      return "Não informado"
    }

    return dataConvertida.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatarPeriodoReserva(reserva) {
    const dataInicio = formatarDataBR(reserva.dataInicio)
    const dataFim = formatarDataBR(reserva.dataFim)
    const horaInicio = formatarHoraBR(reserva.horaInicio)
    const horaFim = formatarHoraBR(reserva.horaFim)

    if (dataInicio === dataFim) {
      return `${dataInicio}, das ${horaInicio} às ${horaFim}`
    }

    return `${dataInicio} às ${horaInicio} até ${dataFim} às ${horaFim}`
  }

  function dataHoraParaTimestamp(data, hora) {
    return new Date(`${data}T${hora}`).getTime()
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

    return reservas.some((reserva) => {
      if (Number(reserva.idSala) !== Number(novaReserva.idSala)) return false

      if (
        Number(reserva.idStatusReserva) === 3 ||
        Number(reserva.idStatusReserva) === 4
      ) {
        return false
      }

      const inicioExistente = dataHoraParaTimestamp(
        reserva.dataInicio,
        reserva.horaInicio
      )

      const fimExistente = dataHoraParaTimestamp(
        reserva.dataFim,
        reserva.horaFim
      )

      return inicioNova < fimExistente && fimNova > inicioExistente
    })
  }

  function verificarNotificacoes() {
    const usuarioId = getUsuarioLogadoId()

    const novasNotificacoes = reservas.filter(
      (r) =>
        Number(r.idUsuarioReserva) === Number(usuarioId) &&
        (Number(r.idStatusReserva) === 2 ||
          Number(r.idStatusReserva) === 3 ||
          Number(r.idStatusReserva) === 4) &&
        !notificacoesVistas.includes(r.idReserva)
    )

    if (novasNotificacoes.length === 0) return

    const ultima = novasNotificacoes[0]

    setPopupNotificacao(ultima)

    const atualizadas = [...notificacoesVistas, ultima.idReserva]
    setNotificacoesVistas(atualizadas)
    localStorage.setItem("notificacoesReservas", JSON.stringify(atualizadas))
  }

  function abrirModalReservaManual() {
    setModalReservaAberto(true)
    setErroReservaManual("")
    setSucessoReservaManual("")
    setCalendarioManualAberto("")
    setSeletorHoraManualAberto("")
    setSalaManualId("")
    setDataInicioManual("")
    setHoraInicioManual("08:00")
    setDataFimManual("")
    setHoraFimManual("")
    setTipoAtividadeManual("")
    setMotivoManual("")
    setCursoTurmaManual("")
    setQtdPessoasManual("")
    setJustificativaManual("")
    setCalendarioManualAberto("")
    setSeletorHoraManualAberto("")
  }

  function fecharModalReservaManual() {
    if (salvandoReservaManual) return

    setModalReservaAberto(false)
    setErroReservaManual("")
    setSucessoReservaManual("")
    setCalendarioManualAberto("")
  }

  async function criarReservaManual(e) {
    e.preventDefault()

    setErroReservaManual("")
    setSucessoReservaManual("")

    if (
      !salaManualId ||
      !dataInicioManual ||
      !horaInicioManual ||
      !dataFimManual ||
      !horaFimManual ||
      !tipoAtividadeManual ||
      !motivoManual.trim() ||
      !qtdPessoasManual
    ) {
      setErroReservaManual("Preencha todos os campos obrigatórios.")
      return
    }

    const sala = getSala(salaManualId)

    if (!sala) {
      setErroReservaManual("Sala não encontrada.")
      return
    }

    if (!salaEstaAtiva(sala)) {
      setErroReservaManual("Esta sala está inativa e não pode ser reservada.")
      return
    }

    const quantidade = Number(qtdPessoasManual)

    if (Number.isNaN(quantidade) || quantidade <= 0) {
      setErroReservaManual("A quantidade de pessoas deve ser maior que zero.")
      return
    }

    if (quantidade > Number(sala.capacidade)) {
      setErroReservaManual(
        `A quantidade excede a capacidade da sala (${sala.capacidade}).`
      )
      return
    }

    const inicio = dataHoraParaTimestamp(dataInicioManual, horaInicioManual)
    const fim = dataHoraParaTimestamp(dataFimManual, horaFimManual)

    if (Number.isNaN(inicio) || Number.isNaN(fim)) {
      setErroReservaManual("Data ou horário inválido.")
      return
    }

    if (fim <= inicio) {
      setErroReservaManual("A data/hora final deve ser pelo menos 15 minutos após o início.")
      return
    }

    const usuarioReserva = getUsuarioLogado()

    const novaReserva = {
      idSala: Number(salaManualId),
      idUsuarioReserva: usuarioReserva.id,
      nomeUsuarioReserva: usuarioReserva.nome,
      matriculaUsuarioReserva: usuarioReserva.matricula,
      cargoUsuarioReserva: usuarioReserva.cargo,
      instituicaoUsuarioReserva: usuarioReserva.instituicao,
      dataInicio: dataInicioManual,
      horaInicio: horaInicioManual,
      dataFim: dataFimManual,
      horaFim: horaFimManual,
      motivo: `${tipoAtividadeManual} - ${motivoManual.trim()}`,
      qtdPessoas: quantidade,
    }

    const detalhesJustificativa = []

    if (cursoTurmaManual.trim()) {
      detalhesJustificativa.push(`Curso/Turma: ${cursoTurmaManual.trim()}`)
    }

    if (justificativaManual.trim()) {
      detalhesJustificativa.push(justificativaManual.trim())
    }

    if (detalhesJustificativa.length > 0) {
      novaReserva.justificativa = detalhesJustificativa.join(" | ")
    }

    if (existeConflitoReserva(novaReserva)) {
      setErroReservaManual("Já existe uma reserva para essa sala nesse intervalo.")
      return
    }

    try {
      setSalvandoReservaManual(true)

      const reservaCriada = await reservasService.criar(novaReserva)

      setReservas((prev) => [...prev, reservaCriada])
      setSucessoReservaManual("Reserva solicitada com sucesso. Aguarde a aprovação.")
      window.dispatchEvent(new Event("reservas-atualizadas"))

      setTimeout(() => {
        fecharModalReservaManual()
      }, 1300)
    } catch (error) {
      console.error("Erro ao criar reserva manual:", error)

      if (error.response?.status === 409) {
        setErroReservaManual("Já existe uma reserva para essa sala nesse intervalo.")
      } else if (error.response?.data?.detail) {
        setErroReservaManual(error.response.data.detail)
      } else {
        setErroReservaManual("Erro ao solicitar reserva.")
      }
    } finally {
      setSalvandoReservaManual(false)
    }
  }

  async function cancelarReserva(idReserva) {
    const confirmar = window.confirm("Deseja cancelar esta reserva?")
    if (!confirmar) return

    try {
      const atualizada = await reservasService.atualizarStatus(idReserva, {
        idStatusReserva: 4,
        idUsuarioAprovacao: getUsuarioLogadoId(),
        justificativa: "Cancelada pelo solicitante",
      })

      setReservas((prev) =>
        prev.map((r) =>
          Number(r.idReserva) === Number(idReserva) ? atualizada : r
        )
      )

      window.dispatchEvent(new Event("reservas-atualizadas"))
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error)
      alert("Erro ao cancelar reserva.")
    }
  }

  const idUsuarioAtual = getUsuarioLogadoId()

  const minhasReservas = reservas
    .filter((r) => Number(r.idUsuarioReserva) === Number(idUsuarioAtual))
    .sort((a, b) => Number(b.idReserva || 0) - Number(a.idReserva || 0))

  const reservasPendentes = minhasReservas.filter(
    (r) => Number(r.idStatusReserva) === 1
  )
  const reservasAprovadas = minhasReservas.filter(
    (r) => Number(r.idStatusReserva) === 2
  )
  const historicoReservas = minhasReservas.filter(
    (r) => Number(r.idStatusReserva) === 3 || Number(r.idStatusReserva) === 4
  )

  const salasAtivasOrdenadas = useMemo(() => {
    return [...salas]
      .filter((sala) => salaEstaAtiva(sala))
      .sort((a, b) => {
        const tipoA = getTipoSala(a.idTipoSala)
        const tipoB = getTipoSala(b.idTipoSala)
        const tipoComparacao = tipoA.localeCompare(tipoB)

        if (tipoComparacao !== 0) return tipoComparacao

        return String(a.nome || "").localeCompare(String(b.nome || ""))
      })
  }, [salas, tiposSala])

  const salasAgrupadasPorTipo = useMemo(() => {
    const grupos = new Map()

    salasAtivasOrdenadas.forEach((sala) => {
      const tipo = getTipoSala(sala.idTipoSala)

      if (!grupos.has(tipo)) {
        grupos.set(tipo, [])
      }

      grupos.get(tipo).push(sala)
    })

    return Array.from(grupos.entries())
  }, [salasAtivasOrdenadas, tiposSala])

  const salaSelecionadaManual = getSala(salaManualId)
  const detalhesSalaManual = getDetalhesSala(salaManualId)

  function ReservaCard({ reserva, mostrarCancelar = false }) {
    const sala = getDetalhesSala(reserva.idSala)
    const statusClasse =
      CLASSE_STATUS_RESERVA[Number(reserva.idStatusReserva)] || "desconhecido"

    return (
      <div className={`list-row reserva-row status-${statusClasse}`}>
        <span className="reserva-dados">
          <strong>{sala.nome}</strong>
          <br />

          <small>
            Solicitante: {reserva.nomeUsuarioReserva || "Não informado"}
          </small>
          <br />

          <small>
            Matrícula: {reserva.matriculaUsuarioReserva || "Não informada"}
          </small>
          <br />

          <small>
            Cargo: {reserva.cargoUsuarioReserva || "Não informado"}
          </small>
          <br />

          <small>
            Perfil:{" "}
            {reserva.perfilUsuarioReserva ||
              reserva.perfil ||
              reserva.cargoUsuarioReserva ||
              "Não informado"}
          </small>
          <br />

          <small>Número da sala: {sala.numero}</small>
          <br />

          <small>Campus: {sala.campus}</small>
          <br />

          <small>Edifício: {sala.edificio}</small>
          <br />

          <small>Andar: {sala.andar}</small>
          <br />

          <small>Status: {STATUS_RESERVA[Number(reserva.idStatusReserva)]}</small>
          <br />

          <small>Data: {formatarPeriodoReserva(reserva)}</small>
          <br />

          <small>Motivo: {reserva.motivo || "Não informado"}</small>
          <br />

          <small>Pessoas: {reserva.qtdPessoas || "Não informado"}</small>
          <br />

          <small>
            Solicitado em: {formatarDataHoraCriacao(reserva.dataCriacao)}
          </small>

          {reserva.justificativa && (
            <>
              <br />
              <small>Justificativa: {reserva.justificativa}</small>
            </>
          )}
        </span>

        {mostrarCancelar && (
          <button
            className="btn delete"
            type="button"
            onClick={() => cancelarReserva(reserva.idReserva)}
          >
            Cancelar
          </button>
        )}
      </div>
    )
  }

  const modalReservaManual =
    modalReservaAberto &&
    createPortal(
      <div
        className="reserva-manual-modal-overlay"
        onMouseDown={fecharModalReservaManual}
      >
        <div
          className="reserva-manual-modal"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="reserva-manual-modal-header">
            <div>
              <span>Nova solicitação</span>
              <h3>Realizar reserva</h3>
              <p>Preencha os dados abaixo para solicitar uma reserva manual.</p>
            </div>

            <button
              type="button"
              className="reserva-manual-modal-close"
              onClick={fecharModalReservaManual}
              disabled={salvandoReservaManual}
              aria-label="Fechar modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={criarReservaManual} className="reserva-manual-form">
            <label className="reserva-manual-form-full">
              Sala
              <select
                value={salaManualId}
                onChange={(e) => setSalaManualId(e.target.value)}
                required
              >
                <option value="">Selecione uma sala</option>

                {salasAgrupadasPorTipo.map(([tipo, salasDoTipo]) => (
                  <optgroup key={tipo} label={tipo}>
                    {salasDoTipo.map((sala) => {
                      const detalhes = getDetalhesSala(sala.idSala)

                      return (
                        <option key={sala.idSala} value={sala.idSala}>
                          {sala.nome} | Nº {sala.numero} | {detalhes.campus} |{" "}
                          {detalhes.edificio} | Andar {detalhes.andar} | Cap.{" "}
                          {sala.capacidade}
                        </option>
                      )
                    })}
                  </optgroup>
                ))}
              </select>
            </label>

            {salaSelecionadaManual && (
              <div className="reserva-manual-sala-resumo reserva-manual-form-full">
                <div>
                  <span>Tipo</span>
                  <strong>{detalhesSalaManual.tipo}</strong>
                </div>

                <div>
                  <span>Número</span>
                  <strong>{detalhesSalaManual.numero}</strong>
                </div>

                <div>
                  <span>Campus</span>
                  <strong>{detalhesSalaManual.campus}</strong>
                </div>

                <div>
                  <span>Edifício</span>
                  <strong>{detalhesSalaManual.edificio}</strong>
                </div>

                <div>
                  <span>Andar</span>
                  <strong>{detalhesSalaManual.andar}</strong>
                </div>

                <div>
                  <span>Capacidade</span>
                  <strong>{detalhesSalaManual.capacidade} pessoas</strong>
                </div>
              </div>
            )}

            <CalendarioLetivoManual
              label="Data de início"
              valor={dataInicioManual}
              onChange={setDataInicioManual}
              aberto={calendarioManualAberto === "inicio"}
              onAbrir={() => {
                setSeletorHoraManualAberto("")
                setCalendarioManualAberto("inicio")
              }}
              onFechar={() => setCalendarioManualAberto("")}
              minDate={new Date()}
            />

            <SeletorHorarioManual
              label="Hora de início"
              valor={horaInicioManual}
              onChange={setHoraInicioManual}
              aberto={seletorHoraManualAberto === "inicio"}
              onAbrir={() => {
                setCalendarioManualAberto("")
                setSeletorHoraManualAberto("inicio")
              }}
              onFechar={() => setSeletorHoraManualAberto("")}
              horarioMinimo="08:00"
            />

            <CalendarioLetivoManual
              label="Data de fim"
              valor={dataFimManual}
              onChange={setDataFimManual}
              aberto={calendarioManualAberto === "fim"}
              onAbrir={() => {
                setSeletorHoraManualAberto("")
                setCalendarioManualAberto("fim")
              }}
              onFechar={() => setCalendarioManualAberto("")}
              minDate={new Date()}
            />

            <SeletorHorarioManual
              label="Hora de fim"
              valor={horaFimManual}
              onChange={setHoraFimManual}
              aberto={seletorHoraManualAberto === "fim"}
              onAbrir={() => {
                setCalendarioManualAberto("")
                setSeletorHoraManualAberto("fim")
              }}
              onFechar={() => setSeletorHoraManualAberto("")}
              horarioMinimo={
                horaInicioManual ? somarMinutosHorario(horaInicioManual, 15) : "08:00"
              }
            />

            <label>
              Quantidade de pessoas
              <input
                type="number"
                min="1"
                placeholder="Ex: 30"
                value={qtdPessoasManual}
                onChange={(e) => setQtdPessoasManual(e.target.value)}
                required
              />
            </label>

            <label>
              Tipo de atividade
              <select
                value={tipoAtividadeManual}
                onChange={(e) => setTipoAtividadeManual(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                <option value="Aula">Aula</option>
                <option value="Prova/Avaliação">Prova/Avaliação</option>
                <option value="Reunião">Reunião</option>
                <option value="Apresentação">Apresentação</option>
                <option value="Evento acadêmico">Evento acadêmico</option>
                <option value="Atividade prática">Atividade prática</option>
                <option value="Outro">Outro</option>
              </select>
            </label>

            <label>
              Curso / turma
              <input
                placeholder="Ex: Ciência da Computação - T1"
                value={cursoTurmaManual}
                onChange={(e) => setCursoTurmaManual(e.target.value)}
              />
            </label>

            <label className="reserva-manual-form-full">
              Descrição da atividade
              <input
                placeholder="Ex: Aula prática, reunião de projeto, apresentação..."
                value={motivoManual}
                onChange={(e) => setMotivoManual(e.target.value)}
                required
              />
            </label>

            <label className="reserva-manual-form-full">
              Justificativa adicional
              <textarea
                placeholder="Opcional"
                value={justificativaManual}
                onChange={(e) => setJustificativaManual(e.target.value)}
              />
            </label>

            {erroReservaManual && (
              <p className="reserva-manual-alert erro reserva-manual-form-full">
                {erroReservaManual}
              </p>
            )}

            {sucessoReservaManual && (
              <p className="reserva-manual-alert sucesso reserva-manual-form-full">
                {sucessoReservaManual}
              </p>
            )}

            <div className="reserva-manual-actions reserva-manual-form-full">
              <button
                className="btn secondary"
                type="button"
                onClick={fecharModalReservaManual}
                disabled={salvandoReservaManual}
              >
                Cancelar
              </button>

              <button
                className="btn primary"
                type="submit"
                disabled={salvandoReservaManual}
              >
                {salvandoReservaManual ? "Solicitando..." : "Solicitar reserva"}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )

  const modalNotificacao =
    popupNotificacao &&
    createPortal(
      <div className="popup">
        <div className="popup-box">
          <div
            className="check"
            style={{
              color:
                Number(popupNotificacao.idStatusReserva) === 2
                  ? "#22c55e"
                  : "#ef4444",
            }}
          >
            {Number(popupNotificacao.idStatusReserva) === 2 ? "✔" : "✖"}
          </div>

          <h3>
            {Number(popupNotificacao.idStatusReserva) === 2
              ? "Reserva aprovada!"
              : Number(popupNotificacao.idStatusReserva) === 4
              ? "Reserva cancelada"
              : "Reserva recusada"}
          </h3>

          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Sala: {getNomeSala(popupNotificacao.idSala)}
          </p>

          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
            Data: {formatarPeriodoReserva(popupNotificacao)}
          </p>

          {popupNotificacao.justificativa && (
            <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
              Motivo: {popupNotificacao.justificativa}
            </p>
          )}

          <button
            className="btn primary"
            type="button"
            onClick={() => setPopupNotificacao(null)}
            style={{ marginTop: "14px" }}
          >
            Entendi
          </button>
        </div>
      </div>,
      document.body
    )

  return (
    <div className="status-reservas-page">
      <div className="card status-reservas-header-card">
        <div>
          <h3>Status das Reservas</h3>
          <p className="subtitle">
            Acompanhe suas reservas pendentes, aprovadas, recusadas e canceladas.
          </p>
        </div>

        <button
          className="btn primary status-reservas-new-button"
          type="button"
          onClick={abrirModalReservaManual}
        >
          + Realizar reserva
        </button>
      </div>

      <div className="card">
        <h3>Reservas pendentes</h3>

        {reservasPendentes.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva pendente.</p>
        )}

        {reservasPendentes.map((r) => (
          <ReservaCard key={r.idReserva} reserva={r} mostrarCancelar />
        ))}
      </div>

      <div className="card">
        <h3>Reservas aprovadas</h3>

        {reservasAprovadas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhuma reserva aprovada.</p>
        )}

        {reservasAprovadas.map((r) => (
          <ReservaCard key={r.idReserva} reserva={r} />
        ))}
      </div>

      <div className="card">
        <h3>Histórico de reservas</h3>

        {historicoReservas.length === 0 && (
          <p style={{ marginTop: "12px" }}>Nenhum histórico encontrado.</p>
        )}

        {historicoReservas.map((r) => (
          <ReservaCard key={r.idReserva} reserva={r} />
        ))}
      </div>

      {modalReservaManual}
      {modalNotificacao}
    </div>
  )
}

export default StatusReservasDesktop
