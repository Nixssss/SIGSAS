import { useEffect, useState } from "react"

const MOBILE_QUERY = "(max-width: 767px)"

function obterEstadoInicial() {
  if (typeof window === "undefined") return false

  return window.matchMedia(MOBILE_QUERY).matches
}

function useAdminViewport() {
  const [mobile, setMobile] = useState(obterEstadoInicial)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const atualizarViewport = () => setMobile(mediaQuery.matches)

    atualizarViewport()
    mediaQuery.addEventListener("change", atualizarViewport)

    return () => {
      mediaQuery.removeEventListener("change", atualizarViewport)
    }
  }, [])

  return mobile
}

export default useAdminViewport
