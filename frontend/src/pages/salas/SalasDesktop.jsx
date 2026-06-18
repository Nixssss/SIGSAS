import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
  salasService,
  edificiosService,
  campiService,
  instituicoesService,
  reservasService,
  tiposSalaService,
  recursosService,
} from "../../services/adminService"

const STATUS_RESERVA = {
  1: "Pendente",
  2: "Aprovada",
  3: "Recusada",
  4: "Cancelada",
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

const HORARIOS_RESERVA = Array.from({ length: 61 }, (_, index) => {
  const totalMinutos = 8 * 60 + index * 15
  const hora = String(Math.floor(totalMinutos / 60)).padStart(2, "0")
  const minuto = String(totalMinutos % 60).padStart(2, "0")

  return `${hora}:${minuto}`
})

function formatarDataInput(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")

  return `${ano}-${mes}-${dia}`
}

function formatarDataVisual(valor) {
  if (!valor) return ""

  const [ano, mes, dia] = valor.split("-")
  return `${dia}/${mes}/${ano}`
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

function IconeReserva({ tipo }) {
  if (tipo === "calendario") {
    return (
      <svg viewBox="0 0 24 24" className="reserva-input-icon-svg">
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="reserva-input-icon-svg">
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

function RelogioReserva({
  label,
  valor,
  onChange,
  aberto,
  onAbrir,
  onFechar,
  horarioMinimo = "08:00",
}) {
  const horariosDisponiveis = HORARIOS_RESERVA.filter((horario) => {
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
    <div className="relogio-reserva-box">
      <label className="relogio-reserva-label">{label}</label>

      <button
        type="button"
        className={`relogio-reserva-input ${aberto ? "aberto" : ""}`}
        onClick={aberto ? onFechar : onAbrir}
      >
        <span>{valor || "--:--"}</span>
        <strong>
          <IconeReserva tipo="relogio" />
        </strong>
      </button>

      {aberto && (
        <div className="relogio-reserva-panel">
          <div className="relogio-reserva-panel-header">
            <strong>{label}</strong>
            <span>08:00 às 23:00 • intervalos de 15 min</span>
          </div>

          <div className="relogio-reserva-lista">
            {horariosDisponiveis.length === 0 && (
              <span className="relogio-reserva-empty">
                Nenhum horário disponível após o início selecionado.
              </span>
            )}

            {horariosDisponiveis.map((horario) => (
              <button
                key={horario}
                type="button"
                className={
                  valor === horario
                    ? "relogio-reserva-opcao selecionado"
                    : "relogio-reserva-opcao"
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

function CalendarioReserva({
  label,
  valor,
  onChange,
  isDiaIndisponivel,
  minDate,
  aberto,
  onAbrir,
  onFechar,
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

  const diasDoCalendario = useMemo(() => {
    if (!mesVisivel) return []

    const ano = mesVisivel.getFullYear()
    const mes = mesVisivel.getMonth()
    const primeiroDiaMes = new Date(ano, mes, 1)
    const ultimoDiaMes = new Date(ano, mes + 1, 0)
    const lista = []

    for (let i = 0; i < primeiroDiaMes.getDay(); i += 1) {
      lista.push(null)
    }

    for (let dia = 1; dia <= ultimoDiaMes.getDate(); dia += 1) {
      lista.push(new Date(ano, mes, dia))
    }

    return lista
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

    const dataComparacao = new Date(data)
    dataComparacao.setHours(0, 0, 0, 0)

    const bloqueado =
      data.getDay() === 0 ||
      dataComparacao < hoje ||
      isDiaIndisponivel(data)

    if (bloqueado) return

    onChange(formatarDataInput(data))
    onFechar()
  }

  return (
    <div className="calendario-reserva-box">
      <label className="calendario-reserva-label">{label}</label>

      <button
        type="button"
        className={`calendario-reserva-input ${aberto ? "aberto" : ""}`}
        onClick={aberto ? onFechar : onAbrir}
      >
        <span>{valor ? formatarDataVisual(valor) : "Selecione uma data"}</span>
        <strong>
          <IconeReserva tipo="calendario" />
        </strong>
      </button>

      {aberto && (
        <div className="calendario-reserva">
          <div className="calendario-reserva-header">
            <button type="button" onClick={voltarMes} disabled={indiceMes === 0}>
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

          <div className="calendario-reserva-semana">
            {DIAS_SEMANA.map((dia, index) => (
              <span
                key={`${dia}-${index}`}
                className={index === 0 ? "domingo" : ""}
              >
                {dia}
              </span>
            ))}
          </div>

          <div className="calendario-reserva-dias">
            {diasDoCalendario.map((data, index) => {
              if (!data) {
                return <span key={`vazio-${index}`} className="dia-vazio" />
              }

              const dataComparacao = new Date(data)
              dataComparacao.setHours(0, 0, 0, 0)

              const domingo = data.getDay() === 0
              const passado = dataComparacao < hoje
              const indisponivel = isDiaIndisponivel(data)
              const selecionado = datasMesmoDia(data, dataSelecionada)

              return (
                <button
                  key={formatarDataInput(data)}
                  type="button"
                  className={[
                    "calendario-dia",
                    domingo ? "domingo" : "",
                    indisponivel || passado ? "indisponivel" : "",
                    selecionado ? "selecionado" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={domingo || indisponivel || passado}
                  onClick={() => selecionarDia(data)}
                  title={
                    domingo
                      ? "Domingo indisponível"
                      : indisponivel
                      ? "Sem salas disponíveis nesta data"
                      : passado
                      ? "Data já passou"
                      : "Selecionar data"
                  }
                >
                  {data.getDate()}
                </button>
              )
            })}
          </div>

          <div className="calendario-reserva-legenda">
            <span>
              <i className="legenda-disponivel" /> Disponível
            </span>

            <span>
              <i className="legenda-indisponivel" /> Indisponível
            </span>

            <small>Meses letivos do semestre atual.</small>
          </div>
        </div>
      )}
    </div>
  )
}

function SalasDesktop() {
  const [salas, setSalas] = useState([])
  const [edificios, setEdificios] = useState([])
  const [campi, setCampi] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [reservas, setReservas] = useState([])
  const [tiposSala, setTiposSala] = useState([])
  const [recursosDisponiveis, setRecursosDisponiveis] = useState([])

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
  const [carregando, setCarregando] = useState(false)
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [relogioAberto, setRelogioAberto] = useState("")
  const [calendarioAberto, setCalendarioAberto] = useState("")

  async function carregarDados() {
    try {
      setCarregandoDados(true)
      setErroReserva("")

      const [
        salasApi,
        edificiosApi,
        campiApi,
        instituicoesApi,
        reservasApi,
        tiposSalaApi,
        recursosApi,
      ] = await Promise.all([
        salasService.listar(),
        edificiosService.listar(),
        campiService.listar(),
        instituicoesService.listar(),
        reservasService.listar(),
        tiposSalaService.listar(),
        recursosService.listar(),
      ])

      setSalas(Array.isArray(salasApi) ? salasApi : [])
      setEdificios(Array.isArray(edificiosApi) ? edificiosApi : [])
      setCampi(Array.isArray(campiApi) ? campiApi : [])
      setInstituicoes(Array.isArray(instituicoesApi) ? instituicoesApi : [])
      setReservas(Array.isArray(reservasApi) ? reservasApi : [])
      setTiposSala(Array.isArray(tiposSalaApi) ? tiposSalaApi : [])
      setRecursosDisponiveis(Array.isArray(recursosApi) ? recursosApi : [])
    } catch (error) {
      console.error("Erro ao carregar dados de salas:", error)
      setErroReserva("Erro ao carregar dados das salas.")
      setSalas([])
      setEdificios([])
      setCampi([])
      setInstituicoes([])
      setReservas([])
      setTiposSala([])
      setRecursosDisponiveis([])
    } finally {
      setCarregandoDados(false)
    }
  }

  useEffect(() => {
    carregarDados()

    function atualizarSalasEReservas() {
      carregarDados()
    }

    window.addEventListener("focus", atualizarSalasEReservas)
    window.addEventListener("reservas-atualizadas", atualizarSalasEReservas)

    return () => {
      window.removeEventListener("focus", atualizarSalasEReservas)
      window.removeEventListener("reservas-atualizadas", atualizarSalasEReservas)
    }
  }, [])

  useEffect(() => {
    if (salaSelecionada || sucessoReserva) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [salaSelecionada, sucessoReserva])

  useEffect(() => {
    if (!horaInicio || !horaFim) return

    const minutosInicio = horarioParaMinutos(horaInicio)
    const minutosFim = horarioParaMinutos(horaFim)

    if (minutosInicio !== null && minutosFim !== null && minutosFim <= minutosInicio) {
      setHoraFim("")
    }
  }, [horaInicio, horaFim])

  function normalizarTexto(texto) {
    return (texto || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  function getIdGenerico(item) {
    return Number(
      item?.id ||
        item?.idSala ||
        item?.idEdificio ||
        item?.idCampus ||
        item?.idInstituicao ||
        item?.idTipoSala ||
        item?.idRecurso
    )
  }

  function getTipoSala(id) {
    return (
      tiposSala.find((t) => getIdGenerico(t) === Number(id))?.nome ||
      tiposSala.find((t) => Number(t.idTipoSala) === Number(id))?.nome ||
      "?"
    )
  }

  function getNomeRecurso(id) {
    return (
      recursosDisponiveis.find((r) => getIdGenerico(r) === Number(id))?.nome ||
      recursosDisponiveis.find((r) => Number(r.idRecurso) === Number(id))
        ?.nome ||
      "?"
    )
  }

  function extrairIdsRecursos(sala) {
    if (!sala) return []

    if (Array.isArray(sala.recursos)) {
      return sala.recursos.map((recurso) => {
        if (typeof recurso === "object") {
          return getIdGenerico(recurso)
        }

        return Number(recurso)
      })
    }

    if (Array.isArray(sala.idsRecursos)) {
      return sala.idsRecursos.map((id) => Number(id))
    }

    if (Array.isArray(sala.recursosIds)) {
      return sala.recursosIds.map((id) => Number(id))
    }

    return []
  }

  function getNomesRecursos(ids = []) {
    return ids.map((id) => getNomeRecurso(id)).filter((nome) => nome !== "?")
  }

  function getNomeEdificio(id) {
    return (
      edificios.find((e) => getIdGenerico(e) === Number(id))?.nome ||
      edificios.find((e) => Number(e.idEdificio) === Number(id))?.nome ||
      "?"
    )
  }

  function getCampusPorEdificio(idEdificio) {
    const edificio = edificios.find(
      (e) =>
        getIdGenerico(e) === Number(idEdificio) ||
        Number(e.idEdificio) === Number(idEdificio)
    )

    if (!edificio) return null

    const idCampus =
      edificio.idCampus ||
      edificio.id_campus ||
      edificio.campusId ||
      edificio.idCampusFk

    return (
      campi.find((c) => getIdGenerico(c) === Number(idCampus)) ||
      campi.find((c) => Number(c.idCampus) === Number(idCampus)) ||
      null
    )
  }

  function getInstituicaoPorCampus(idCampus) {
    const campus = campi.find(
      (c) =>
        getIdGenerico(c) === Number(idCampus) ||
        Number(c.idCampus) === Number(idCampus)
    )

    if (!campus) return null

    const idInstituicao =
      campus.idInstituicao ||
      campus.id_instituicao ||
      campus.instituicaoId ||
      campus.idInstituicaoFk

    return (
      instituicoes.find((i) => getIdGenerico(i) === Number(idInstituicao)) ||
      instituicoes.find(
        (i) => Number(i.idInstituicao) === Number(idInstituicao)
      ) ||
      null
    )
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

  function dataHoraParaTimestamp(data, hora) {
    return new Date(`${data}T${hora}`).getTime()
  }

  function formatarDataReservaBR(data) {
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

  function formatarHoraReservaBR(hora) {
    if (!hora) return "Não informada"

    const texto = String(hora).trim()

    if (/^\d{2}:\d{2}/.test(texto)) {
      return texto.slice(0, 5)
    }

    return texto
  }

  function formatarPeriodoReserva(reserva) {
    const dataInicioFormatada = formatarDataReservaBR(reserva.dataInicio)
    const dataFimFormatada = formatarDataReservaBR(reserva.dataFim)
    const horaInicioFormatada = formatarHoraReservaBR(reserva.horaInicio)
    const horaFimFormatada = formatarHoraReservaBR(reserva.horaFim)

    if (dataInicioFormatada === dataFimFormatada) {
      return `${dataInicioFormatada}, das ${horaInicioFormatada} às ${horaFimFormatada}`
    }

    return `${dataInicioFormatada} às ${horaInicioFormatada} até ${dataFimFormatada} às ${horaFimFormatada}`
  }

  function reservaBloqueiaDia(reserva, data) {
    if (!reserva?.dataInicio || !reserva?.dataFim) return false

    if (
      Number(reserva.idStatusReserva) === 3 ||
      Number(reserva.idStatusReserva) === 4
    ) {
      return false
    }

    const inicio = criarDataLocal(reserva.dataInicio)
    const fim = criarDataLocal(reserva.dataFim)

    if (!inicio || !fim) return false

    inicio.setHours(0, 0, 0, 0)
    fim.setHours(23, 59, 59, 999)

    const dataComparacao = new Date(data)
    dataComparacao.setHours(12, 0, 0, 0)

    return dataComparacao >= inicio && dataComparacao <= fim
  }

  function salaDisponivelNoDia(sala, data) {
    if (!sala?.ativo) return false

    const reservaDaSala = reservas.find(
      (reserva) =>
        Number(reserva.idSala) === Number(sala.idSala) &&
        reservaBloqueiaDia(reserva, data)
    )

    return !reservaDaSala
  }

  function diaSemDisponibilidade(data) {
    if (data.getDay() === 0) return true

    const salasAtivas = salas.filter((sala) => sala.ativo)

    if (salasAtivas.length === 0) return true

    const existeSalaDisponivel = salasAtivas.some((sala) =>
      salaDisponivelNoDia(sala, data)
    )

    return !existeSalaDisponivel
  }

  function salaSelecionadaIndisponivelNoDia(data) {
    if (!salaSelecionada) return false

    if (data.getDay() === 0) return true

    return !salaDisponivelNoDia(salaSelecionada, data)
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
      if (Number(r.idSala) !== Number(novaReserva.idSala)) return false

      if (Number(r.idStatusReserva) === 3 || Number(r.idStatusReserva) === 4) {
        return false
      }

      const inicioExistente = dataHoraParaTimestamp(r.dataInicio, r.horaInicio)
      const fimExistente = dataHoraParaTimestamp(r.dataFim, r.horaFim)

      return inicioNova < fimExistente && fimNova > inicioExistente
    })
  }

  function getReservaBloqueanteDaSala(idSala) {
    return reservas.find(
      (r) =>
        Number(r.idSala) === Number(idSala) &&
        (Number(r.idStatusReserva) === 1 || Number(r.idStatusReserva) === 2)
    )
  }

  function salaEstaAtiva(sala) {
    return sala?.ativo === true || sala?.ativo === 1 || sala?.ativo === "1"
  }

  function salaEstaBloqueada(sala) {
    return !salaEstaAtiva(sala) || Boolean(getReservaBloqueanteDaSala(sala.idSala))
  }

  function abrirReserva(sala) {
    const reservaBloqueante = getReservaBloqueanteDaSala(sala.idSala)

    if (!salaEstaAtiva(sala)) return
    if (reservaBloqueante) return

    setSalaSelecionada(sala)
    setErroReserva("")
    setDataInicio("")
    setHoraInicio("08:00")
    setDataFim("")
    setHoraFim("")
    setMotivo("")
    setJustificativa("")
    setQtdPessoas("")
    setRelogioAberto("")
    setCalendarioAberto("")
  }

  function fecharReserva() {
    if (carregando) return

    setSalaSelecionada(null)
    setErroReserva("")
    setRelogioAberto("")
    setCalendarioAberto("")
  }

  async function confirmarReserva(e) {
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

    const dataInicioObj = criarDataLocal(dataInicio)
    const dataFimObj = criarDataLocal(dataFim)

    if (
      diaSemDisponibilidade(dataInicioObj) ||
      diaSemDisponibilidade(dataFimObj)
    ) {
      setErroReserva("A data selecionada está indisponível para reservas.")
      return
    }

    if (
      salaSelecionadaIndisponivelNoDia(dataInicioObj) ||
      salaSelecionadaIndisponivelNoDia(dataFimObj)
    ) {
      setErroReserva("Esta sala não está disponível na data selecionada.")
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
      setErroReserva("A data/hora final deve ser pelo menos 15 minutos após o início.")
      return
    }

    const usuarioReserva = getUsuarioLogado()

    const novaReserva = {
      idSala: salaSelecionada.idSala,
      idUsuarioReserva: usuarioReserva.id,
      nomeUsuarioReserva: usuarioReserva.nome,
      matriculaUsuarioReserva: usuarioReserva.matricula,
      cargoUsuarioReserva: usuarioReserva.cargo,
      instituicaoUsuarioReserva: usuarioReserva.instituicao,
      dataInicio,
      horaInicio,
      dataFim,
      horaFim,
      motivo: motivo.trim(),
      qtdPessoas: quantidade,
    }

    if (justificativa.trim()) {
      novaReserva.justificativa = justificativa.trim()
    }

    if (existeConflitoReserva(novaReserva)) {
      setErroReserva("Já existe uma reserva para essa sala nesse intervalo.")
      return
    }

    try {
      setCarregando(true)

      const reservaCriada = await reservasService.criar(novaReserva)

      setReservas((prev) => [...prev, reservaCriada])
      fecharReserva()

      setSucessoReserva(true)
      window.dispatchEvent(new Event("reservas-atualizadas"))

      setTimeout(() => {
        setSucessoReserva(false)
      }, 2500)
    } catch (error) {
      console.error("Erro ao solicitar reserva:", error)

      if (error.response?.status === 409) {
        setErroReserva("Já existe uma reserva para essa sala nesse intervalo.")
      } else if (error.response?.data?.detail) {
        setErroReserva(error.response.data.detail)
      } else {
        setErroReserva("Erro ao solicitar reserva.")
      }
    } finally {
      setCarregando(false)
    }
  }

  const termoBusca = normalizarTexto(busca)

  const salasFiltradas = salas.filter((s) => {
    const campus = getCampusPorEdificio(s.idEdificio)
    const instituicao = campus ? getInstituicaoPorCampus(campus.id) : null
    const recursosSala = extrairIdsRecursos(s)
    const nomesRecursos = getNomesRecursos(recursosSala)

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

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const modalReserva =
    salaSelecionada &&
    createPortal(
      <div className="reserva-modal-overlay" onMouseDown={fecharReserva}>
        <div
          className="reserva-modal"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="reserva-modal-header">
            <div>
              <h3>Reservar sala</h3>
              <p>
                Domingos e dias indisponíveis ficam bloqueados no calendário.
              </p>
            </div>

            <button
              type="button"
              className="reserva-modal-close"
              onClick={fecharReserva}
              disabled={carregando}
              aria-label="Fechar modal"
            >
              ×
            </button>
          </div>

          <div className="reserva-modal-body">
            <div className="reserva-sala-resumo">
              <strong>{salaSelecionada.nome}</strong>
              <span>Capacidade: {salaSelecionada.capacidade} pessoas</span>
            </div>

            <form onSubmit={confirmarReserva} className="reserva-form">
              <CalendarioReserva
                label="Data de início"
                valor={dataInicio}
                onChange={setDataInicio}
                isDiaIndisponivel={salaSelecionadaIndisponivelNoDia}
                minDate={hoje}
                aberto={calendarioAberto === "inicio"}
                onAbrir={() => {
                  setRelogioAberto("")
                  setCalendarioAberto("inicio")
                }}
                onFechar={() => setCalendarioAberto("")}
              />

              <RelogioReserva
                label="Hora de início"
                valor={horaInicio}
                onChange={setHoraInicio}
                aberto={relogioAberto === "inicio"}
                onAbrir={() => {
                  setCalendarioAberto("")
                  setRelogioAberto("inicio")
                }}
                onFechar={() => setRelogioAberto("")}
                horarioMinimo="08:00"
              />

              <CalendarioReserva
                label="Data de fim"
                valor={dataFim}
                onChange={setDataFim}
                isDiaIndisponivel={salaSelecionadaIndisponivelNoDia}
                minDate={hoje}
                aberto={calendarioAberto === "fim"}
                onAbrir={() => {
                  setRelogioAberto("")
                  setCalendarioAberto("fim")
                }}
                onFechar={() => setCalendarioAberto("")}
              />

              <RelogioReserva
                label="Hora de fim"
                valor={horaFim}
                onChange={setHoraFim}
                aberto={relogioAberto === "fim"}
                onAbrir={() => {
                  setCalendarioAberto("")
                  setRelogioAberto("fim")
                }}
                onFechar={() => setRelogioAberto("")}
                horarioMinimo={
                  horaInicio ? somarMinutosHorario(horaInicio, 15) : "08:00"
                }
              />

              <label className="reserva-form-full">
                Motivo da reserva
                <input
                  placeholder="Ex: Aula, reunião, apresentação..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                />
              </label>

              <label>
                Quantidade de pessoas
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 30"
                  value={qtdPessoas}
                  onChange={(e) => setQtdPessoas(e.target.value)}
                  required
                />
              </label>

              <label>
                Justificativa adicional
                <input
                  placeholder="Opcional"
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                />
              </label>

              {erroReserva && (
                <p className="erro reserva-form-full">{erroReserva}</p>
              )}

              <div className="reserva-modal-actions">
                <button
                  className="btn secondary"
                  type="button"
                  onClick={fecharReserva}
                  disabled={carregando}
                >
                  Cancelar
                </button>

                <button
                  className="btn primary"
                  type="submit"
                  disabled={carregando}
                >
                  {carregando ? "Solicitando..." : "Confirmar reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
    )

  const modalSucesso =
    sucessoReserva &&
    createPortal(
      <div className="reserva-modal-overlay">
        <div className="reserva-success-modal">
          <div className="check">✔</div>
          <h3>Reserva solicitada!</h3>
          <p>Agora aguarde a aprovação do administrador.</p>
        </div>
      </div>,
      document.body
    )

  return (
    <div className="salas-page">
      <div className="card salas-search-card">
        <h3>Salas</h3>

        <input
          placeholder="Buscar sala, tipo, recurso, instituição, campus ou edifício..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {carregandoDados && (
        <div className="card">
          <p>Carregando salas...</p>
        </div>
      )}

      {!carregandoDados &&
        salasFiltradas.map((s) => {
          const campus = getCampusPorEdificio(s.idEdificio)
          const instituicao = campus ? getInstituicaoPorCampus(campus.id) : null
          const reservaBloqueante = getReservaBloqueanteDaSala(s.idSala)
          const bloqueada = salaEstaBloqueada(s)
          const recursosSala = getNomesRecursos(extrairIdsRecursos(s))
          const statusTexto = !salaEstaAtiva(s)
            ? "Inativa"
            : reservaBloqueante
            ? "Indisponível"
            : "Disponível"

          return (
            <div className="sala-card" key={s.idSala}>
              <div className="sala-card-content">
                <div className="sala-card-header">
                  <div>
                    <div className="sala-title-row">
                      <h3>{s.nome}</h3>

                      <span className="info-tooltip sala-info-tooltip">
                        !
                        <span className="tooltip-box">
                          <strong>Recursos da sala</strong>
                          <br />
                          {recursosSala.length > 0
                            ? recursosSala.join(", ")
                            : "Nenhum recurso informado"}
                        </span>
                      </span>
                    </div>

                    <p>{getTipoSala(s.idTipoSala)}</p>
                  </div>

                  <span
                    className={
                      statusTexto === "Disponível"
                        ? "sala-status disponivel"
                        : statusTexto === "Inativa"
                        ? "sala-status inativa"
                        : "sala-status indisponivel"
                    }
                  >
                    {statusTexto}
                  </span>
                </div>

                <div className="sala-info-grid">
                  <div className="sala-info-item">
                    <span>Número</span>
                    <strong>{s.numero}</strong>
                  </div>

                  <div className="sala-info-item">
                    <span>Capacidade</span>
                    <strong>{s.capacidade} pessoas</strong>
                  </div>

                  <div className="sala-info-item">
                    <span>Metragem</span>
                    <strong>{s.metragem} m²</strong>
                  </div>

                  <div className="sala-info-item">
                    <span>Andar</span>
                    <strong>{s.andar}</strong>
                  </div>

                  <div className="sala-info-item">
                    <span>Instituição</span>
                    <strong>{instituicao?.nome || "Não informado"}</strong>
                  </div>

                  <div className="sala-info-item">
                    <span>Campus</span>
                    <strong>{campus?.nome || "Não informado"}</strong>
                  </div>

                  <div className="sala-info-item sala-info-full">
                    <span>Edifício</span>
                    <strong>{getNomeEdificio(s.idEdificio)}</strong>
                  </div>
                </div>

                {reservaBloqueante && (
                  <div className="sala-reserva-alert">
                    <strong>Período reservado:</strong>
                    <span>{formatarPeriodoReserva(reservaBloqueante)}</span>
                    <small>
                      Status da reserva:{" "}
                      {STATUS_RESERVA[reservaBloqueante.idStatusReserva]}
                    </small>
                  </div>
                )}
              </div>

              <div className="sala-card-actions">
                <button
                  className={bloqueada ? "btn secondary" : "btn primary"}
                  disabled={bloqueada}
                  onClick={() => abrirReserva(s)}
                  type="button"
                >
                  {!salaEstaAtiva(s)
                    ? "Inativa"
                    : reservaBloqueante
                    ? "Indisponível"
                    : "Reservar"}
                </button>
              </div>
            </div>
          )
        })}

      {!carregandoDados && salasFiltradas.length === 0 && (
        <div className="card">
          <p>Nenhuma sala encontrada.</p>
        </div>
      )}

      {modalReserva}
      {modalSucesso}
    </div>
  )
}

export default SalasDesktop