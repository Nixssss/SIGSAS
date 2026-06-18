import { useEffect, useState } from "react"
import RedefinirSenhaDesktop from "./auth/RedefinirSenhaDesktop"
import RedefinirSenhaMobile from "./auth/RedefinirSenhaMobile"

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

function RedefinirSenha({ irLogin }) {
  const isMobile = useIsMobile()

  return isMobile ? <RedefinirSenhaMobile irLogin={irLogin} /> : <RedefinirSenhaDesktop irLogin={irLogin} />
}

export default RedefinirSenha
