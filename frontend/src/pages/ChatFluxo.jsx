import { useEffect, useState } from "react"
import ChatFluxoDesktop from "./chatbot/ChatFluxoDesktop"
import ChatFluxoMobile from "./chatbot/ChatFluxoMobile"

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const consultarViewport = () => {
    if (typeof window === "undefined") return false

    return window.innerWidth <= MOBILE_BREAKPOINT
  }

  const [isMobile, setIsMobile] = useState(consultarViewport)

  useEffect(() => {
    function atualizarViewport() {
      setIsMobile(consultarViewport())
    }

    atualizarViewport()
    window.addEventListener("resize", atualizarViewport)

    return () => {
      window.removeEventListener("resize", atualizarViewport)
    }
  }, [])

  return isMobile
}

function ChatFluxo() {
  const isMobile = useIsMobile()

  return isMobile ? <ChatFluxoMobile /> : <ChatFluxoDesktop />
}

export default ChatFluxo
