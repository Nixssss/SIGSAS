import { useEffect, useState } from "react"
import StatusReservasDesktop from "./reservas/StatusReservasDesktop"
import StatusReservasMobile from "./reservas/StatusReservasMobile"

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

function StatusReservas() {
  const isMobile = useIsMobile()

  return isMobile ? <StatusReservasMobile /> : <StatusReservasDesktop />
}

export default StatusReservas
