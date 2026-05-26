import { useEffect, useRef, useState } from "react"
import api from "../services/api"

const SESSION_KEY = "sigsas_chatbot_session_id"
const MENSAGENS_KEY = "sigsas_chatbot_mensagens"

const MENSAGEM_INICIAL = {
  autor: "bot",
  texto:
    "Olá! Sou o chatbot do SIGSAS. Escolha uma opção:\n\n" +
    "1 - Reservar\n" +
    "2 - Cancelar reserva\n" +
    "3 - Confirmar reserva",
}

function obterSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    sessionId = `sessao-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

function carregarMensagensSalvas() {
  try {
    const mensagensSalvas = JSON.parse(localStorage.getItem(MENSAGENS_KEY))

    if (Array.isArray(mensagensSalvas) && mensagensSalvas.length > 0) {
      return mensagensSalvas
    }

    return [MENSAGEM_INICIAL]
  } catch {
    return [MENSAGEM_INICIAL]
  }
}

function ChatFluxo() {
  const [mensagens, setMensagens] = useState(carregarMensagensSalvas)
  const [texto, setTexto] = useState("")
  const [carregando, setCarregando] = useState(false)
  const fimMensagensRef = useRef(null)
  const sessionIdRef = useRef(obterSessionId())

  useEffect(() => {
    localStorage.setItem(MENSAGENS_KEY, JSON.stringify(mensagens))
  }, [mensagens])

  useEffect(() => {
    fimMensagensRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  async function enviarMensagem(e) {
    e.preventDefault()

    const mensagem = texto.trim()
    if (!mensagem || carregando) return

    setMensagens((atual) => [...atual, { autor: "user", texto: mensagem }])
    setTexto("")
    setCarregando(true)

    try {
      const response = await api.post("/chatbot-fluxo/mensagem", {
        texto: mensagem,
        session_id: sessionIdRef.current,
      })

      setMensagens((atual) => [
        ...atual,
        {
          autor: "bot",
          texto: response?.data?.resposta || "Sem resposta do servidor.",
        },
      ])
    } catch (error) {
      console.error(error)

      setMensagens((atual) => [
        ...atual,
        {
          autor: "bot",
          texto: "Erro ao conectar com o backend do chatbot.",
        },
      ])
    } finally {
      setCarregando(false)
    }
  }

  async function reiniciarChat() {
    setCarregando(true)

    try {
      await api.post("/chatbot-fluxo/reset", {
        session_id: sessionIdRef.current,
      })

      const novoSessionId = `sessao-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`

      localStorage.setItem(SESSION_KEY, novoSessionId)
      sessionIdRef.current = novoSessionId

      setMensagens([MENSAGEM_INICIAL])
      localStorage.setItem(MENSAGENS_KEY, JSON.stringify([MENSAGEM_INICIAL]))
    } catch (error) {
      console.error(error)

      setMensagens([
        {
          autor: "bot",
          texto:
            "Não consegui reiniciar no backend, mas você pode digitar menu para voltar ao início.",
        },
      ])
    } finally {
      setCarregando(false)
    }
  }

  function limparHistoricoVisual() {
    const confirmar = window.confirm("Deseja apagar o histórico deste chat?")
    if (!confirmar) return

    localStorage.removeItem(MENSAGENS_KEY)
    setMensagens([MENSAGEM_INICIAL])
  }

  return (
    <div className="chatbot-page">
      <div className="chatbot-header">
        <div>
          <h1>Chatbot SIGSAS</h1>
          <p>
            Assistente para consultar salas disponíveis por capacidade, data e
            horário.
          </p>
        </div>

        <div className="actions">
          <button
            className="btn secondary"
            onClick={limparHistoricoVisual}
            disabled={carregando}
          >
            Limpar histórico
          </button>

          <button
            className="btn secondary"
            onClick={reiniciarChat}
            disabled={carregando}
          >
            Reiniciar
          </button>
        </div>
      </div>

      <div className="chatbot-card">
        <div className="chatbot-messages">
          {mensagens.map((msg, index) => (
            <div
              key={`${msg.autor}-${index}`}
              className={`chatbot-message ${msg.autor}`}
            >
              <span>{msg.autor === "bot" ? "SIGSAS" : "Você"}</span>
              <p>{msg.texto}</p>
            </div>
          ))}

          {carregando && (
            <div className="chatbot-message bot">
              <span>SIGSAS</span>
              <p>Processando...</p>
            </div>
          )}

          <div ref={fimMensagensRef} />
        </div>

        <form className="chatbot-form" onSubmit={enviarMensagem}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite sua resposta. Exemplo: 1"
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