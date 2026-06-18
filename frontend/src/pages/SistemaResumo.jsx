import { useEffect, useState } from "react"
import SistemaResumoDesktop from "./sistema/SistemaResumoDesktop"
import SistemaResumoMobile from "./sistema/SistemaResumoMobile"

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

function SistemaResumo() {
  const isMobile = useIsMobile()

  return isMobile ? <SistemaResumoMobile /> : <SistemaResumoDesktop />
}

export default SistemaResumo
