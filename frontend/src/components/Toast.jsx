import { useEffect, useState } from "react"

function Toast({ mensagem, tipo = "sucesso", onClose, id }) {
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      iniciarSaida()
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  function iniciarSaida() {
    setSaindo(true)

    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  return (
    <div className={`toast ${tipo} ${saindo ? "toast-exit" : ""}`}>
      {mensagem}
    </div>
  )
}

export default Toast