import { useEffect, useRef, useState } from "react"
import "./ChatFluxoMobile.css"
import api from "../../services/api"
import chatbotRobo from "../../assets/chatbot-robo.png"

const SESSION_KEY_PREFIX = "sigsas_chatbot_session_id"
const MENSAGENS_KEY_PREFIX = "sigsas_chatbot_mensagens"

const HORARIO_MINIMO_RESERVA = "08:00"
const HORARIO_MAXIMO_RESERVA = "22:30"
const INTERVALO_HORARIO_MINUTOS = 15

const ETAPAS_RESERVA = [
  "Instituição",
  "Data",
  "Campus",
  "Horário",
  "Tipo",
  "Capacidade",
  "Sala",
  "Confirmação",
]

const MESES_PRIMEIRO_SEMESTRE = [2, 3, 4, 5, 6]
const MESES_SEGUNDO_SEMESTRE = [8, 9, 10, 11, 12]
const MESES_FUNCIONAMENTO = [
  ...MESES_PRIMEIRO_SEMESTRE,
  ...MESES_SEGUNDO_SEMESTRE,
]

const NOMES_MESES_PARA_NUMERO = {
  janeiro: 1,
  jan: 1,
  fevereiro: 2,
  fev: 2,
  marco: 3,
  mar: 3,
  abril: 4,
  abr: 4,
  maio: 5,
  mai: 5,
  junho: 6,
  jun: 6,
  julho: 7,
  jul: 7,
  agosto: 8,
  ago: 8,
  setembro: 9,
  set: 9,
  outubro: 10,
  out: 10,
  novembro: 11,
  nov: 11,
  dezembro: 12,
  dez: 12,
}

const TIMEZONE_PADRAO_BRASIL = "America/Sao_Paulo"
const TIMEZONES_BRASIL = new Set([
  "America/Sao_Paulo",
  "America/Fortaleza",
  "America/Recife",
  "America/Bahia",
  "America/Belem",
  "America/Maceio",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Manaus",
  "America/Boa_Vista",
  "America/Porto_Velho",
  "America/Rio_Branco",
  "America/Eirunepe",
  "America/Noronha",
])

function horarioParaMinutos(horario) {
  const [horasTexto, minutosTexto] = String(horario || "").split(":")
  const horas = Number(horasTexto)
  const minutos = Number(minutosTexto)

  if (Number.isNaN(horas) || Number.isNaN(minutos)) {
    return null
  }

  return horas * 60 + minutos
}

function minutosParaHorario(totalMinutos) {
  const horas = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`
}

function gerarHorariosDisponiveis(
  inicio,
  fim,
  intervalo = INTERVALO_HORARIO_MINUTOS
) {
  const inicioMinutos = horarioParaMinutos(inicio)
  const fimMinutos = horarioParaMinutos(fim)

  if (inicioMinutos === null || fimMinutos === null || inicioMinutos > fimMinutos) {
    return []
  }

  const horarios = []

  for (let atual = inicioMinutos; atual <= fimMinutos; atual += intervalo) {
    horarios.push(minutosParaHorario(atual))
  }

  return horarios
}

function ordenarHorariosPicker(horarios) {
  if (!Array.isArray(horarios)) return []

  return [...horarios].sort((a, b) => {
    const horarioA = typeof a === "string" ? a : a?.horario || a?.valor || a?.label
    const horarioB = typeof b === "string" ? b : b?.horario || b?.valor || b?.label
    const minutosA = horarioParaMinutos(horarioA)
    const minutosB = horarioParaMinutos(horarioB)

    if (minutosA === null && minutosB === null) return 0
    if (minutosA === null) return 1
    if (minutosB === null) return -1

    return minutosA - minutosB
  })
}

function normalizarHorariosParaPicker(horarios) {
  if (!Array.isArray(horarios)) return []

  return ordenarHorariosPicker(
    horarios
      .map((item) => {
        if (typeof item === "string") {
          return { horario: item, disponivel: true, motivo: "Disponível" }
        }

        const horario = item?.horario || item?.valor || item?.label
        if (!horario) return null

        return {
          horario,
          disponivel: item?.disponivel !== false && item?.bloqueado !== true,
          motivo: item?.motivo || item?.motivoIndisponivel || "Horário indisponível",
        }
      })
      .filter(Boolean)
  )
}

function obterHorarioValidoDoTexto(texto) {
  const resultado = String(texto || "").match(/\b([01]\d|2[0-3]):([0-5]\d)\b/)
  return resultado ? resultado[0] : null
}

function obterSessionId() {
  let sessionId = localStorage.getItem(obterSessionKeyUsuario())

  if (!sessionId) {
    sessionId = `sessao-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(obterSessionKeyUsuario(), sessionId)
  }

  return sessionId
}

function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("logado") || "null")
  } catch {
    return null
  }
}

function normalizarChaveLocalStorage(valor) {
  return String(valor || "anonimo")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase()
}

function obterIdentificadorUsuarioChatbot() {
  const usuario = getUsuarioLogado()

  return normalizarChaveLocalStorage(
    usuario?.id ||
      usuario?.idUsuario ||
      usuario?.email ||
      usuario?.matricula ||
      usuario?.nome ||
      "anonimo"
  )
}

function obterSessionKeyUsuario() {
  return `${SESSION_KEY_PREFIX}_${obterIdentificadorUsuarioChatbot()}`
}

function obterMensagensKeyUsuario() {
  return `${MENSAGENS_KEY_PREFIX}_${obterIdentificadorUsuarioChatbot()}`
}

function obterFusoHorarioBrasil() {
  try {
    const fusoNavegador = Intl.DateTimeFormat().resolvedOptions().timeZone

    if (TIMEZONES_BRASIL.has(fusoNavegador)) {
      return fusoNavegador
    }
  } catch {
    return TIMEZONE_PADRAO_BRASIL
  }

  return TIMEZONE_PADRAO_BRASIL
}

function obterAgoraIso() {
  return new Date().toISOString()
}

function formatarHorarioBrasil(dataIso, fusoHorario = obterFusoHorarioBrasil()) {
  try {
    const data = dataIso ? new Date(dataIso) : new Date()

    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: fusoHorario || obterFusoHorarioBrasil(),
    }).format(Number.isNaN(data.getTime()) ? new Date() : data)
  } catch {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TIMEZONE_PADRAO_BRASIL,
    }).format(new Date())
  }
}

