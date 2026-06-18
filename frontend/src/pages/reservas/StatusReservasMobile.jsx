import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import "./StatusReservasMobile.css"
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
      <svg viewBox="0 0 24 24" className="reservas-mobile-manual-input-icon-svg">
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="reservas-mobile-manual-input-icon-svg">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
      <path d="M7 3.5 4.5 6M17 3.5 19.5 6" />
    </svg>
  )
}


function IconeReservaMobile({ tipo }) {
  const desenhos = {
    calendario: (
      <>
        <rect x="4.2" y="5.2" width="15.6" height="14.3" rx="3" />
        <path d="M8 3.6v3.8M16 3.6v3.8M5.1 9.2h13.8" />
        <path d="M8.4 14.2l2.2 2.2 5.2-5.4" />
      </>
    ),
    sala: (
      <>
        <rect x="4.2" y="3.2" width="15.6" height="17.6" rx="2.6" />
        <path d="M8 7.2h2M14 7.2h2M8 11.5h2M14 11.5h2M8 15.8h2M14 15.8h2M11 20.8v-4h2v4" />
      </>
    ),
    relogio: (
      <>
        <circle cx="12" cy="12" r="8.3" />
        <path d="M12 7.4v4.8l3.1 1.9" />
      </>
    ),
    pessoas: (
      <>
        <circle cx="9" cy="8.8" r="3" />
        <circle cx="17" cy="9.8" r="2.3" />
        <path d="M4.2 18.7c.8-2.8 2.7-4.3 5.8-4.3s5 1.5 5.8 4.3" />
        <path d="M15.3 18.3c.5-1.9 1.9-3 4.2-3.2" />
      </>
    ),
    mais: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    seta: (
      <>
        <path d="M5 12h13.5" />
        <path d="m14.2 6.8 5.1 5.2-5.1 5.2" />
      </>
    ),
    fechar: (
      <>
        <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
      </>
    ),
    alerta: (
      <>
        <path d="M12 4.2 20.2 19H3.8L12 4.2z" />
        <path d="M12 9.4v4.2M12 16.8h.01" />
      </>
    ),
    arquivo: (
      <>
        <path d="M7 3.5h7l4 4V20.5H7z" />
        <path d="M14 3.5v5h5M9.5 12.5h5M9.5 16h5" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {desenhos[tipo] || desenhos.arquivo}
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
    <div className="reservas-mobile-manual-time-box">
      <label>{label}</label>

      <button
        type="button"
        className={`reservas-mobile-manual-time-trigger ${aberto ? "aberto" : ""}`}
        onClick={aberto ? onFechar : onAbrir}
      >
        <span>{valor || "--:--"}</span>
        <strong>
          <IconeReservaManual tipo="relogio" />
        </strong>
      </button>

      {aberto && (
        <div className="reservas-mobile-manual-time-panel">
          <div className="reservas-mobile-manual-time-panel-header">
            <strong>{label}</strong>
            <span>08:00 às 23:00 • intervalos de 15 min</span>
          </div>

          <div className="reservas-mobile-manual-time-list">
            {horariosDisponiveis.length === 0 && (
              <span className="reservas-mobile-manual-time-empty">
                Nenhum horário disponível após o início selecionado.
              </span>
            )}

            {horariosDisponiveis.map((horario) => (
              <button
                key={horario}
                type="button"
                className={
                  valor === horario
                    ? "reservas-mobile-manual-time-option selecionado"
                    : "reservas-mobile-manual-time-option"
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
    <div className="reservas-mobile-manual-calendar-box">
      <label>{label}</label>

      <button
        type="button"
        className={`reservas-mobile-manual-calendar-trigger ${aberto ? "aberto" : ""}`}
        onClick={aberto ? onFechar : onAbrir}
      >
        <span>{valor ? formatarDataInputVisual(valor) : "Selecione uma data"}</span>
        <strong>
          <IconeReservaManual tipo="calendario" />
        </strong>
      </button>

      {aberto && (
        <div className="reservas-mobile-manual-calendar-panel">
          <div className="reservas-mobile-manual-calendar-header">
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

          <div className="reservas-mobile-manual-calendar-week">
            {DIAS_SEMANA.map((dia, index) => (
              <span key={`${dia}-${index}`} className={index === 0 ? "domingo" : ""}>
                {dia}
              </span>
            ))}
          </div>

          <div className="reservas-mobile-manual-calendar-days">
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
                    "reservas-mobile-manual-calendar-day",
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

          <div className="reservas-mobile-manual-calendar-footer">
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

function StatusReservasMobile() {
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
  const [filtroAtivo, setFiltroAtivo] = useState("pendentes")
  const [reservaParaCancelar, setReservaParaCancelar] = useState(null)

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
    if (modalReservaAberto || popupNotificacao || reservaParaCancelar) {
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

      setReservaParaCancelar(null)
      window.dispatchEvent(new Event("reservas-atualizadas"))
    } catch (error) {
      console.error("Erro ao cancelar reserva:", error)
      setReservaParaCancelar(null)
      setPopupNotificacao({
        idStatusReserva: 3,
        idSala: "",
        justificativa: "Não foi possível cancelar a reserva. Tente novamente.",
      })
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

  const reservasExibidas = useMemo(() => {
    if (filtroAtivo === "aprovadas") return reservasAprovadas
    if (filtroAtivo === "historico") return historicoReservas
    return reservasPendentes
  }, [filtroAtivo, reservasPendentes, reservasAprovadas, historicoReservas])

  function ReservaCard({ reserva, mostrarCancelar = false }) {
    const sala = getDetalhesSala(reserva.idSala)
    const statusNumero = Number(reserva.idStatusReserva)
    const statusClasse =
      CLASSE_STATUS_RESERVA[statusNumero] || "pendente"

    return (
      <article className={`reservas-mobile-card status-${statusClasse}`}>
        <header className="reservas-mobile-card-header">
          <span className="reservas-mobile-card-room-icon">
            <IconeReservaMobile tipo="sala" />
          </span>

          <div>
            <small>{sala.tipo}</small>
            <h2>{sala.nome}</h2>
            <p>
              {sala.numero !== "Não informado" ? `Sala ${sala.numero}` : "Ambiente acadêmico"}
              {" · "}
              {sala.campus}
            </p>
          </div>

          <span className={`reservas-mobile-status ${statusClasse}`}>
            {STATUS_RESERVA[statusNumero] || "Pendente"}
          </span>
        </header>

        <div className="reservas-mobile-card-period">
          <span>
            <IconeReservaMobile tipo="calendario" />
          </span>

          <div>
            <small>Período reservado</small>
            <strong>{formatarPeriodoReserva(reserva)}</strong>
          </div>
        </div>

        <div className="reservas-mobile-card-info">
          <span>
            <IconeReservaMobile tipo="pessoas" />
            {reserva.qtdPessoas || "0"} pessoa(s)
          </span>

          <span>
            <IconeReservaMobile tipo="relogio" />
            Criada em {formatarDataHoraCriacao(reserva.dataCriacao)}
          </span>
        </div>

        <div className="reservas-mobile-card-reason">
          <small>Motivo da reserva</small>
          <p>{reserva.motivo || "Não informado"}</p>
        </div>

        <details className="reservas-mobile-card-details">
          <summary>
            <span>Ver detalhes</span>
            <IconeReservaMobile tipo="seta" />
          </summary>

          <div>
            <p>
              <small>Edifício</small>
              <strong>{sala.edificio}</strong>
            </p>
            <p>
              <small>Andar</small>
              <strong>{sala.andar}</strong>
            </p>
            <p>
              <small>Instituição</small>
              <strong>{sala.instituicao}</strong>
            </p>
            <p>
              <small>Solicitante</small>
              <strong>{reserva.nomeUsuarioReserva || "Não informado"}</strong>
            </p>

            {reserva.justificativa && (
              <p className="reservas-mobile-card-details-full">
                <small>Justificativa</small>
                <strong>{reserva.justificativa}</strong>
              </p>
            )}
          </div>
        </details>

        {mostrarCancelar && (
          <button
            className="reservas-mobile-cancel-button"
            type="button"
            onClick={() => setReservaParaCancelar(reserva)}
          >
            Cancelar reserva
          </button>
        )}
      </article>
    )
  }

  const modalReservaManual =
    modalReservaAberto &&
    createPortal(
      <div
        className="reservas-mobile-manual-modal-overlay"
        onMouseDown={fecharModalReservaManual}
      >
        <div
          className="reservas-mobile-manual-modal"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="reservas-mobile-manual-modal-header">
            <div>
              <span>Nova solicitação</span>
              <h3>Realizar reserva</h3>
              <p>Preencha os dados abaixo para solicitar uma reserva manual.</p>
            </div>

            <button
              type="button"
              className="reservas-mobile-manual-modal-close"
              onClick={fecharModalReservaManual}
              disabled={salvandoReservaManual}
              aria-label="Fechar modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={criarReservaManual} className="reservas-mobile-manual-form">
            <label className="reservas-mobile-manual-form-full">
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
              <div className="reservas-mobile-manual-sala-resumo reservas-mobile-manual-form-full">
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

            <label className="reservas-mobile-manual-form-full">
              Descrição da atividade
              <input
                placeholder="Ex: Aula prática, reunião de projeto, apresentação..."
                value={motivoManual}
                onChange={(e) => setMotivoManual(e.target.value)}
                required
              />
            </label>

            <label className="reservas-mobile-manual-form-full">
              Justificativa adicional
              <textarea
                placeholder="Opcional"
                value={justificativaManual}
                onChange={(e) => setJustificativaManual(e.target.value)}
              />
            </label>

            {erroReservaManual && (
              <p className="reservas-mobile-manual-alert erro reservas-mobile-manual-form-full">
                {erroReservaManual}
              </p>
            )}

            {sucessoReservaManual && (
              <p className="reservas-mobile-manual-alert sucesso reservas-mobile-manual-form-full">
                {sucessoReservaManual}
              </p>
            )}

            <div className="reservas-mobile-manual-actions reservas-mobile-manual-form-full">
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
      <div className="reservas-mobile-popup-overlay">
        <div className="reservas-mobile-popup-card">
          <span
            className={
              Number(popupNotificacao.idStatusReserva) === 2
                ? "reservas-mobile-popup-symbol success"
                : "reservas-mobile-popup-symbol alert"
            }
          >
            {Number(popupNotificacao.idStatusReserva) === 2 ? "✓" : "!"}
          </span>

          <h3>
            {Number(popupNotificacao.idStatusReserva) === 2
              ? "Reserva aprovada!"
              : Number(popupNotificacao.idStatusReserva) === 4
              ? "Reserva cancelada"
              : "Atualização da reserva"}
          </h3>

          {popupNotificacao.idSala && (
            <>
              <p>Sala: {getNomeSala(popupNotificacao.idSala)}</p>
              <small>Período: {formatarPeriodoReserva(popupNotificacao)}</small>
            </>
          )}

          {popupNotificacao.justificativa && (
            <small className="reservas-mobile-popup-message">
              {popupNotificacao.justificativa}
            </small>
          )}

          <button
            type="button"
            onClick={() => setPopupNotificacao(null)}
          >
            Entendi
          </button>
        </div>
      </div>,
      document.body
    )

  const modalCancelarReserva =
    reservaParaCancelar &&
    createPortal(
      <div
        className="reservas-mobile-popup-overlay"
        onMouseDown={() => setReservaParaCancelar(null)}
      >
        <div
          className="reservas-mobile-confirm-card"
          onMouseDown={(evento) => evento.stopPropagation()}
        >
          <span className="reservas-mobile-confirm-icon">
            <IconeReservaMobile tipo="alerta" />
          </span>

          <h3>Cancelar esta reserva?</h3>
          <p>
            A sala será liberada e essa ação ficará registrada no seu histórico.
          </p>

          <div className="reservas-mobile-confirm-summary">
            <strong>{getNomeSala(reservaParaCancelar.idSala)}</strong>
            <span>{formatarPeriodoReserva(reservaParaCancelar)}</span>
          </div>

          <div className="reservas-mobile-confirm-actions">
            <button
              type="button"
              className="reservas-mobile-confirm-back"
              onClick={() => setReservaParaCancelar(null)}
            >
              Voltar
            </button>

            <button
              type="button"
              className="reservas-mobile-confirm-delete"
              onClick={() => cancelarReserva(reservaParaCancelar.idReserva)}
            >
              Cancelar reserva
            </button>
          </div>
        </div>
      </div>,
      document.body
    )

  return (
    <div className="reservas-mobile-page">
      <section className="reservas-mobile-hero">
        <div className="reservas-mobile-hero-decoration" aria-hidden="true">
          <span />
          <i />
        </div>

        <div>
          <span>MINHAS RESERVAS</span>
          <h1>Organize seus ambientes.</h1>
          <p>Acompanhe solicitações, confirmações e histórico em um único lugar.</p>
        </div>

        <button
          type="button"
          className="reservas-mobile-new-button"
          onClick={abrirModalReservaManual}
        >
          <IconeReservaMobile tipo="mais" />
          <span>Nova reserva</span>
        </button>
      </section>

      <section className="reservas-mobile-summary">
        <button
          type="button"
          className={filtroAtivo === "pendentes" ? "active pending" : "pending"}
          onClick={() => setFiltroAtivo("pendentes")}
        >
          <span>{reservasPendentes.length}</span>
          <small>Pendentes</small>
        </button>

        <button
          type="button"
          className={filtroAtivo === "aprovadas" ? "active approved" : "approved"}
          onClick={() => setFiltroAtivo("aprovadas")}
        >
          <span>{reservasAprovadas.length}</span>
          <small>Aprovadas</small>
        </button>

        <button
          type="button"
          className={filtroAtivo === "historico" ? "active history" : "history"}
          onClick={() => setFiltroAtivo("historico")}
        >
          <span>{historicoReservas.length}</span>
          <small>Histórico</small>
        </button>
      </section>

      <section className="reservas-mobile-list-section">
        <div className="reservas-mobile-list-header">
          <div>
            <span>
              {filtroAtivo === "pendentes"
                ? "AGUARDANDO ANÁLISE"
                : filtroAtivo === "aprovadas"
                ? "RESERVAS CONFIRMADAS"
                : "RESERVAS FINALIZADAS"}
            </span>

            <h2>
              {filtroAtivo === "pendentes"
                ? "Solicitações pendentes"
                : filtroAtivo === "aprovadas"
                ? "Reservas aprovadas"
                : "Histórico de reservas"}
            </h2>
          </div>

          <span className="reservas-mobile-list-counter">
            {reservasExibidas.length}
          </span>
        </div>

        {reservasExibidas.length ? (
          <div className="reservas-mobile-list">
            {reservasExibidas.map((reserva) => (
              <ReservaCard
                key={reserva.idReserva}
                reserva={reserva}
                mostrarCancelar={Number(reserva.idStatusReserva) === 1}
              />
            ))}
          </div>
        ) : (
          <div className="reservas-mobile-empty">
            <span>
              <IconeReservaMobile tipo="arquivo" />
            </span>

            <h3>
              {filtroAtivo === "pendentes"
                ? "Nenhuma reserva pendente"
                : filtroAtivo === "aprovadas"
                ? "Nenhuma reserva aprovada"
                : "Nenhum histórico disponível"}
            </h3>

            <p>
              {filtroAtivo === "pendentes"
                ? "Suas novas solicitações aparecerão aqui para acompanhamento."
                : filtroAtivo === "aprovadas"
                ? "Quando uma reserva for aprovada, ela ficará visível nesta área."
                : "Reservas recusadas ou canceladas serão exibidas aqui."}
            </p>

            {filtroAtivo === "pendentes" && (
              <button type="button" onClick={abrirModalReservaManual}>
                Realizar reserva
              </button>
            )}
          </div>
        )}
      </section>

      {modalReservaManual}
      {modalNotificacao}
      {modalCancelarReserva}
    </div>
  )

}

export default StatusReservasMobile
