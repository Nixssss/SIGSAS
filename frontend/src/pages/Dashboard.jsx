import { useEffect, useState } from "react"
import DashboardDesktop from "./dashboard/DashboardDesktop"
import DashboardMobile from "./dashboard/DashboardMobile"

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

function Dashboard({ sair }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DashboardMobile sair={sair} />
  }

  return <DashboardDesktop sair={sair} />
}

export default Dashboard
