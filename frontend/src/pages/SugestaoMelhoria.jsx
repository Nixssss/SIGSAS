import { useEffect, useState } from "react"
import SugestaoMelhoriaDesktop from "./sugestoes/SugestaoMelhoriaDesktop"
import SugestaoMelhoriaMobile from "./sugestoes/SugestaoMelhoriaMobile"

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

function SugestaoMelhoria() {
  const isMobile = useIsMobile()

  return isMobile ? <SugestaoMelhoriaMobile /> : <SugestaoMelhoriaDesktop />
}

export default SugestaoMelhoria
