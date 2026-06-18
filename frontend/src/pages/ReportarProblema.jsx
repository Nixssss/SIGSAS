import { useEffect, useState } from "react"
import ReportarProblemaDesktop from "./problemas/ReportarProblemaDesktop"
import ReportarProblemaMobile from "./problemas/ReportarProblemaMobile"

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

function ReportarProblema() {
  const isMobile = useIsMobile()

  return isMobile ? <ReportarProblemaMobile /> : <ReportarProblemaDesktop />
}

export default ReportarProblema
