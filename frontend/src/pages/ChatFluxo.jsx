import { useEffect, useRef, useState } from "react"
import api from "../services/api"

const SESSION_KEY = "sigsas_chatbot_session_id"
const MENSAGENS_KEY = "sigsas_chatbot_mensagens"

const etapasReserva = [
  "Data",
  "Campus",
  "Turno",
  "Tipo",
  "Pessoas",
  "Sala",
  "Confirmação",
]

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

  if (tipo === "calendario") return 0
  if (tipo === "botoes" && resposta?.resposta?.toLowerCase().includes("campus")) return 1
  if (tipo === "turnos") return 2
  if (tipo === "botoes" && resposta?.resposta?.toLowerCase().includes("tipo")) return 3
  if (resposta?.resposta?.toLowerCase().includes("quantidade")) return 4
  if (tipo === "lista-salas") return 5
  if (resposta?.resposta?.toLowerCase().includes("digite sim")) return 6

  return null
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
  const [turnosSelecionados, setTurnosSelecionados] = useState([])
  const [etapaAtual, setEtapaAtual] = useState(null)

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
      opcoes: data.opcoes || [],
      meses: data.meses || [],
      dias: data.dias || [],
      turnos: data.turnos || [],
      salas: data.salas || [],
    })
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

      const novasMensagens = [
        {
          autor: "bot",
          texto: data.resposta || "Fluxo reiniciado.",
          tipoInteracao: data.tipoInteracao || "menu",
          opcoes: data.opcoes || [
            { label: "1 - Reservar", valor: "1" },
            { label: "2 - Cancelar reserva", valor: "2" },
            { label: "3 - Confirmar reserva", valor: "3" },
          ],
        },
      ]

      setMensagens(novasMensagens)
      salvarMensagens(novasMensagens)
      setTurnosSelecionados([])
      setEtapaAtual(null)
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

  function limparChatLocal() {
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

    setTurnosSelecionados([])
    setEtapaAtual(null)
  }

  function selecionarTurno(valor) {
    setTurnosSelecionados((atual) => {
      if (valor === "dia_todo") {
        return atual.includes("dia_todo") ? [] : ["dia_todo"]
      }

      if (atual.includes("dia_todo")) {
        return [valor]
      }

      if (atual.includes(valor)) {
        return atual.filter((item) => item !== valor)
      }

      if (atual.length >= 2) {
        return atual
      }

      return [...atual, valor]
    })
  }

  async function confirmarTurnos() {
    if (!turnosSelecionados.length) return

    const labels = {
      manha: "Manhã",
      tarde: "Tarde",
      noite: "Noite",
      dia_todo: "Dia todo",
    }

    const textoUsuario = turnosSelecionados.map((t) => labels[t]).join(", ")

    adicionarMensagem({
      autor: "user",
      texto: textoUsuario,
    })

    setCarregando(true)

    try {
      await enviarParaBackend(`HORARIO:${turnosSelecionados.join(",")}`)
      setTurnosSelecionados([])
    } catch (error) {
      console.error(error)

      adicionarMensagem({
        autor: "bot",
        texto: "Erro ao enviar os turnos selecionados.",
      })
    } finally {
      setCarregando(false)
    }
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
                      dia.disponivel
                        ? enviarMensagemRapida(`DATA:${dia.dataIso}`, dia.dataBr)
                        : enviarMensagemRapida(`DATA:${dia.dataIso}`, dia.dataBr)
                    }
                    disabled={carregando}
                    title={dia.motivoIndisponivel || ""}
                  >
                    <span>{dia.dia}</span>
                    <small>{String(dia.mes).padStart(2, "0")}/{dia.ano}</small>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function renderizarTurnos(msg) {
    if (msg.tipoInteracao !== "turnos") return null

    const turnos = msg.turnos?.length
      ? msg.turnos
      : [
          { label: "Manhã", valor: "manha" },
          { label: "Tarde", valor: "tarde" },
          { label: "Noite", valor: "noite" },
          { label: "Dia todo", valor: "dia_todo" },
        ]

    return (
      <div className="chatbot-turnos premium-turnos">
        <p className="turnos-info">
          Escolha até dois turnos. Se escolher Dia todo, os demais serão
          desativados.
        </p>

        <div className="turnos-grid">
          {turnos.map((turno) => {
            const selecionado = turnosSelecionados.includes(turno.valor)
            const bloqueado =
              carregando ||
              (turnosSelecionados.includes("dia_todo") &&
                turno.valor !== "dia_todo") ||
              (!selecionado &&
                !turnosSelecionados.includes("dia_todo") &&
                turnosSelecionados.length >= 2 &&
                turno.valor !== "dia_todo")

            return (
              <button
                key={turno.valor}
                type="button"
                className={`turno-card ${selecionado ? "selected" : ""}`}
                disabled={bloqueado}
                onClick={() => selecionarTurno(turno.valor)}
              >
                <span>{turno.valor === "dia_todo" ? "☀" : "◷"}</span>
                <strong>{turno.label}</strong>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="btn primary confirm-turnos"
          onClick={confirmarTurnos}
          disabled={!turnosSelecionados.length || carregando}
        >
          Confirmar horário
        </button>
      </div>
    )
  }

  function renderizarSalas(msg) {
    if (msg.tipoInteracao !== "lista-salas" || !msg.salas?.length) return null

    return (
      <div className="chatbot-salas-grid premium-salas-grid">
        {msg.salas.map((sala) => (
          <div key={sala.id} className="chatbot-sala-card premium-sala-card">
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
              <div className="chatbot-sala-recursos">
                {sala.recursos.slice(0, 10).map((recurso) => (
                  <span key={recurso}>{recurso}</span>
                ))}

                {sala.recursos.length > 10 && (
                  <span>+{sala.recursos.length - 10} recursos</span>
                )}
              </div>
            )}

            <button
              type="button"
              className="btn primary escolher-sala-btn"
              onClick={() =>
                enviarMensagemRapida(String(sala.numeroLista), `Sala ${sala.numeroLista}`)
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

  function renderizarInteracao(msg) {
    return (
      <>
        {renderizarBotoes(msg)}
        {renderizarCalendario(msg)}
        {renderizarTurnos(msg)}
        {renderizarSalas(msg)}
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
              Reserva guiada com consulta de salas, campus, turnos e auditoria
              em tempo real.
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

              {msg.autor === "bot" && renderizarInteracao(msg)}
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

        <form className="chatbot-form premium-chatbot-form" onSubmit={enviarMensagemManual}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite sua resposta. Exemplo: 1, SIM, ou menu"
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