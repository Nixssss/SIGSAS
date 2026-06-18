import { useEffect, useState } from "react"
import CadastroDesktop from "./auth/CadastroDesktop"
import CadastroMobile from "./auth/CadastroMobile"

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

function Cadastro({ irLogin }) {
  const isMobile = useIsMobile()

  return isMobile ? <CadastroMobile irLogin={irLogin} /> : <CadastroDesktop irLogin={irLogin} />
}

export default Cadastro
