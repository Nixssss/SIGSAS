import { useEffect, useState } from "react"
import SalasDesktop from "./salas/SalasDesktop"
import SalasMobile from "./salas/SalasMobile"

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

function Salas() {
  const isMobile = useIsMobile()

  return isMobile ? <SalasMobile /> : <SalasDesktop />
}

export default Salas
