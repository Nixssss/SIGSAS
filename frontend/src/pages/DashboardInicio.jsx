import { useEffect, useState } from "react"
import DashboardInicioDesktop from "./dashboard/DashboardInicioDesktop"
import DashboardInicioMobile from "./dashboard/DashboardInicioMobile"

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const consultar = () => {
    if (typeof window === "undefined") return false

    return window.innerWidth <= MOBILE_BREAKPOINT
  }

  const [isMobile, setIsMobile] = useState(consultar)

  useEffect(() => {
    function atualizarViewport() {
      setIsMobile(consultar())
    }

    atualizarViewport()
    window.addEventListener("resize", atualizarViewport)

    return () => {
      window.removeEventListener("resize", atualizarViewport)
    }
  }, [])

  return isMobile
}

function DashboardInicio({
  nomeUsuario = "Administrador",
  onNavegar,
  onAbrirAdmin,
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DashboardInicioMobile
        nomeUsuario={nomeUsuario}
        onNavegar={onNavegar}
        onAbrirAdmin={onAbrirAdmin}
      />
    )
  }

  return <DashboardInicioDesktop />
}

export default DashboardInicio