function criarMensagemChat(mensagem) {
  return {
    ...mensagem,
    criadoEm:
      mensagem?.criadoEm ||
      mensagem?.criado_em ||
      mensagem?.createdAt ||
      mensagem?.dataHora ||
      obterAgoraIso(),
    fusoHorario: mensagem?.fusoHorario || obterFusoHorarioBrasil(),
  }
}

function normalizarMensagensComHorario(mensagens) {
  if (!Array.isArray(mensagens)) return []
  return mensagens.map((mensagem) => criarMensagemChat(mensagem))
}

function criarMensagemMenuInicial() {
  return criarMensagemChat({
    autor: "bot",
    texto:
      "Olá! Sou o assistente do SIGSAS. Escolha uma opção para continuar:\n\n" +
      "1 - Reservar\n" +
      "2 - Cancelar reserva\n" +
      "3 - Confirmar reserva",
    tipoInteracao: "menu",
    opcoes: [
      { label: "1 - Reservar", valor: "1" },
      { label: "2 - Cancelar reserva", valor: "2" },
      { label: "3 - Confirmar reserva", valor: "3" },
    ],
  })
}

function obterMensagensSalvas() {
  try {
    const mensagens = JSON.parse(localStorage.getItem(obterMensagensKeyUsuario()) || "[]")
    return Array.isArray(mensagens) ? mensagens : []
  } catch {
    return []
  }
}

function salvarMensagens(mensagens) {
  localStorage.setItem(obterMensagensKeyUsuario(), JSON.stringify(mensagens))
}

function detectarEtapaPorResposta(resposta) {
  const tipo = resposta?.tipoInteracao
  const texto = String(resposta?.resposta || "").toLowerCase()

  if (tipo === "instituicoes") return 0
  if (tipo === "calendario") return 1
  if (tipo === "campi") return 2
  if (tipo === "horario-manual") return 3
  if (tipo === "botoes" && texto.includes("tipo")) return 4
  if (tipo === "faixas-capacidade") return 5
  if (tipo === "lista-salas") return 6
  if (tipo === "resultado-busca-salas") return 6
  if (tipo === "confirmacao") return 7
  if (texto.includes("deseja criar")) return 7
  if (texto.includes("deseja confirmar")) return 7
  if (texto.includes("deseja cancelar")) return 7

  return null
}

function montarOpcoesDaResposta(data) {
  if (Array.isArray(data?.opcoes) && data.opcoes.length > 0) {
    return data.opcoes
  }

  if (
    data?.tipoInteracao === "instituicoes" &&
    Array.isArray(data?.instituicoes) &&
    data.instituicoes.length > 0
  ) {
    return data.instituicoes.map((instituicao) => ({
      label: instituicao.nome,
      valor: `INSTITUICAO:${instituicao.idInstituicao || instituicao.id}`,
    }))
  }

  return []
}

function obterInstituicaoUnica(data) {
  if (
    data?.tipoInteracao !== "instituicoes" ||
    !Array.isArray(data?.instituicoes) ||
    data.instituicoes.length !== 1
  ) {
    return null
  }

  const instituicao = data.instituicoes[0]
  const idInstituicao = instituicao?.idInstituicao || instituicao?.id

  if (!idInstituicao) return null

  return {
    label: instituicao.nome,
    valor: `INSTITUICAO:${idInstituicao}`,
  }
}

