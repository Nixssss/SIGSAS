import { useEffect, useState } from "react"
import EsqueciSenhaDesktop from "./auth/EsqueciSenhaDesktop"
import EsqueciSenhaMobile from "./auth/EsqueciSenhaMobile"

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const consultarViewport = () => {
    if (typeof window === "undefined") return false
    return window.innerWidth <= MOBILE_BREAKPOINT
  }

  const [isMobile, setIsMobile] = useState(consultarViewport)

  useEffect(() => {
    const atualizarViewport = () => setIsMobile(consultarViewport())

    atualizarViewport()
    window.addEventListener("resize", atualizarViewport)

    return () => window.removeEventListener("resize", atualizarViewport)
  }, [])

  return isMobile
}

function EsqueciSenha({ irLogin }) {
  const isMobile = useIsMobile()

  return isMobile ? <EsqueciSenhaMobile irLogin={irLogin} /> : <EsqueciSenhaDesktop irLogin={irLogin} />
}

export default EsqueciSenha
