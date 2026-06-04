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

  function getIcone() {
    if (tipo === "sucesso") return "✔"
    if (tipo === "erro") return "!"
    if (tipo === "editado") return "✎"
    if (tipo === "excluido") return "🗑"
    if (tipo === "aviso") return "!"
    return "i"
  }

  function getTitulo() {
    if (tipo === "sucesso") return "Sucesso"
    if (tipo === "erro") return "Erro"
    if (tipo === "editado") return "Atualizado"
    if (tipo === "excluido") return "Excluído"
    if (tipo === "aviso") return "Atenção"
    return "Aviso"
  }

  return (
    <div className={`toast ${tipo} ${saindo ? "toast-exit" : ""}`}>
      <div className="toast-icon">{getIcone()}</div>

      <div className="toast-content">
        <strong>{getTitulo()}</strong>
        <span>{mensagem}</span>
      </div>

      <button
        type="button"
        className="toast-close"
        onClick={iniciarSaida}
        aria-label="Fechar notificação"
      >
        ×
      </button>
    </div>
  )
}

export default Toast