import axios from "axios"
import { useState, useEffect } from "react"

export default function ChatbotTeste(){

  const [mensagens, setMensagens] = useState([])

  const [texto, setTexto] = useState("")

  // mensagem inicial do bot
  useEffect(() => {

    setMensagens([
      {
        autor:"bot",
        texto:
          "1 - Reservar\n" +
          "2 - Cancelar reserva\n" +
          "3 - Confirmar reserva"
      }
    ])

  }, [])

  const enviarMensagem = async (e) => {

    e.preventDefault()

    if(!texto.trim()) return

    const mensagemUsuario = {
      autor:"user",
      texto:texto
    }
    setMensagens((prev)=> [...prev, mensagemUsuario])

    try{

      const response = await axios.post(
        "http://localhost:8000/api/v1/chatbot-fluxo/mensagem",
        {
          texto: texto,
          session_id: "teste123"
        }
      )

      console.log("RESPONSE COMPLETA:", response)
      console.log("DATA:", response.data)

      const mensagemBot = {
        autor: "bot",
        texto: response?.data?.resposta || "Sem resposta do servidor"
      }

      // adiciona resposta do bot
      setMensagens((prev) => [...prev, mensagemBot])

    }catch(error){

      console.log(error)

      setMensagens((prev)=> [
        ...prev,
        {
          autor:"bot",
          texto:"Erro ao conectar com backend"
        }
      ])
    }

    setTexto("")
  }

  return(
    <div className="content">

      <div className="card">

        <h2>Chatbot SIGSAS</h2>

        <div className="chat-container">

          <div className="chat-box">

            {mensagens.map((msg,index)=>(

              <div
                key={index}
                className={`chat-message ${msg.autor}`}
              >
                {msg.texto}
              </div>

            ))}

          </div>

          <form
            className="chat-input-area"
            onSubmit={enviarMensagem}
          >

            <input
              type="text"
              placeholder="Digite sua mensagem..."
              value={texto}
              onChange={(e)=>setTexto(e.target.value)}
            />

            <button
              type="submit"
              className="btn primary"
            >
              Enviar
            </button>

          </form>

        </div>

      </div>

    </div>
  )
}