function normalizarNomeMes(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function obterNumeroMesCalendario(mes) {
  const primeiroDia = Array.isArray(mes?.dias) ? mes.dias[0] : null
  const mesDoDia = Number(primeiroDia?.mes)

  if (!Number.isNaN(mesDoDia) && mesDoDia >= 1 && mesDoDia <= 12) {
    return mesDoDia
  }

  const numeroDireto = Number(mes?.numeroMes || mes?.mes || mes?.mesNumero)

  if (!Number.isNaN(numeroDireto) && numeroDireto >= 1 && numeroDireto <= 12) {
    return numeroDireto
  }

  return NOMES_MESES_PARA_NUMERO[normalizarNomeMes(mes?.nomeMes || mes?.nome)] || null
}

function obterAnoCalendario(mes) {
  const primeiroDia = Array.isArray(mes?.dias) ? mes.dias[0] : null
  const anoDoDia = Number(primeiroDia?.ano)

  if (!Number.isNaN(anoDoDia) && anoDoDia > 1900) return anoDoDia

  const anoDireto = Number(mes?.ano)
  return !Number.isNaN(anoDireto) && anoDireto > 1900 ? anoDireto : null
}

function obterMesesPermitidosPelaDataAtual(dataAtual = new Date()) {
  const mesAtual = dataAtual.getMonth() + 1

  if (MESES_PRIMEIRO_SEMESTRE.includes(mesAtual)) {
    return MESES_PRIMEIRO_SEMESTRE.filter((mes) => mes >= mesAtual)
  }

  if (MESES_SEGUNDO_SEMESTRE.includes(mesAtual)) {
    return MESES_SEGUNDO_SEMESTRE.filter((mes) => mes >= mesAtual)
  }

  return []
}

function obterMensagemPeriodoLetivo(dataAtual = new Date()) {
  const mesAtual = dataAtual.getMonth() + 1

  if (mesAtual === 1) {
    return "Não há meses disponíveis para reserva em janeiro. As reservas retornam em fevereiro."
  }

  if (mesAtual === 7) {
    return "Não há meses disponíveis para reserva em julho. As reservas retornam em agosto."
  }

  return "Não há meses disponíveis para reserva neste período letivo."
}

function filtrarMesesPeriodoLetivo(meses, dataAtual = new Date()) {
  if (!Array.isArray(meses)) return []

  const anoAtual = dataAtual.getFullYear()
  const mesesPermitidos = obterMesesPermitidosPelaDataAtual(dataAtual)

  if (!mesesPermitidos.length) return []

  return meses.filter((mes) => {
    const numeroMes = obterNumeroMesCalendario(mes)
    const anoMes = obterAnoCalendario(mes) || anoAtual

    return (
      Boolean(numeroMes) &&
      anoMes === anoAtual &&
      MESES_FUNCIONAMENTO.includes(numeroMes) &&
      mesesPermitidos.includes(numeroMes)
    )
  })
}

function montarMensagemResposta(data) {
  return {
    autor: "bot",
    texto: data?.resposta || "Sem resposta do servidor.",
    tipoInteracao: data?.tipoInteracao || null,
    opcoes: montarOpcoesDaResposta(data),
    meses: data?.meses || [],
    dias: data?.dias || [],
    instituicoes: data?.instituicoes || [],
    campi: data?.campi || [],
    salas: data?.salas || [],
    disponibilidadesSalas: data?.disponibilidadesSalas || [],
    reservas: data?.reservas || [],
    faixasCapacidade: data?.faixasCapacidade || [],
    horarios: data?.horarios || [],
    campoHorario: data?.campoHorario || null,
    acaoReservas: data?.acaoReservas || null,
    textoBotaoReservas: data?.textoBotaoReservas || null,
  }
}

function ChatFluxoMobile() {
  const mensagensIniciais = obterMensagensSalvas()
  const [mensagens, setMensagens] = useState(
    mensagensIniciais.length
      ? normalizarMensagensComHorario(mensagensIniciais)
      : [criarMensagemMenuInicial()]
  )
  const [texto, setTexto] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [reservasSelecionadas, setReservasSelecionadas] = useState([])
  const [etapaAtual, setEtapaAtual] = useState(null)
  const [timePickerAberto, setTimePickerAberto] = useState(null)
  const [ultimoHorarioInicio, setUltimoHorarioInicio] = useState(null)
  const [ultimoHorarioFim, setUltimoHorarioFim] = useState(null)

  const fimMensagensRef = useRef(null)
  const sessionIdRef = useRef(obterSessionId())

  useEffect(() => {
    salvarMensagens(mensagens)
  }, [mensagens])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fimMensagensRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, 40)

    return () => window.clearTimeout(timeout)
  }, [mensagens, carregando, timePickerAberto])

  function adicionarMensagem(mensagem) {
    setMensagens((atual) => [...atual, criarMensagemChat(mensagem)])
  }

  function atualizarEtapaPelaResposta(data) {
    const etapa = detectarEtapaPorResposta(data)
    if (etapa !== null) setEtapaAtual(etapa)
  }

  function mensagemIniciaNovoFluxoReserva(valor, label = "") {
    const valorNormalizado = String(valor || "").trim().toLowerCase()
    const textoNormalizado = `${valor || ""} ${label || ""}`
      .trim()
      .toLowerCase()

    return (
      valorNormalizado === "1" ||
      /^1\s*-\s*reservar/.test(textoNormalizado) ||
      textoNormalizado.includes("reservar outra sala")
    )
  }

  function limparSelecaoHorariosDoNovoFluxo() {
    setTimePickerAberto(null)
    setUltimoHorarioInicio(null)
    setUltimoHorarioFim(null)
  }

  async function enviarParaBackend(mensagem, opcoes = {}) {
    const usuario = getUsuarioLogado()
    const payload = {
      texto: mensagem,
      session_id: sessionIdRef.current,
      idUsuario: usuario?.id || usuario?.idUsuario || null,
    }

    const response = await api.post("/chatbot-fluxo/mensagem", payload)
    const data = response.data || {}
    const instituicaoUnica = obterInstituicaoUnica(data)

    if (instituicaoUnica && !opcoes.ignorarAutoInstituicao) {
      const responseInstituicao = await api.post("/chatbot-fluxo/mensagem", {
        ...payload,
        texto: instituicaoUnica.valor,
      })
      const dataInstituicao = responseInstituicao.data || {}

      atualizarEtapaPelaResposta(dataInstituicao)

      if (dataInstituicao.tipoInteracao === "checkbox-reservas") {
        setReservasSelecionadas([])
      }

      if (!opcoes.silencioso) {
        adicionarMensagem(montarMensagemResposta(dataInstituicao))
      }

      return dataInstituicao
    }

    atualizarEtapaPelaResposta(data)

    if (data.tipoInteracao === "checkbox-reservas") {
      setReservasSelecionadas([])
    }

    if (!opcoes.silencioso) {
      adicionarMensagem(montarMensagemResposta(data))
    }

    return data
  }

  async function enviarMensagemManual(event) {
    event.preventDefault()
    const mensagem = texto.trim()

    if (!mensagem || carregando) return

    if (mensagemIniciaNovoFluxoReserva(mensagem)) {
      limparSelecaoHorariosDoNovoFluxo()
    }

    adicionarMensagem({ autor: "user", texto: mensagem })
    setTexto("")
    setTimePickerAberto(null)
    setCarregando(true)

    try {
      await enviarParaBackend(mensagem)
    } catch (error) {
      console.error(error)
      adicionarMensagem({
        autor: "bot",
        texto: "Erro ao conectar com o backend do chatbot.",
      })
    } finally {
      setCarregando(false)
    }
  }

  async function enviarMensagemRapida(valor, label = null) {
    if (carregando) return

    if (mensagemIniciaNovoFluxoReserva(valor, label || "")) {
      limparSelecaoHorariosDoNovoFluxo()
    }

    adicionarMensagem({ autor: "user", texto: label || valor })
    setTimePickerAberto(null)
    setCarregando(true)

    try {
      await enviarParaBackend(valor)
    } catch (error) {
      console.error(error)
      adicionarMensagem({
        autor: "bot",
        texto: "Erro ao conectar com o backend do chatbot.",
      })
    } finally {
      setCarregando(false)
    }
  }

  async function reiniciarChat() {
    const usuario = getUsuarioLogado()
    setCarregando(true)

    try {
      const response = await api.post("/chatbot-fluxo/reset", {
        session_id: sessionIdRef.current,
        idUsuario: usuario?.id || usuario?.idUsuario || null,
      })
      const data = response.data || {}
      const mensagemInicial = criarMensagemChat({
        ...montarMensagemResposta(data),
        tipoInteracao: data.tipoInteracao || "menu",
        opcoes:
          montarOpcoesDaResposta(data).length > 0
            ? montarOpcoesDaResposta(data)
            : criarMensagemMenuInicial().opcoes,
      })

      setMensagens([mensagemInicial])
      setReservasSelecionadas([])
      setEtapaAtual(null)
      setTimePickerAberto(null)
      setUltimoHorarioInicio(null)
      setUltimoHorarioFim(null)
    } catch (error) {
      console.error(error)
      const mensagemInicial = criarMensagemChat({
        autor: "bot",
        texto: "Não consegui reiniciar no backend. Digite menu para voltar ao início.",
      })
      setMensagens([mensagemInicial])
    } finally {
      setCarregando(false)
    }
  }

  async function limparChatLocal() {
    const usuario = getUsuarioLogado()

    try {
      await api.post("/chatbot-fluxo/reset", {
        session_id: sessionIdRef.current,
        idUsuario: usuario?.id || usuario?.idUsuario || null,
      })
    } catch (error) {
      console.error("Erro ao registrar limpeza do chatbot:", error)
    }

    localStorage.removeItem(obterMensagensKeyUsuario())
    localStorage.removeItem(obterSessionKeyUsuario())
    sessionIdRef.current = obterSessionId()

    const mensagensReiniciadas = [criarMensagemMenuInicial()]
    setMensagens(mensagensReiniciadas)
    setReservasSelecionadas([])
    setEtapaAtual(null)
    setTimePickerAberto(null)
    setUltimoHorarioInicio(null)
    setUltimoHorarioFim(null)
  }

  function reservaEstaSelecionada(idReserva) {
    return reservasSelecionadas.includes(Number(idReserva))
  }

  function alternarReservaSelecionada(idReserva) {
    const id = Number(idReserva)

    setReservasSelecionadas((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]
    )
  }

  async function confirmarReservasSelecionadas(msg) {
    if (!reservasSelecionadas.length || carregando) return

    const acaoTexto = msg?.acaoReservas === "cancelar" ? "Cancelar" : "Confirmar"
    const textoUsuario =
      reservasSelecionadas.length === 1
        ? `${acaoTexto} reserva #${reservasSelecionadas[0]}`
        : `${acaoTexto} reservas ${reservasSelecionadas.map((id) => `#${id}`).join(", ")}`

    adicionarMensagem({ autor: "user", texto: textoUsuario })
    setCarregando(true)

    try {
      await enviarParaBackend(`RESERVAS:${reservasSelecionadas.join(",")}`)
      setReservasSelecionadas([])
    } catch (error) {
      console.error(error)
      adicionarMensagem({ autor: "bot", texto: "Erro ao enviar as reservas selecionadas." })
    } finally {
      setCarregando(false)
    }
  }

  function mensagemMarcaInicioFluxoReserva(mensagem) {
    if (mensagem?.autor !== "user") return false

    const texto = String(mensagem?.texto || "").trim().toLowerCase()

    return (
      texto === "1" ||
      /^1\s*-\s*reservar/.test(texto) ||
      texto.includes("reservar outra sala")
    )
  }

  function obterIndiceInicioFluxoReserva(indiceMensagem) {
    for (let indice = indiceMensagem - 1; indice >= 0; indice -= 1) {
      if (mensagemMarcaInicioFluxoReserva(mensagens[indice])) {
        return indice
      }
    }

    return 0
  }

  function obterUltimoHorarioAntesDaMensagem(indiceMensagem) {
    const indiceInicioFluxo = obterIndiceInicioFluxoReserva(indiceMensagem)

    for (let indice = indiceMensagem - 1; indice > indiceInicioFluxo; indice -= 1) {
      const mensagem = mensagens[indice]
      if (mensagem?.autor !== "user") continue

      const horario = obterHorarioValidoDoTexto(mensagem.texto)
      if (horario) return horario
    }

    return null
  }

  function existeMensagemHorarioDepois(indiceMensagem) {
    return mensagens.some(
      (mensagem, index) =>
        index > indiceMensagem &&
        mensagem?.autor === "bot" &&
        mensagem?.tipoInteracao === "horario-manual"
    )
  }

  function existeMensagemBotDepois(indiceMensagem) {
    return mensagens.some((mensagem, index) => index > indiceMensagem && mensagem?.autor === "bot")
  }

  function obterPrimeiroHorarioDepoisDaMensagem(indiceMensagem) {
    for (let indice = indiceMensagem + 1; indice < mensagens.length; indice += 1) {
      const mensagem = mensagens[indice]
      if (mensagem?.autor === "bot") break

      if (mensagem?.autor === "user") {
        const horario = obterHorarioValidoDoTexto(mensagem.texto)
        if (horario) return horario
      }
    }

    return null
  }

  async function enviarHorarioSelecionado(horario, campoHorario, opcoes = {}) {
    if (carregando) return

    setTimePickerAberto(null)

    if (campoHorario === "inicio") {
      setUltimoHorarioInicio(horario)
      setUltimoHorarioFim(null)

      if (opcoes.abrirFimDepois) {
        window.setTimeout(() => setTimePickerAberto(opcoes.abrirFimDepois), 80)
      }
      return
    }

    const horarioInicio = opcoes.horarioInicioReferencia || ultimoHorarioInicio || null
    if (!horarioInicio) return

    setUltimoHorarioFim(horario)
    adicionarMensagem({ autor: "user", texto: `${horarioInicio} às ${horario}` })
    setCarregando(true)

    try {
      await enviarParaBackend(horarioInicio, { silencioso: true })
      await enviarParaBackend(horario)
    } catch (error) {
      console.error(error)
      adicionarMensagem({
        autor: "bot",
        texto: "Erro ao conectar com o backend do chatbot.",
      })
    } finally {
      setCarregando(false)
    }
  }

  function renderizarCampoHorario({
    id,
    titulo,
    valor,
    placeholder,
    subtitulo,
    ativo,
    bloqueado,
    horarios,
    aoSelecionar,
    travado = false,
  }) {
    const pickerEstaAberto = !travado && timePickerAberto === id

    return (
      <div className="sigsas-mobile-time-field">
        <span className="sigsas-mobile-time-label">{titulo}</span>

        <button
          type="button"
          className={`sigsas-mobile-time-trigger ${valor ? "selected" : ""} ${travado ? "locked" : ""}`}
          onClick={() => {
            if (!ativo || bloqueado || travado) return
            setTimePickerAberto((atual) => (atual === id ? null : id))
          }}
          disabled={!ativo || bloqueado || travado}
        >
          <span>{valor || placeholder}</span>
          <b aria-hidden="true">⌄</b>
        </button>

        {pickerEstaAberto && ativo && !bloqueado && (
          <div className="sigsas-mobile-time-popover">
            <div className="sigsas-mobile-time-popover-header">
              <strong>{titulo}</strong>
              <span>{HORARIO_MINIMO_RESERVA} — {HORARIO_MAXIMO_RESERVA}</span>
            </div>

            <div className="sigsas-mobile-time-grid">
              {ordenarHorariosPicker(horarios).map((item) => {
                const horario = typeof item === "string" ? item : item.horario
                const disponivel =
                  typeof item === "string"
                    ? true
                    : item?.disponivel !== false && item?.bloqueado !== true
                const motivo =
                  typeof item === "string"
                    ? "Disponível"
                    : item?.motivo || "Horário indisponível"

                return (
                  <button
                    key={horario}
                    type="button"
                    className={`sigsas-mobile-time-option ${disponivel ? "available" : "disabled"}`}
                    onClick={() => disponivel && aoSelecionar(horario)}
                    disabled={carregando || !disponivel}
                    title={motivo}
                  >
                    {horario}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <small>{subtitulo}</small>
      </div>
    )
  }

  function renderizarSeletorHorario(msg, indiceMensagem) {
    if (msg.tipoInteracao !== "horario-manual") return null
    if (existeMensagemHorarioDepois(indiceMensagem)) return null

    const textoMensagem = String(msg.texto || "").toLowerCase()
    const campoHorario =
      msg.campoHorario ||
      (textoMensagem.includes("término") || textoMensagem.includes("termino")
        ? "fim"
        : "inicio")

    const horarioInicioDaMensagem = obterUltimoHorarioAntesDaMensagem(indiceMensagem)
    const horarioInicioSelecionado =
      ultimoHorarioInicio ||
      horarioInicioDaMensagem ||
      obterPrimeiroHorarioDepoisDaMensagem(indiceMensagem)

    const horarioFimSelecionado =
      ultimoHorarioFim ||
      (campoHorario === "fim" ? obterPrimeiroHorarioDepoisDaMensagem(indiceMensagem) : null)

    const minimoHorarioFim = horarioInicioSelecionado
      ? minutosParaHorario(horarioParaMinutos(horarioInicioSelecionado) + INTERVALO_HORARIO_MINUTOS)
      : HORARIO_MINIMO_RESERVA

    const horariosBackend = normalizarHorariosParaPicker(msg.horarios)
    const horariosInicio =
      campoHorario === "inicio" && horariosBackend.length > 0
        ? horariosBackend
        : gerarHorariosDisponiveis(
            HORARIO_MINIMO_RESERVA,
            HORARIO_MAXIMO_RESERVA,
            INTERVALO_HORARIO_MINUTOS
          )
    const horariosFim = gerarHorariosDisponiveis(
      minimoHorarioFim,
      HORARIO_MAXIMO_RESERVA,
      INTERVALO_HORARIO_MINUTOS
    )

    const fluxoJaAvancou = existeMensagemBotDepois(indiceMensagem)
    const campoFimId = `${indiceMensagem}-fim`

    return (
      <section className="sigsas-mobile-time-selector">
        <div className="sigsas-mobile-time-header">
          <strong>Escolha o horário da reserva</strong>
          <span>Intervalos de 15 minutos</span>
        </div>

        <div className="sigsas-mobile-time-fields">
          {renderizarCampoHorario({
            id: `${indiceMensagem}-inicio`,
            titulo: "Hora de início",
            valor: horarioInicioSelecionado,
            placeholder: "Selecionar início",
            subtitulo: horarioInicioSelecionado
              ? "Horário inicial selecionado"
              : "Primeiro horário da reserva",
            ativo: !fluxoJaAvancou,
            bloqueado: carregando || fluxoJaAvancou,
            travado: Boolean(horarioFimSelecionado) || fluxoJaAvancou,
            horarios: horariosInicio,
            aoSelecionar: (horario) =>
              enviarHorarioSelecionado(horario, "inicio", { abrirFimDepois: campoFimId }),
          })}

          {renderizarCampoHorario({
            id: campoFimId,
            titulo: "Hora de término",
            valor: horarioFimSelecionado,
            placeholder: "Selecionar término",
            subtitulo: horarioFimSelecionado
              ? "Horário final selecionado"
              : horarioInicioSelecionado
                ? `Após ${horarioInicioSelecionado}`
                : "Liberado após escolher o início",
            ativo: Boolean(horarioInicioSelecionado) && !horarioFimSelecionado,
            bloqueado:
              carregando ||
              !horarioInicioSelecionado ||
              Boolean(horarioFimSelecionado) ||
              fluxoJaAvancou,
            travado: Boolean(horarioFimSelecionado) || fluxoJaAvancou,
            horarios: horariosFim,
            aoSelecionar: (horario) =>
              enviarHorarioSelecionado(horario, "fim", {
                horarioInicioReferencia: horarioInicioSelecionado,
              }),
          })}
        </div>

        {!horarioInicioSelecionado && (
          <p className="turnos-info">
            Escolha o horário de início para liberar o horário de término.
          </p>
        )}
      </section>
    )
  }

  function renderizarProgresso() {
    return (
      <div className="chat-progress" aria-label="Etapas da reserva">
        {ETAPAS_RESERVA.map((etapa, index) => (
          <div
            key={etapa}
            className={`chat-progress-step ${etapaAtual !== null && index <= etapaAtual ? "active" : ""}`}
          >
            <span>{index + 1}</span>
            <small>{etapa}</small>
          </div>
        ))}
      </div>
    )
  }

  function renderizarBotoes(msg) {
    if (!msg.opcoes?.length) return null

    const tiposComRenderProprio = [
      "campi",
      "faixas-capacidade",
      "lista-salas",
      "checkbox-reservas",
      "calendario",
    ]

    if (tiposComRenderProprio.includes(msg.tipoInteracao)) return null

    return (
      <div className="premium-options">
        {msg.opcoes.map((opcao) => (
          <button
            key={`${opcao.valor}-${opcao.label}`}
            type="button"
            className="chat-option-btn"
            onClick={() => enviarMensagemRapida(opcao.valor, opcao.label)}
            disabled={carregando}
          >
            {opcao.label}
          </button>
        ))}
      </div>
    )
  }

  function renderizarCalendario(msg) {
    if (!msg.meses?.length && !msg.dias?.length) return null

    const dataAtual = new Date()
    const mesesOriginais = msg.meses?.length
      ? msg.meses
      : [
          {
            nomeMes: "Calendário",
            ano: dataAtual.getFullYear(),
            dias: msg.dias || [],
          },
        ]

    const meses = filtrarMesesPeriodoLetivo(mesesOriginais, dataAtual)
    const diasSemana = ["S", "T", "Q", "Q", "S", "S", "D"]

    if (!meses.length) {
      return (
        <div className="sigsas-mobile-calendar-wrapper">
          <div className="sigsas-mobile-calendar-empty">
            <strong>Calendário indisponível</strong>
            <p>{obterMensagemPeriodoLetivo(dataAtual)}</p>
            <small>O SIGSAS exibe fevereiro a junho e agosto a dezembro.</small>
          </div>
        </div>
      )
    }

    return (
      <div className="sigsas-mobile-calendar-wrapper">
        {meses.map((mes) => {
          const primeiroDia = mes.dias?.[0]
          const espacosAntes = Math.max(0, Number(primeiroDia?.diaSemana) || 0)

          return (
            <section key={`${mes.nomeMes}-${mes.ano}`} className="sigsas-mobile-calendar-month">
              <h4>{mes.nomeMes} {mes.ano}</h4>

              <div className="sigsas-mobile-calendar-weekdays">
                {diasSemana.map((dia, index) => (
                  <span key={`${dia}-${index}`} className="sigsas-mobile-calendar-weekday">{dia}</span>
                ))}
              </div>

              <div className="sigsas-mobile-calendar-grid">
                {Array.from({ length: espacosAntes }).map((_, index) => (
                  <span key={`empty-${index}`} className="sigsas-mobile-calendar-empty-cell" aria-hidden="true" />
                ))}

                {mes.dias.map((dia) => (
                  <button
                    key={dia.dataIso}
                    type="button"
                    className={`sigsas-mobile-calendar-day ${dia.disponivel ? "available" : "disabled"}`}
                    onClick={() => {
                      if (!dia.disponivel || carregando) return
                      enviarMensagemRapida(`DATA:${dia.dataIso}`, dia.dataBr)
                    }}
                    disabled={carregando || !dia.disponivel}
                    title={dia.motivoIndisponivel || ""}
                    aria-label={dia.dataBr || `${dia.dia}/${dia.mes}/${dia.ano}`}
                  >
                    {dia.dia}
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  function renderizarCampi(msg) {
    if (msg.tipoInteracao !== "campi" || !msg.campi?.length) return null

    const opcoesOutraData = (msg.opcoes || []).filter(
      (opcao) => String(opcao?.valor || "").toUpperCase() === "AJUSTE:DATA"
    )

    return (
      <>
        <div className="sigsas-mobile-campus-list">
          {msg.campi.map((campus) => {
            const disponivel = campus.disponivel === true

            return (
              <button
                key={campus.idCampus || campus.nome}
                type="button"
                className={`sigsas-mobile-campus-option ${disponivel ? "disponivel" : "indisponivel"}`}
                onClick={() =>
                  disponivel &&
                  !carregando &&
                  enviarMensagemRapida(`CAMPUS:${campus.idCampus}`, campus.nome)
                }
                disabled={!disponivel || carregando}
              >
                <span className="sigsas-mobile-campus-label">Campus</span>
                <strong>{campus.nome}</strong>
                <small>
                  {disponivel
                    ? "Disponível para reserva"
                    : campus.motivoIndisponivel || "Não há salas ativas cadastradas neste campus."}
                </small>
              </button>
            )
          })}
        </div>

        {opcoesOutraData.length > 0 && (
          <div className="premium-options chat-campus-adjustment-options">
            {opcoesOutraData.map((opcao) => (
              <button
                key={`${opcao.valor}-${opcao.label}`}
                type="button"
                className="chat-option-btn"
                onClick={() => enviarMensagemRapida(opcao.valor, opcao.label)}
                disabled={carregando}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        )}
      </>
    )
  }

  function renderizarFaixasCapacidade(msg) {
    if (msg.tipoInteracao !== "faixas-capacidade" || !msg.faixasCapacidade?.length) {
      return null
    }

    return (
      <div className="sigsas-mobile-capacity-list">
        {msg.faixasCapacidade.map((faixa) => (
          <button
            key={`${faixa.minimo}-${faixa.maximo}`}
            type="button"
            className="sigsas-mobile-capacity-option"
            onClick={() =>
              enviarMensagemRapida(
                `FAIXA_CAPACIDADE:${faixa.minimo}-${faixa.maximo}`,
                `${faixa.minimo} a ${faixa.maximo} pessoas`
              )
            }
            disabled={carregando}
          >
            <span className="sigsas-mobile-capacity-copy">
              <small>Capacidade da turma</small>
              <strong>{faixa.minimo} a {faixa.maximo}</strong>
              <em>pessoas</em>
            </span>

            <span className="sigsas-mobile-capacity-arrow" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
      </div>
    )
  }

  function renderizarSalas(msg) {
    if (msg.tipoInteracao !== "lista-salas" || !msg.salas?.length) return null

    return (
      <div className="sigsas-mobile-room-list">
        {msg.salas.map((sala) => {
          const recursos = Array.isArray(sala.recursos) ? sala.recursos : []
          const recursosPrincipais = recursos.slice(0, 3)
          const recursosRestantes = Math.max(recursos.length - recursosPrincipais.length, 0)
          const numeroLista = String(sala.numeroLista || "").padStart(2, "0")

          return (
            <article
              key={sala.idSala || sala.numeroLista || sala.nome}
              className="sigsas-mobile-room-card"
            >
              <header className="sigsas-mobile-room-header">
                <div className="sigsas-mobile-room-heading">
                  <span className="sigsas-mobile-room-number">{numeroLista}</span>

                  <div className="sigsas-mobile-room-title">
                    <span className="sigsas-mobile-room-label">Sala disponível</span>
                    <h4>{sala.nome || "Sala sem nome"}</h4>
                    <p>
                      {sala.tipo || "Tipo não informado"}
                      {sala.numero ? ` · Sala nº ${sala.numero}` : ""}
                    </p>
                  </div>
                </div>

                <span className="sigsas-mobile-room-capacity">
                  <strong>{sala.capacidade || "—"}</strong>
                  <small>pessoas</small>
                </span>
              </header>

              <div className="sigsas-mobile-room-details">
                <div className="sigsas-mobile-room-detail">
                  <small>Campus</small>
                  <strong>{sala.campus || "—"}</strong>
                </div>

                <div className="sigsas-mobile-room-detail">
                  <small>Edifício</small>
                  <strong>{sala.edificio || "—"}</strong>
                </div>

                <div className="sigsas-mobile-room-detail">
                  <small>Andar</small>
                  <strong>{sala.andar || "—"}</strong>
                </div>

                <div className="sigsas-mobile-room-detail sigsas-mobile-room-detail-full">
                  <small>Instituição</small>
                  <strong>{sala.instituicao || "—"}</strong>
                </div>
              </div>

              <div className="sigsas-mobile-room-resources">
                {recursosPrincipais.length > 0 ? (
                  recursosPrincipais.map((recurso) => (
                    <span key={recurso}>{recurso}</span>
                  ))
                ) : (
                  <span>Nenhum recurso informado</span>
                )}

                {recursosRestantes > 0 && (
                  <span className="sigsas-mobile-room-resource-more">
                    +{recursosRestantes} recursos
                  </span>
                )}
              </div>

              <footer className="sigsas-mobile-room-footer">
                <button
                  type="button"
                  className="sigsas-mobile-room-select"
                  onClick={() =>
                    enviarMensagemRapida(
                      String(sala.numeroLista),
                      `Sala ${sala.numeroLista}`
                    )
                  }
                  disabled={carregando}
                >
                  <span>Escolher sala</span>
                  <b aria-hidden="true">→</b>
                </button>
              </footer>
            </article>
          )
        })}
      </div>
    )
  }

  function renderizarResultadosBuscaSala(msg) {
    if (
      msg.tipoInteracao !== "resultado-busca-salas" ||
      !msg.disponibilidadesSalas?.length
    ) {
      return null
    }

    return (
      <div className="sigsas-mobile-room-list">
        {msg.disponibilidadesSalas.map((disponibilidade) => {
          const numeroLista = String(disponibilidade.numeroLista || "").padStart(2, "0")

          return (
            <article
              key={`${disponibilidade.idSala}-${disponibilidade.dataIso}-${disponibilidade.horaInicio}`}
              className="sigsas-mobile-room-card"
            >
              <header className="sigsas-mobile-room-header">
                <div className="sigsas-mobile-room-heading">
                  <span className="sigsas-mobile-room-number">{numeroLista}</span>

                  <div className="sigsas-mobile-room-title">
                    <span className="sigsas-mobile-room-label">Disponibilidade encontrada</span>
                    <h4>{disponibilidade.nome || "Sala sem nome"}</h4>
                    <p>
                      {disponibilidade.tipo || "Tipo não informado"}
                      {disponibilidade.numero ? ` · Sala nº ${disponibilidade.numero}` : ""}
                    </p>
                  </div>
                </div>

                <span className="sigsas-mobile-room-capacity">
                  <strong>{disponibilidade.capacidade || "—"}</strong>
                  <small>pessoas</small>
                </span>
              </header>

              <div className="sigsas-mobile-room-details">
                <div className="sigsas-mobile-room-detail">
                  <small>Data</small>
                  <strong>{disponibilidade.dataBr || "—"}</strong>
                </div>

                <div className="sigsas-mobile-room-detail">
                  <small>Horário</small>
                  <strong>
                    {disponibilidade.horaInicio || "—"} às {disponibilidade.horaFim || "—"}
                  </strong>
                </div>

                <div className="sigsas-mobile-room-detail">
                  <small>Campus</small>
                  <strong>{disponibilidade.campus || "—"}</strong>
                </div>

                <div className="sigsas-mobile-room-detail">
                  <small>Sede/Prédio</small>
                  <strong>{disponibilidade.edificio || "—"}</strong>
                </div>

                <div className="sigsas-mobile-room-detail sigsas-mobile-room-detail-full">
                  <small>Instituição</small>
                  <strong>{disponibilidade.instituicao || "—"}</strong>
                </div>
              </div>

              <footer className="sigsas-mobile-room-footer">
                <button
                  type="button"
                  className="sigsas-mobile-room-select"
                  onClick={() =>
                    enviarMensagemRapida(
                      `BUSCA_DISPONIBILIDADE:${disponibilidade.numeroLista}`,
                      `${disponibilidade.nome} • ${disponibilidade.dataBr} • ${disponibilidade.horaInicio} às ${disponibilidade.horaFim}`
                    )
                  }
                  disabled={carregando}
                >
                  <span>Reservar neste horário</span>
                  <b aria-hidden="true">→</b>
                </button>
              </footer>
            </article>
          )
        })}
      </div>
    )
  }

  function renderizarReservas(msg) {
    if (msg.tipoInteracao !== "checkbox-reservas" || !msg.reservas?.length) return null

    return (
      <div className="chat-reservas-box sigsas-mobile-reservation-box">
        <div className="sigsas-mobile-room-list sigsas-mobile-reservation-list">
          {msg.reservas.map((reserva) => {
            const selecionada = reservaEstaSelecionada(reserva.idReserva)
            const textoData = reserva.data
              ? `${reserva.data} · ${reserva.horaInicio || "--:--"} às ${reserva.horaFim || "--:--"}`
              : "Data não informada"
            const numeroReserva = String(reserva.idReserva || "").padStart(2, "0")

            return (
              <label
                key={reserva.idReserva}
                className={`sigsas-mobile-room-card sigsas-mobile-reservation-card ${selecionada ? "selected" : ""}`}
              >
                <input
                  className="sigsas-mobile-reservation-check"
                  type="checkbox"
                  checked={selecionada}
                  onChange={() => alternarReservaSelecionada(reserva.idReserva)}
                  disabled={carregando}
                />

                <header className="sigsas-mobile-room-header">
                  <div className="sigsas-mobile-room-heading">
                    <span className="sigsas-mobile-room-number">{numeroReserva}</span>

                    <div className="sigsas-mobile-room-title">
                      <span className="sigsas-mobile-room-label">
                        {reserva.status || "Pendente"}
                      </span>
                      <h4>Reserva #{reserva.idReserva}</h4>
                      <p>{reserva.sala || "Sala não informada"}</p>
                    </div>
                  </div>

                  <span className="sigsas-mobile-room-capacity sigsas-mobile-reservation-status">
                    <strong>{selecionada ? "✓" : "+"}</strong>
                    <small>{selecionada ? "selecionada" : "selecionar"}</small>
                  </span>
                </header>

                <div className="sigsas-mobile-room-details">
                  <div className="sigsas-mobile-room-detail sigsas-mobile-room-detail-full">
                    <small>Data</small>
                    <strong>{textoData}</strong>
                  </div>

                  <div className="sigsas-mobile-room-detail">
                    <small>Solicitante</small>
                    <strong>{reserva.solicitante || "Não informado"}</strong>
                  </div>

                  <div className="sigsas-mobile-room-detail">
                    <small>Curso</small>
                    <strong>{reserva.curso || "Não informado"}</strong>
                  </div>
                </div>

                <div className="sigsas-mobile-room-resources">
                  <span>Motivo: {reserva.motivo || "Não informado"}</span>
                </div>
              </label>
            )
          })}
        </div>

        <footer className="sigsas-mobile-room-footer sigsas-mobile-reservation-actions">
          <small>{reservasSelecionadas.length} selecionada(s)</small>

          <button
            type="button"
            className="sigsas-mobile-room-select"
            onClick={() => confirmarReservasSelecionadas(msg)}
            disabled={!reservasSelecionadas.length || carregando}
          >
            <span>{msg.textoBotaoReservas || "Confirmar selecionadas"}</span>
            <b aria-hidden="true">→</b>
          </button>
        </footer>
      </div>
    )
  }

  function renderizarInteracao(msg, indiceMensagem) {
    return (
      <>
        {renderizarBotoes(msg)}
        {renderizarCalendario(msg)}
        {renderizarCampi(msg)}
        {renderizarSeletorHorario(msg, indiceMensagem)}
        {renderizarFaixasCapacidade(msg)}
        {renderizarSalas(msg)}
        {renderizarResultadosBuscaSala(msg)}
        {renderizarReservas(msg)}
      </>
    )
  }

  function mensagemUsuarioFoiRespondida(indiceMensagem) {
    if (mensagens[indiceMensagem]?.autor !== "user") return false

    return mensagens.some((mensagem, index) => index > indiceMensagem && mensagem?.autor === "bot")
  }

  const usuarioLogado = getUsuarioLogado()
  const inicialUsuario =
    String(usuarioLogado?.nome || usuarioLogado?.email || "A").trim().charAt(0).toUpperCase() || "A"

  return (
    <div className="chatbot-mobile-page">
      <section className="chatbot-mobile-card" aria-label="Assistente de reservas SIGSAS">
        <header className="chatbot-mobile-header">
          <div className="chatbot-mobile-header-avatar" aria-hidden="true">
            <img src={chatbotRobo} alt="" />
          </div>

          <div className="chatbot-mobile-header-copy">
            <strong>Assistente SIGSAS</strong>
            <small><i aria-hidden="true" /> Reservas guiadas</small>
          </div>

          <span className="chatbot-mobile-header-status">Online</span>
        </header>

        <div className="sigsas-chatbot-toolbar">
          <button
            type="button"
            className="sigsas-chatbot-toolbar-btn sigsas-chatbot-toolbar-btn-secondary"
            onClick={limparChatLocal}
          >
            Limpar conversa
          </button>

          <button
            type="button"
            className="sigsas-chatbot-toolbar-btn sigsas-chatbot-toolbar-btn-primary"
            onClick={reiniciarChat}
          >
            Reiniciar fluxo
          </button>
        </div>

        <div className="sigsas-chatbot-progress-wrap">{renderizarProgresso()}</div>

        <div className="chatbot-messages sigsas-chatbot-messages-clean">
          {mensagens.map((msg, index) => (
            <div
              key={`${msg.autor}-${index}-${msg.criadoEm || ""}`}
              className={`sigsas-chatbot-message-row ${msg.autor === "bot" ? "bot" : "user"}`}
            >
              {msg.autor === "bot" && (
                <div className="sigsas-chatbot-avatar bot" aria-hidden="true">
                  <img src={chatbotRobo} alt="" className="sigsas-chatbot-avatar-image" />
                </div>
              )}

              <div className={`premium-message ${msg.autor} sigsas-chatbot-message-bubble ${
                msg.autor === "bot" && msg.tipoInteracao
                  ? "sigsas-chatbot-rich-message"
                  : ""
              }`}>
                <span>{msg.autor === "bot" ? "SIGSAS" : "Você"}</span>
                <p>{msg.texto}</p>

                {msg.autor === "bot" && renderizarInteracao(msg, index)}

                <div className="sigsas-chatbot-message-meta">
                  <small>{formatarHorarioBrasil(msg?.criadoEm, msg?.fusoHorario)}</small>

                  {msg.autor === "user" && (
                    <small
                      className={`sigsas-chatbot-seen ${mensagemUsuarioFoiRespondida(index) ? "active" : "pending"}`}
                      aria-label={mensagemUsuarioFoiRespondida(index) ? "Mensagem visualizada" : "Mensagem enviada"}
                    >
                      ✓✓
                    </small>
                  )}
                </div>
              </div>

              {msg.autor === "user" && (
                <div className="sigsas-chatbot-avatar user" aria-hidden="true">{inicialUsuario}</div>
              )}
            </div>
          ))}

          {carregando && (
            <div className="sigsas-chatbot-message-row bot">
              <div className="sigsas-chatbot-avatar bot" aria-hidden="true">
                <img src={chatbotRobo} alt="" className="sigsas-chatbot-avatar-image" />
              </div>
              <div className="premium-message bot typing-message sigsas-chatbot-message-bubble">
                <span>SIGSAS</span>
                <div className="typing-dots" aria-label="SIGSAS está digitando"><i /><i /><i /></div>
              </div>
            </div>
          )}

          <div ref={fimMensagensRef} />
        </div>

        <form className="premium-chatbot-form sigsas-chatbot-composer" onSubmit={enviarMensagemManual}>
          <input
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Digite sua resposta..."
            disabled={carregando}
            aria-label="Digite sua resposta para o SIGSAS"
          />

          <button type="submit" className="sigsas-chatbot-send-btn" disabled={carregando} aria-label="Enviar mensagem">
            ➤
          </button>
        </form>
      </section>
    </div>
  )
}

export default ChatFluxoMobile
