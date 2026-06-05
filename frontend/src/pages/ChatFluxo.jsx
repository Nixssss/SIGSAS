import { useEffect, useRef, useState } from "react"
import api from "../services/api"

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

function gerarHorariosDisponiveis(inicio, fim, intervalo = INTERVALO_HORARIO_MINUTOS) {
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

function normalizarHorariosParaPicker(horarios) {
  if (!Array.isArray(horarios)) return []

  return horarios
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

function ChatFluxo() {
  const mensagensIniciais = obterMensagensSalvas()

  const [mensagens, setMensagens] = useState(
    mensagensIniciais.length
      ? mensagensIniciais
      : [
          {
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
          },
        ]
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
    setMensagens((atual) => [...atual, mensagem])
  }

  function atualizarEtapaPelaResposta(data) {
    const etapa = detectarEtapaPorResposta(data)

    if (etapa !== null) {
      setEtapaAtual(etapa)
    }
  }

  async function enviarParaBackend(mensagem) {
    const usuario = getUsuarioLogado()

    const payload = {
      texto: mensagem,
      session_id: sessionIdRef.current,
      idUsuario: usuario?.id || usuario?.idUsuario || null,
    }

    const response = await api.post("/chatbot-fluxo/mensagem", payload)
    const data = response.data || {}

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
  }

  async function enviarMensagemManual(e) {
    e.preventDefault()

    const mensagem = texto.trim()

    if (!mensagem || carregando) return

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
        {
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
        },
      ]

      setMensagens(novasMensagens)
      salvarMensagens(novasMensagens)
      setReservasSelecionadas([])
      setEtapaAtual(null)
      setTimePickerAberto(null)
      setUltimoHorarioInicio(null)
    } catch (error) {
      console.error(error)

      const novasMensagens = [
        {
          autor: "bot",
          texto:
            "Não consegui reiniciar no backend, mas você pode digitar menu para voltar ao início.",
        },
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

    setMensagens([
      {
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
      },
    ])

    setReservasSelecionadas([])
    setEtapaAtual(null)
    setTimePickerAberto(null)
    setUltimoHorarioInicio(null)
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

  function obterUltimoHorarioAntesDaMensagem(indiceMensagem) {
    for (let i = indiceMensagem - 1; i >= 0; i -= 1) {
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

  async function enviarHorarioSelecionado(horario, campoHorario) {
    if (carregando) return

    setTimePickerAberto(null)

    if (campoHorario === "inicio") {
      setUltimoHorarioInicio(horario)
      setUltimoHorarioFim(null)
    }

    if (campoHorario === "fim") {
      setUltimoHorarioFim(horario)
    }

    await enviarMensagemRapida(horario, horario)
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
    alinhamento = "left",
    travado = false,
  }) {
    const pickerEstaAberto = !travado && timePickerAberto === id

    return (
      <div className={`chatbot-time-field ${alinhamento}-field`}>
        <label>{titulo}</label>

        <button
          type="button"
          className={`chatbot-time-trigger ${pickerEstaAberto ? "active" : ""} ${
            valor ? "selected" : ""
          } ${travado ? "locked" : ""}`}
          onClick={() => {
            if (!ativo || bloqueado || travado) return

            setTimePickerAberto((atual) => (atual === id ? null : id))
          }}
          disabled={!ativo || bloqueado || travado}
        >
          <span>{valor || placeholder}</span>
          <strong>🕒</strong>
          <i>⌄</i>
        </button>

        <small>{subtitulo}</small>

        {pickerEstaAberto && ativo && !bloqueado && (
          <div className="chatbot-time-popover">
            <div className="chatbot-time-popover-header">
              <strong>{titulo}</strong>
              <span>08:00 - 22:30</span>
            </div>

            <div className="chatbot-time-list">
              {horarios.map((item) => {
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
                      horario === valor ? "selected" : ""
                    } ${!disponivel ? "disabled" : ""}`}
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

    const horarioInicioReferencia =
      ultimoHorarioInicio || obterUltimoHorarioAntesDaMensagem(indiceMensagem)

    const minimoHorarioFim = horarioInicioReferencia
      ? minutosParaHorario(
          horarioParaMinutos(horarioInicioReferencia) +
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

    const horariosFim =
      campoHorario === "fim" && horariosBackend.length > 0
        ? horariosBackend
        : gerarHorariosDisponiveis(
            minimoHorarioFim,
            HORARIO_MAXIMO_RESERVA,
            INTERVALO_HORARIO_MINUTOS
          )

    const selecionandoFim = campoHorario === "fim"
    const horarioFimSelecionado =
      selecionandoFim
        ? ultimoHorarioFim || obterPrimeiroHorarioDepoisDaMensagem(indiceMensagem)
        : null
    const fluxoJaAvancou = selecionandoFim && existeMensagemBotDepois(indiceMensagem)

    return (
      <div className="chatbot-time-box cascade-time-box">
        <div className="chatbot-time-headline">
          <strong>Escolha o horário da reserva</strong>
          <span>Intervalos de 15 minutos</span>
        </div>

        <div className="chatbot-time-row cascade-time-row">
          {renderizarCampoHorario({
            id: `${indiceMensagem}-inicio`,
            titulo: "Hora de início",
            valor: selecionandoFim ? horarioInicioReferencia : null,
            placeholder: "Selecionar início",
            subtitulo: "Primeiro horário da reserva",
            ativo: !selecionandoFim,
            bloqueado: carregando,
            travado: selecionandoFim,
            horarios: horariosInicio,
            alinhamento: "inicio",
            aoSelecionar: (horario) => enviarHorarioSelecionado(horario, "inicio"),
          })}

          {renderizarCampoHorario({
            id: `${indiceMensagem}-fim`,
            titulo: "Hora de término",
            valor: horarioFimSelecionado,
            placeholder: "Selecionar término",
            subtitulo: horarioFimSelecionado
              ? "Horário final selecionado"
              : horarioInicioReferencia
              ? `Após ${horarioInicioReferencia}`
              : "Liberado após escolher o início",
            ativo: selecionandoFim && !!horarioInicioReferencia && !horarioFimSelecionado,
            bloqueado: carregando || !horarioInicioReferencia || fluxoJaAvancou,
            travado: !!horarioFimSelecionado || fluxoJaAvancou,
            horarios: horariosFim,
            alinhamento: "fim",
            aoSelecionar: (horario) => enviarHorarioSelecionado(horario, "fim"),
          })}
        </div>

        {selecionandoFim && !horarioInicioReferencia && (
          <p className="chatbot-time-alert">
            Escolha primeiro o horário de início para liberar os horários de
            término.
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
      <div className="chatbot-options premium-options">
        {msg.opcoes.map((opcao) => (
          <button
            key={opcao.valor}
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

    const meses = msg.meses?.length
      ? msg.meses
      : [
          {
            nomeMes: "Calendário",
            ano: "",
            dias: msg.dias || [],
          },
        ]

    const diasSemana = ["S", "T", "Q", "Q", "S", "S", "D"]

    return (
      <div className="chatbot-calendar-wrapper premium-calendar-wrapper">
        {meses.map((mes) => {
          const primeiroDia = mes.dias?.[0]
          const espacosAntes = primeiroDia ? primeiroDia.diaSemana : 0

          return (
            <div
              key={`${mes.nomeMes}-${mes.ano}`}
              className="calendar-month premium-calendar-month"
            >
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
                    onClick={() =>
                      enviarMensagemRapida(`DATA:${dia.dataIso}`, dia.dataBr)
                    }
                    disabled={carregando}
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

    const gridStyle = {
      width: "100%",
      marginTop: "16px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
      gap: "12px",
    }

    return (
      <div style={gridStyle}>
        {msg.campi.map((campus) => {
          const disponivel = campus.disponivel === true

          const cardStyle = {
            width: "100%",
            minHeight: "88px",
            padding: "14px 16px",
            borderRadius: "16px",
            border: disponivel
              ? "1px solid rgba(245, 158, 11, 0.42)"
              : "1px solid rgba(148, 163, 184, 0.18)",
            background: disponivel
              ? "radial-gradient(circle at top left, rgba(245, 158, 11, 0.13), transparent 42%), rgba(2, 6, 23, 0.96)"
              : "radial-gradient(circle at top left, rgba(148, 163, 184, 0.08), transparent 42%), rgba(15, 23, 42, 0.9)",
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "center",
            gap: "9px",
            textAlign: "left",
            cursor: disponivel && !carregando ? "pointer" : "not-allowed",
            opacity: disponivel ? 1 : 0.72,
            userSelect: "none",
          }

          const headerStyle = {
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "10px",
          }

          const nomeStyle = {
            color: "#f8fafc",
            fontSize: "14px",
            fontWeight: 950,
            lineHeight: 1.2,
            wordBreak: "break-word",
          }

          const statusStyle = {
            flexShrink: 0,
            padding: "5px 9px",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 950,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            color: disponivel ? "#22c55e" : "#f59e0b",
            background: disponivel
              ? "rgba(34, 197, 94, 0.12)"
              : "rgba(245, 158, 11, 0.12)",
            border: disponivel
              ? "1px solid rgba(34, 197, 94, 0.24)"
              : "1px solid rgba(245, 158, 11, 0.26)",
          }

          const motivoStyle = {
            color: "#94a3b8",
            fontSize: "11px",
            fontWeight: 800,
            lineHeight: 1.35,
          }

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
            <div
              key={campus.idCampus}
              role="button"
              tabIndex={disponivel ? 0 : -1}
              style={cardStyle}
              onClick={selecionarCampus}
              onKeyDown={selecionarComEnter}
              title={campus.motivoIndisponivel || ""}
            >
              <div style={headerStyle}>
                <strong style={nomeStyle}>{campus.nome}</strong>

                <span style={statusStyle}>
                  {disponivel ? "Disponível" : "Indisponível"}
                </span>
              </div>

              {!disponivel && (
                <small style={motivoStyle}>
                  {campus.motivoIndisponivel ||
                    "Não há salas disponíveis neste campus."}
                </small>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function renderizarFaixasCapacidade(msg) {
    if (
      msg.tipoInteracao !== "faixas-capacidade" ||
      !msg.faixasCapacidade?.length
    ) {
      return null
    }

    const gridStyle = {
      width: "100%",
      marginTop: "16px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "12px",
    }

    return (
      <div style={gridStyle}>
        {msg.faixasCapacidade.map((faixa) => {
          const cardStyle = {
            minHeight: "72px",
            padding: "14px 16px",
            borderRadius: "16px",
            border: "1px solid rgba(245, 158, 11, 0.42)",
            background:
              "radial-gradient(circle at top left, rgba(245, 158, 11, 0.15), transparent 42%), rgba(2, 6, 23, 0.96)",
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            textAlign: "center",
            cursor: carregando ? "not-allowed" : "pointer",
            userSelect: "none",
          }

          const tituloStyle = {
            color: "#f8fafc",
            fontSize: "15px",
            fontWeight: 950,
            lineHeight: 1.1,
          }

          const subtituloStyle = {
            color: "#f59e0b",
            fontSize: "10px",
            fontWeight: 950,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }

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
            <div
              key={`${faixa.minimo}-${faixa.maximo}`}
              role="button"
              tabIndex={carregando ? -1 : 0}
              style={cardStyle}
              onClick={selecionarFaixa}
              onKeyDown={selecionarComEnter}
            >
              <strong style={tituloStyle}>
                {faixa.minimo} a {faixa.maximo}
              </strong>
              <span style={subtituloStyle}>pessoas</span>
            </div>
          )
        })}
      </div>
    )
  }

  function renderizarSalas(msg) {
    if (msg.tipoInteracao !== "lista-salas" || !msg.salas?.length) return null

    return (
      <div className="chatbot-salas-grid premium-salas-grid">
        {msg.salas.map((sala) => (
          <div key={sala.idSala} className="chatbot-sala-card premium-sala-card">
            <div className="chatbot-sala-top">
              <div>
                <strong>
                  {sala.numeroLista} - {sala.nome} | nº {sala.numero}
                </strong>
                <small>{sala.tipo}</small>
              </div>

              <span className="chatbot-sala-badge">
                {sala.capacidade} pessoas
              </span>
            </div>

            <div className="chatbot-sala-info">
              <p>
                <b>Campus:</b> {sala.campus}
              </p>
              <p>
                <b>Edifício:</b> {sala.edificio}
              </p>
              <p>
                <b>Instituição:</b> {sala.instituicao}
              </p>
              <p>
                <b>Andar:</b> {sala.andar}
              </p>
            </div>

            {!!sala.recursos?.length && (
              <div
                className="chatbot-sala-recursos compacta"
                title={sala.recursos.join(", ")}
              >
                {(sala.recursosResumo || sala.recursos.slice(0, 3)).map(
                  (recurso) => (
                    <span key={recurso}>{recurso}</span>
                  )
                )}

                {(sala.recursosRestantes ||
                  Math.max(sala.recursos.length - 3, 0)) > 0 && (
                  <span className="mais-recursos">
                    +
                    {sala.recursosRestantes ||
                      Math.max(sala.recursos.length - 3, 0)}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              className="btn primary escolher-sala-btn"
              onClick={() =>
                enviarMensagemRapida(
                  String(sala.numeroLista),
                  `Sala ${sala.numeroLista}`
                )
              }
              disabled={carregando}
            >
              Escolher esta sala
            </button>
          </div>
        ))}
      </div>
    )
  }

  function renderizarReservas(msg) {
    if (msg.tipoInteracao !== "checkbox-reservas" || !msg.reservas?.length) {
      return null
    }

    return (
      <div className="chatbot-reservas-box premium-reservas-box">
        <div className="chatbot-reservas-grid">
          {msg.reservas.map((reserva) => {
            const selecionada = reservaEstaSelecionada(reserva.idReserva)

            return (
              <label
                key={reserva.idReserva}
                className={`chatbot-reserva-card ${
                  selecionada ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selecionada}
                  onChange={() => alternarReservaSelecionada(reserva.idReserva)}
                  disabled={carregando}
                />

                <div className="chatbot-reserva-content">
                  <div className="chatbot-reserva-top">
                    <strong>Reserva #{reserva.idReserva}</strong>
                    <span>{reserva.status}</span>
                  </div>

                  <div className="chatbot-reserva-info">
                    <p>
                      <b>Sala:</b> {reserva.sala}
                    </p>
                    <p>
                      <b>Data:</b> {reserva.data} das {reserva.horaInicio} às{" "}
                      {reserva.horaFim}
                    </p>
                    <p>
                      <b>Solicitante:</b> {reserva.solicitante}
                    </p>
                    <p>
                      <b>Curso:</b> {reserva.curso || "Não informado"}
                    </p>
                    <p>
                      <b>Motivo:</b> {reserva.motivo}
                    </p>
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        <div className="chatbot-reservas-footer">
          <div className="chatbot-reservas-counter">
            {reservasSelecionadas.length} selecionada(s)
          </div>

          <button
            type="button"
            className="btn primary confirmar-reservas-btn"
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
        {renderizarReservas(msg)}
      </>
    )
  }

  return (
    <div className="chatbot-page premium-chatbot-page">
      <div className="chatbot-header premium-chatbot-header">
        <div className="chatbot-title-area">
          <div className="chatbot-avatar">🤖</div>

          <div>
            <span>Assistente acadêmico</span>
            <h1>Chatbot SIGSAS</h1>
            <p>
              Reserva guiada com consulta de salas, campus, horário, capacidade
              e auditoria em tempo real.
            </p>
          </div>
        </div>

        <div className="chatbot-header-actions">
          <button
            className="btn secondary"
            onClick={limparChatLocal}
            disabled={carregando}
          >
            Limpar conversa
          </button>

          <button
            className="btn primary"
            onClick={reiniciarChat}
            disabled={carregando}
          >
            Reiniciar fluxo
          </button>
        </div>
      </div>

      {renderizarProgresso()}

      <div className="chatbot-card premium-chatbot-card">
        <div className="chatbot-messages">
          {mensagens.map((msg, index) => (
            <div
              key={`${msg.autor}-${index}`}
              className={`chatbot-message ${msg.autor} premium-message`}
            >
              <span>{msg.autor === "bot" ? "SIGSAS" : "Você"}</span>

              <p>{msg.texto}</p>

              {msg.autor === "bot" && renderizarInteracao(msg, index)}
            </div>
          ))}

          {carregando && (
            <div className="chatbot-message bot premium-message typing-message">
              <span>SIGSAS</span>

              <div className="typing-dots">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}

          <div ref={fimMensagensRef} />
        </div>

        <form
          className="chatbot-form premium-chatbot-form"
          onSubmit={enviarMensagemManual}
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite sua resposta. Exemplo: 08:00, SIM, ou menu"
            disabled={carregando}
          />

          <button className="btn primary" type="submit" disabled={carregando}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatFluxo