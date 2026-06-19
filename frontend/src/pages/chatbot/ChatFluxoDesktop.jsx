import { useEffect, useRef, useState } from "react"
import api from "../../services/api"
import chatbotRobo from "../../assets/chatbot-robo.png"

const SESSION_KEY = "sigsas_chatbot_session_id"
const MENSAGENS_KEY = "sigsas_chatbot_mensagens"

const etapasReserva = [
  "Instituição",
  "Data",
  "Campus",
  "Horário",
  "Tipo",
  "Capacidade",
  "Sala",
  "Confirmação",
]

const HORARIO_MINIMO_RESERVA = "08:00"
const HORARIO_MAXIMO_RESERVA = "22:30"
const INTERVALO_HORARIO_MINUTOS = 15

function horarioParaMinutos(horario) {
  const partes = String(horario || "").split(":")
  const horas = Number(partes[0])
  const minutos = Number(partes[1])

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
  const horarios = []
  const inicioMinutos = horarioParaMinutos(inicio)
  const fimMinutos = horarioParaMinutos(fim)

  if (inicioMinutos === null || fimMinutos === null || inicioMinutos > fimMinutos) {
    return horarios
  }

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
          return {
            horario: item,
            disponivel: true,
            motivo: "Disponível",
          }
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
  const match = String(texto || "").match(/\b([01]\d|2[0-3]):([0-5]\d)\b/)
  return match ? match[0] : null
}

function obterSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    sessionId = `sessao-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(SESSION_KEY, sessionId)
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

    if (Number.isNaN(data.getTime())) {
      return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: obterFusoHorarioBrasil(),
      }).format(new Date())
    }

    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: fusoHorario || obterFusoHorarioBrasil(),
    }).format(data)
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
      "Olá! Sou o chatbot do SIGSAS. Escolha uma opção:\n\n" +
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
    const mensagens = JSON.parse(localStorage.getItem(MENSAGENS_KEY) || "[]")
    return Array.isArray(mensagens) ? mensagens : []
  } catch {
    return []
  }
}

function salvarMensagens(mensagens) {
  localStorage.setItem(MENSAGENS_KEY, JSON.stringify(mensagens))
}

function detectarEtapaPorResposta(resposta) {
  const tipo = resposta?.tipoInteracao
  const texto = resposta?.resposta?.toLowerCase() || ""

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

  if (!idInstituicao) {
    return null
  }

  return {
    label: instituicao.nome,
    valor: `INSTITUICAO:${idInstituicao}`,
  }
}


const MESES_FUNCIONAMENTO_PRIMEIRO_SEMESTRE = [2, 3, 4, 5, 6]
const MESES_FUNCIONAMENTO_SEGUNDO_SEMESTRE = [8, 9, 10, 11, 12]
const MESES_FUNCIONAMENTO = [
  ...MESES_FUNCIONAMENTO_PRIMEIRO_SEMESTRE,
  ...MESES_FUNCIONAMENTO_SEGUNDO_SEMESTRE,
]

const NOMES_MESES_PARA_NUMERO = {
  janeiro: 1,
  jan: 1,
  fevereiro: 2,
  fev: 2,
  março: 3,
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

  const nomeMes = String(mes?.nomeMes || mes?.nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

  return NOMES_MESES_PARA_NUMERO[nomeMes] || null
}

function obterAnoCalendario(mes) {
  const primeiroDia = Array.isArray(mes?.dias) ? mes.dias[0] : null
  const anoDoDia = Number(primeiroDia?.ano)

  if (!Number.isNaN(anoDoDia) && anoDoDia > 1900) {
    return anoDoDia
  }

  const anoDireto = Number(mes?.ano)

  if (!Number.isNaN(anoDireto) && anoDireto > 1900) {
    return anoDireto
  }

  return null
}

function obterMesesPermitidosPelaDataAtual(dataAtual = new Date()) {
  const mesAtual = dataAtual.getMonth() + 1

  if (MESES_FUNCIONAMENTO_PRIMEIRO_SEMESTRE.includes(mesAtual)) {
    return MESES_FUNCIONAMENTO_PRIMEIRO_SEMESTRE.filter((mes) => mes >= mesAtual)
  }

  if (MESES_FUNCIONAMENTO_SEGUNDO_SEMESTRE.includes(mesAtual)) {
    return MESES_FUNCIONAMENTO_SEGUNDO_SEMESTRE.filter((mes) => mes >= mesAtual)
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

    if (!numeroMes) return false
    if (anoMes !== anoAtual) return false
    if (!MESES_FUNCIONAMENTO.includes(numeroMes)) return false

    return mesesPermitidos.includes(numeroMes)
  })
}

function ChatFluxoDesktop() {
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
    fimMensagensRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens, carregando])

  function adicionarMensagem(mensagem) {
    setMensagens((atual) => [...atual, criarMensagemChat(mensagem)])
  }

  function atualizarEtapaPelaResposta(data) {
    const etapa = detectarEtapaPorResposta(data)

    if (etapa !== null) {
      setEtapaAtual(etapa)
    }
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

      if (opcoes.silencioso) {
        atualizarEtapaPelaResposta(dataInstituicao)

        if (dataInstituicao.tipoInteracao === "checkbox-reservas") {
          setReservasSelecionadas([])
        }

        return dataInstituicao
      }

      atualizarEtapaPelaResposta(dataInstituicao)

      adicionarMensagem({
        autor: "bot",
        texto: dataInstituicao.resposta || "Sem resposta do servidor.",
        tipoInteracao: dataInstituicao.tipoInteracao || null,
        opcoes: montarOpcoesDaResposta(dataInstituicao),
        meses: dataInstituicao.meses || [],
        dias: dataInstituicao.dias || [],
        instituicoes: dataInstituicao.instituicoes || [],
        campi: dataInstituicao.campi || [],
        salas: dataInstituicao.salas || [],
        disponibilidadesSalas: dataInstituicao.disponibilidadesSalas || [],
        reservas: dataInstituicao.reservas || [],
        faixasCapacidade: dataInstituicao.faixasCapacidade || [],
        horarios: dataInstituicao.horarios || [],
        campoHorario: dataInstituicao.campoHorario || null,
        acaoReservas: dataInstituicao.acaoReservas || null,
        textoBotaoReservas: dataInstituicao.textoBotaoReservas || null,
      })

      if (dataInstituicao.tipoInteracao === "checkbox-reservas") {
        setReservasSelecionadas([])
      }

      return dataInstituicao
    }

    if (opcoes.silencioso) {
      atualizarEtapaPelaResposta(data)

      if (data.tipoInteracao === "checkbox-reservas") {
        setReservasSelecionadas([])
      }

      return data
    }

    atualizarEtapaPelaResposta(data)

    adicionarMensagem({
      autor: "bot",
      texto: data.resposta || "Sem resposta do servidor.",
      tipoInteracao: data.tipoInteracao || null,
      opcoes: montarOpcoesDaResposta(data),
      meses: data.meses || [],
      dias: data.dias || [],
      instituicoes: data.instituicoes || [],
      campi: data.campi || [],
      salas: data.salas || [],
      disponibilidadesSalas: data.disponibilidadesSalas || [],
      reservas: data.reservas || [],
      faixasCapacidade: data.faixasCapacidade || [],
      horarios: data.horarios || [],
      campoHorario: data.campoHorario || null,
      acaoReservas: data.acaoReservas || null,
      textoBotaoReservas: data.textoBotaoReservas || null,
    })

    if (data.tipoInteracao === "checkbox-reservas") {
      setReservasSelecionadas([])
    }

    return data
  }

  async function enviarMensagemManual(e) {
    e.preventDefault()

    const mensagem = texto.trim()
    if (!mensagem || carregando) return

    if (mensagemIniciaNovoFluxoReserva(mensagem)) {
      limparSelecaoHorariosDoNovoFluxo()
    }

    adicionarMensagem({
      autor: "user",
      texto: mensagem,
    })

    setTexto("")
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

    adicionarMensagem({
      autor: "user",
      texto: label || valor,
    })

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
      const opcoesMontadas = montarOpcoesDaResposta(data)

      const novasMensagens = [
        criarMensagemChat({
          autor: "bot",
          texto: data.resposta || "Fluxo reiniciado.",
          tipoInteracao: data.tipoInteracao || "menu",
          opcoes:
            opcoesMontadas.length > 0
              ? opcoesMontadas
              : [
                  { label: "1 - Reservar", valor: "1" },
                  { label: "2 - Cancelar reserva", valor: "2" },
                  { label: "3 - Confirmar reserva", valor: "3" },
                ],
          instituicoes: data.instituicoes || [],
          campi: data.campi || [],
          faixasCapacidade: data.faixasCapacidade || [],
        }),
      ]

      setMensagens(novasMensagens)
      salvarMensagens(novasMensagens)
      setReservasSelecionadas([])
      setEtapaAtual(null)
      setTimePickerAberto(null)
      setUltimoHorarioInicio(null)
      setUltimoHorarioFim(null)
    } catch (error) {
      console.error(error)

      const novasMensagens = [
        criarMensagemChat({
          autor: "bot",
          texto:
            "Não consegui reiniciar no backend, mas você pode digitar menu para voltar ao início.",
        }),
      ]

      setMensagens(novasMensagens)
      salvarMensagens(novasMensagens)
    } finally {
      setCarregando(false)
    }
  }

  async function limparChatLocal() {
    const usuario = getUsuarioLogado()
    const sessionIdAtual = sessionIdRef.current

    try {
      await api.post("/chatbot-fluxo/reset", {
        session_id: sessionIdAtual,
        idUsuario: usuario?.id || usuario?.idUsuario || null,
      })
    } catch (error) {
      console.error("Erro ao registrar limpeza do chatbot:", error)
    }

    localStorage.removeItem(MENSAGENS_KEY)
    localStorage.removeItem(SESSION_KEY)

    const novaSessao = obterSessionId()
    sessionIdRef.current = novaSessao

    const mensagensReiniciadas = [criarMensagemMenuInicial()]
    setMensagens(mensagensReiniciadas)
    salvarMensagens(mensagensReiniciadas)

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

    setReservasSelecionadas((atual) => {
      if (atual.includes(id)) {
        return atual.filter((item) => item !== id)
      }

      return [...atual, id]
    })
  }

  async function confirmarReservasSelecionadas(msg) {
    if (!reservasSelecionadas.length || carregando) return

    const acaoTexto = msg?.acaoReservas === "cancelar" ? "Cancelar" : "Confirmar"
    const textoUsuario =
      reservasSelecionadas.length === 1
        ? `${acaoTexto} reserva #${reservasSelecionadas[0]}`
        : `${acaoTexto} reservas ${reservasSelecionadas
            .map((id) => `#${id}`)
            .join(", ")}`

    adicionarMensagem({
      autor: "user",
      texto: textoUsuario,
    })

    setCarregando(true)

    try {
      await enviarParaBackend(`RESERVAS:${reservasSelecionadas.join(",")}`)
      setReservasSelecionadas([])
    } catch (error) {
      console.error(error)
      adicionarMensagem({
        autor: "bot",
        texto: "Erro ao enviar as reservas selecionadas.",
      })
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
    for (let i = indiceMensagem - 1; i >= 0; i -= 1) {
      if (mensagemMarcaInicioFluxoReserva(mensagens[i])) {
        return i
      }
    }

    return 0
  }

  function obterUltimoHorarioAntesDaMensagem(indiceMensagem) {
    const indiceInicioFluxo = obterIndiceInicioFluxoReserva(indiceMensagem)

    for (let i = indiceMensagem - 1; i > indiceInicioFluxo; i -= 1) {
      const mensagem = mensagens[i]

      if (mensagem?.autor === "user") {
        const horario = obterHorarioValidoDoTexto(mensagem.texto)

        if (horario) {
          return horario
        }
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
        setTimeout(() => {
          setTimePickerAberto(opcoes.abrirFimDepois)
        }, 120)
      }

      return
    }

    const horarioInicio =
      opcoes.horarioInicioReferencia || ultimoHorarioInicio || null

    if (campoHorario === "fim") {
      if (!horarioInicio) {
        return
      }

      setUltimoHorarioFim(horario)

      adicionarMensagem({
        autor: "user",
        texto: `${horarioInicio} às ${horario}`,
      })

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
    return mensagens.some(
      (mensagem, index) => index > indiceMensagem && mensagem?.autor === "bot"
    )
  }

  function obterPrimeiroHorarioDepoisDaMensagem(indiceMensagem) {
    for (let i = indiceMensagem + 1; i < mensagens.length; i += 1) {
      const mensagem = mensagens[i]

      if (mensagem?.autor === "bot") {
        break
      }

      if (mensagem?.autor === "user") {
        const horario = obterHorarioValidoDoTexto(mensagem.texto)

        if (horario) {
          return horario
        }
      }
    }

    return null
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
      <div className="chatbot-time-field">
        <div className="chatbot-time-label-row">
          <strong>{titulo}</strong>
        </div>

        <div className="chatbot-time-picker-wrap">
          <button
            type="button"
            className={`chatbot-time-trigger ${valor ? "selected" : ""} ${
              travado ? "locked" : ""
            }`}
            onClick={() => {
              if (!ativo || bloqueado || travado) return
              setTimePickerAberto((atual) => (atual === id ? null : id))
            }}
            disabled={!ativo || bloqueado || travado}
          >
            <span>{valor || placeholder}</span>
            <strong>⌄</strong>
          </button>

          {pickerEstaAberto && ativo && !bloqueado && (
            <div className="chatbot-time-popover">
              <div className="chatbot-time-popover-header">
                <strong>{titulo}</strong>
                <span>08:00 - 22:30</span>
              </div>

              <div className="chatbot-time-grid">
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
                      className={`chatbot-time-option ${
                        disponivel ? "available" : "disabled"
                      }`}
                      onClick={() => {
                        if (!disponivel) return
                        aoSelecionar(horario)
                      }}
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
        </div>

        <small>{subtitulo}</small>
      </div>
    )
  }


  function renderizarSeletorHorario(msg, indiceMensagem) {
    if (msg.tipoInteracao !== "horario-manual") return null

    if (existeMensagemHorarioDepois(indiceMensagem)) {
      return null
    }

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
      (campoHorario === "fim"
        ? obterPrimeiroHorarioDepoisDaMensagem(indiceMensagem)
        : null)

    const minimoHorarioFim = horarioInicioSelecionado
      ? minutosParaHorario(
          horarioParaMinutos(horarioInicioSelecionado) +
            INTERVALO_HORARIO_MINUTOS
        )
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
      <div className="premium-turnos">
        <div className="chatbot-time-header">
          <strong>Escolha o horário da reserva</strong>
          <span>Intervalos de 15 minutos</span>
        </div>

        <div className="chatbot-time-fields">
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
            travado: !!horarioFimSelecionado || fluxoJaAvancou,
            horarios: horariosInicio,
            aoSelecionar: (horario) =>
              enviarHorarioSelecionado(horario, "inicio", {
                abrirFimDepois: campoFimId,
              }),
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
            ativo: !!horarioInicioSelecionado && !horarioFimSelecionado,
            bloqueado:
              carregando ||
              !horarioInicioSelecionado ||
              !!horarioFimSelecionado ||
              fluxoJaAvancou,
            travado: !!horarioFimSelecionado || fluxoJaAvancou,
            horarios: horariosFim,
            aoSelecionar: (horario) =>
              enviarHorarioSelecionado(horario, "fim", {
                horarioInicioReferencia: horarioInicioSelecionado,
              }),
          })}
        </div>

        {!horarioInicioSelecionado && (
          <p className="turnos-info">
            Escolha primeiro o horário de início para liberar os horários de término.
          </p>
        )}
      </div>
    )
  }

  function renderizarProgresso() {
    return (
      <div className="chat-progress">
        {etapasReserva.map((etapa, index) => (
          <div
            key={etapa}
            className={`chat-progress-step ${
              etapaAtual !== null && index <= etapaAtual ? "active" : ""
            }`}
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

    if (tiposComRenderProprio.includes(msg.tipoInteracao)) {
      return null
    }

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
        <div className="premium-calendar-wrapper">
          <div className="premium-calendar-empty">
            <strong>Calendário indisponível</strong>
            <p>{obterMensagemPeriodoLetivo(dataAtual)}</p>
            <small>
              O SIGSAS exibe somente meses de funcionamento acadêmico:
              fevereiro a junho e agosto a dezembro.
            </small>
          </div>
        </div>
      )
    }

    return (
      <div className="premium-calendar-wrapper">
        {meses.map((mes) => {
          const primeiroDia = mes.dias?.[0]
          const espacosAntes = primeiroDia ? primeiroDia.diaSemana : 0

          return (
            <div key={`${mes.nomeMes}-${mes.ano}`} className="premium-calendar-month">
              <h4>
                {mes.nomeMes} {mes.ano}
              </h4>

              <div className="calendar-weekdays">
                {diasSemana.map((dia, index) => (
                  <div key={`${dia}-${index}`} className="calendar-weekday">
                    {dia}
                  </div>
                ))}
              </div>

              <div className="chatbot-calendar">
                {Array.from({ length: espacosAntes }).map((_, index) => (
                  <div key={`empty-${index}`} className="calendar-empty" />
                ))}

                {mes.dias.map((dia) => (
                  <button
                    key={dia.dataIso}
                    type="button"
                    className={`calendar-day ${
                      dia.disponivel ? "available" : "disabled"
                    }`}
                    onClick={() => {
                      if (!dia.disponivel || carregando) return
                      enviarMensagemRapida(`DATA:${dia.dataIso}`, dia.dataBr)
                    }}
                    disabled={carregando || !dia.disponivel}
                    title={dia.motivoIndisponivel || ""}
                  >
                    <span>{dia.dia}</span>
                    <small>
                      {String(dia.mes).padStart(2, "0")}/{dia.ano}
                    </small>
                  </button>
                ))}
              </div>
            </div>
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
        <div className="chat-campus-grid">
          {msg.campi.map((campus) => {
            const disponivel = campus.disponivel === true

            function selecionarCampus() {
              if (!disponivel || carregando) return
              enviarMensagemRapida(`CAMPUS:${campus.idCampus}`, campus.nome)
            }

            function selecionarComEnter(event) {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                selecionarCampus()
              }
            }

            return (
              <button
                key={campus.idCampus || campus.nome}
                type="button"
                className={`chat-campus-card ${
                  disponivel ? "disponivel" : "indisponivel"
                }`}
                onClick={selecionarCampus}
                onKeyDown={selecionarComEnter}
                disabled={!disponivel || carregando}
              >
                <div className="chat-campus-top">
                  <strong>{campus.nome}</strong>
                  <span>{disponivel ? "Disponível" : "Indisponível"}</span>
                </div>

                {!disponivel && (
                  <small>
                    {campus.motivoIndisponivel ||
                      "Não há salas ativas cadastradas neste campus."}
                  </small>
                )}
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
    if (
      msg.tipoInteracao !== "faixas-capacidade" ||
      !msg.faixasCapacidade?.length
    ) {
      return null
    }

    return (
      <div className="chat-capacity-grid">
        {msg.faixasCapacidade.map((faixa) => {
          function selecionarFaixa() {
            if (carregando) return
            enviarMensagemRapida(
              `FAIXA_CAPACIDADE:${faixa.minimo}-${faixa.maximo}`,
              `${faixa.minimo} a ${faixa.maximo} pessoas`
            )
          }

          function selecionarComEnter(event) {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              selecionarFaixa()
            }
          }

          return (
            <button
              key={`${faixa.minimo}-${faixa.maximo}`}
              type="button"
              className="chat-capacity-card"
              onClick={selecionarFaixa}
              onKeyDown={selecionarComEnter}
              disabled={carregando}
            >
              <strong>
                {faixa.minimo} a {faixa.maximo}
              </strong>
              <span>Pessoas</span>
            </button>
          )
        })}
      </div>
    )
  }

  function renderizarSalas(msg) {
    if (msg.tipoInteracao !== "lista-salas" || !msg.salas?.length) return null

    return (
      <div className="premium-salas-grid chatbot-salas-choice-grid">
        {msg.salas.map((sala) => {
          const recursos = Array.isArray(sala.recursos) ? sala.recursos : []
          const recursosPrincipais = recursos.slice(0, 3)
          const recursosRestantes = Math.max(
            recursos.length - recursosPrincipais.length,
            0
          )
          const recursosTexto = recursos.length
            ? recursos.join(", ")
            : "Nenhum recurso informado"

          return (
            <article
              key={sala.idSala || sala.numeroLista}
              className="premium-sala-card chatbot-sala-choice-card"
            >
              <div className="chatbot-sala-choice-head">
                <span className="chatbot-sala-choice-index">
                  {String(sala.numeroLista).padStart(2, "0")}
                </span>

                <div className="chatbot-sala-choice-title">
                  <strong>{sala.nome}</strong>
                  <small>
                    {sala.tipo} • Sala nº {sala.numero}
                  </small>
                </div>

                <span className="chatbot-sala-choice-capacity">
                  {sala.capacidade} pessoas
                </span>
              </div>

              <div className="chatbot-sala-choice-meta">
                <span>
                  <b>Campus</b>
                  {sala.campus}
                </span>

                <span>
                  <b>Edifício</b>
                  {sala.edificio}
                </span>

                <span>
                  <b>Andar</b>
                  {sala.andar}
                </span>

                <span>
                  <b>Instituição</b>
                  {sala.instituicao}
                </span>
              </div>

              <div
                className="chatbot-sala-choice-recursos"
                data-recursos={recursosTexto}
                title={recursosTexto}
              >
                {recursosPrincipais.length > 0 ? (
                  recursosPrincipais.map((recurso) => (
                    <span key={recurso}>{recurso}</span>
                  ))
                ) : (
                  <span>Nenhum recurso informado</span>
                )}

                {recursosRestantes > 0 && (
                  <span className="chatbot-sala-choice-more">
                    +{recursosRestantes} recursos
                  </span>
                )}
              </div>

              <div className="chatbot-sala-choice-footer">
                <small>Passe o mouse nos recursos para ver todos.</small>

                <button
                  type="button"
                  className="escolher-sala-btn btn primary"
                  onClick={() =>
                    enviarMensagemRapida(
                      String(sala.numeroLista),
                      `Sala ${sala.numeroLista}`
                    )
                  }
                  disabled={carregando}
                >
                  Escolher sala
                </button>
              </div>
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
      <div className="premium-salas-grid chatbot-salas-choice-grid chatbot-busca-salas-grid">
        {msg.disponibilidadesSalas.map((disponibilidade) => (
          <article
            key={`${disponibilidade.idSala}-${disponibilidade.dataIso}-${disponibilidade.horaInicio}`}
            className="premium-sala-card chatbot-sala-choice-card"
          >
            <div className="chatbot-sala-choice-head">
              <span className="chatbot-sala-choice-index">
                {String(disponibilidade.numeroLista).padStart(2, "0")}
              </span>

              <div className="chatbot-sala-choice-title">
                <strong>{disponibilidade.nome}</strong>
                <small>
                  {disponibilidade.tipo} • Sala nº {disponibilidade.numero}
                </small>
              </div>

              <span className="chatbot-sala-choice-capacity">
                {disponibilidade.capacidade} pessoas
              </span>
            </div>

            <div className="chatbot-sala-choice-meta">
              <span>
                <b>Data</b>
                {disponibilidade.dataBr}
              </span>

              <span>
                <b>Horário</b>
                {disponibilidade.horaInicio} às {disponibilidade.horaFim}
              </span>

              <span>
                <b>Campus</b>
                {disponibilidade.campus}
              </span>

              <span>
                <b>Sede/Prédio</b>
                {disponibilidade.edificio}
              </span>

              <span>
                <b>Instituição</b>
                {disponibilidade.instituicao}
              </span>
            </div>

            <div className="chatbot-sala-choice-footer">
              <small>
                Disponibilidade sugerida para uma reserva de {disponibilidade.duracao || "1 hora"}.
              </small>

              <button
                type="button"
                className="escolher-sala-btn btn primary"
                onClick={() =>
                  enviarMensagemRapida(
                    `BUSCA_DISPONIBILIDADE:${disponibilidade.numeroLista}`,
                    `${disponibilidade.nome} • ${disponibilidade.dataBr} • ${disponibilidade.horaInicio} às ${disponibilidade.horaFim}`
                  )
                }
                disabled={carregando}
              >
                Reservar neste horário
              </button>
            </div>
          </article>
        ))}
      </div>
    )
  }

  function renderizarReservas(msg) {
    if (msg.tipoInteracao !== "checkbox-reservas" || !msg.reservas?.length) {
      return null
    }

    return (
      <div className="chat-reservas-box">
        <div className="chat-reservas-grid">
          {msg.reservas.map((reserva) => {
            const selecionada = reservaEstaSelecionada(reserva.idReserva)

            return (
              <label
                key={reserva.idReserva}
                className={`chat-reserva-check ${selecionada ? "selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selecionada}
                  onChange={() => alternarReservaSelecionada(reserva.idReserva)}
                  disabled={carregando}
                />

                <span>
                  <strong>
                    Reserva #{reserva.idReserva} {reserva.status}
                  </strong>
                  <small>Sala: {reserva.sala}</small>
                  <small>
                    Data: {reserva.data} das {reserva.horaInicio} às {reserva.horaFim}
                  </small>
                  <small>Solicitante: {reserva.solicitante}</small>
                  <small>Curso: {reserva.curso || "Não informado"}</small>
                  <small>Motivo: {reserva.motivo}</small>
                </span>
              </label>
            )
          })}
        </div>

        <div className="chat-reservas-actions">
          <span>{reservasSelecionadas.length} selecionada(s)</span>

          <button
            type="button"
            className="btn primary"
            onClick={() => confirmarReservasSelecionadas(msg)}
            disabled={!reservasSelecionadas.length || carregando}
          >
            {msg.textoBotaoReservas || "Confirmar reservas selecionadas"}
          </button>
        </div>
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

  const usuarioLogado = getUsuarioLogado()
  const inicialUsuario = String(usuarioLogado?.nome || usuarioLogado?.email || "Admin")
    .trim()
    .charAt(0)
    .toUpperCase() || "A"

  function obterHorarioMensagem(msg) {
    return formatarHorarioBrasil(msg?.criadoEm, msg?.fusoHorario)
  }

  function mensagemUsuarioFoiRespondida(indiceMensagem) {
    if (mensagens[indiceMensagem]?.autor !== "user") return false

    return mensagens.some(
      (mensagem, index) => index > indiceMensagem && mensagem?.autor === "bot"
    )
  }

  return (
    <div className="premium-chatbot-page sigsas-chatbot-clean-page">
      <div className="premium-chatbot-card sigsas-chatbot-expanded-card">
        <div className="sigsas-chatbot-toolbar">
          <button
            type="button"
            className="sigsas-chatbot-toolbar-btn sigsas-chatbot-toolbar-btn-secondary"
            onClick={limparChatLocal}
          >
            <span aria-hidden="true">⌫</span>
            Limpar conversa
          </button>

          <button
            type="button"
            className="sigsas-chatbot-toolbar-btn sigsas-chatbot-toolbar-btn-primary"
            onClick={reiniciarChat}
          >
            <span aria-hidden="true">↻</span>
            Reiniciar fluxo
          </button>
        </div>

        <div className="sigsas-chatbot-progress-wrap">
          {renderizarProgresso()}
        </div>

        <div className="chatbot-messages sigsas-chatbot-messages-clean">
          {mensagens.map((msg, index) => (
            <div
              key={`${msg.autor}-${index}`}
              className={`sigsas-chatbot-message-row ${
                msg.autor === "bot" ? "bot" : "user"
              }`}
            >
              {msg.autor === "bot" && (
                <div className="sigsas-chatbot-avatar bot" aria-hidden="true">
                  <img
                    src={chatbotRobo}
                    alt="Assistente SIGSAS"
                    className="sigsas-chatbot-avatar-image"
                  />
                </div>
              )}

              <div className={`premium-message ${msg.autor} sigsas-chatbot-message-bubble`}>
                <span>{msg.autor === "bot" ? "SIGSAS" : "Você"}</span>
                <p>{msg.texto}</p>

                {msg.autor === "bot" && renderizarInteracao(msg, index)}

                <div className="sigsas-chatbot-message-meta">
                  <small>{obterHorarioMensagem(msg)}</small>

                  {msg.autor === "user" && (
                    <small
                      className={`sigsas-chatbot-seen ${
                        mensagemUsuarioFoiRespondida(index) ? "active" : "pending"
                      }`}
                      aria-label={
                        mensagemUsuarioFoiRespondida(index)
                          ? "Mensagem visualizada"
                          : "Mensagem enviada"
                      }
                    >
                      ✓✓
                    </small>
                  )}
                </div>
              </div>

              {msg.autor === "user" && (
                <div className="sigsas-chatbot-avatar user" aria-hidden="true">
                  {inicialUsuario}
                </div>
              )}
            </div>
          ))}

          {carregando && (
            <div className="sigsas-chatbot-message-row bot">
              <div className="sigsas-chatbot-avatar bot" aria-hidden="true">
                <img
                  src={chatbotRobo}
                  alt="Assistente SIGSAS"
                  className="sigsas-chatbot-avatar-image"
                />
              </div>

              <div className="premium-message bot typing-message sigsas-chatbot-message-bubble">
                <span>SIGSAS</span>
                <div className="typing-dots" aria-label="SIGSAS está digitando">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          )}

          <div ref={fimMensagensRef} />
        </div>

        <form className="premium-chatbot-form sigsas-chatbot-composer" onSubmit={enviarMensagemManual}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite sua resposta... Exemplo: 08:00, SIM, ou menu"
            disabled={carregando}
          />

          <button type="submit" className="sigsas-chatbot-send-btn" disabled={carregando}>
            ➤
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatFluxoDesktop
