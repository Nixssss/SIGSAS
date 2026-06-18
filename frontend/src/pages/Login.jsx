import { useEffect, useState } from "react"
import LoginDesktop from "./auth/LoginDesktop"
import LoginMobile from "./auth/LoginMobile"

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

function Login({ irCadastro, irEsqueci, irDashboard }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <LoginMobile
        irCadastro={irCadastro}
        irEsqueci={irEsqueci}
        irDashboard={irDashboard}
      />
    )
  }

  return (
    <LoginDesktop
      irCadastro={irCadastro}
      irEsqueci={irEsqueci}
      irDashboard={irDashboard}
    />
  )
}

export default Login
