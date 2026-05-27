function ConfirmModal({
  aberto,
  titulo = "Confirmar ação",
  mensagem = "Tem certeza que deseja continuar?",
  textoCancelar = "Cancelar",
  textoConfirmar = "Confirmar",
  tipo = "warning",
  carregando = false,
  onCancelar,
  onConfirmar,
}) {
  if (!aberto) return null

  const icones = {
    warning: "⚠",
    danger: "✕",
    success: "✓",
    info: "i",
  }

  return (
    <div className="confirm-overlay">
      <div className={`confirm-modal ${tipo}`}>
        <div className="confirm-icon">{icones[tipo] || icones.warning}</div>

        <h3>{titulo}</h3>

        <p>{mensagem}</p>

        <div className="confirm-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={onCancelar}
            disabled={carregando}
          >
            {textoCancelar}
          </button>

          <button
            type="button"
            className={tipo === "danger" ? "btn danger" : "btn primary"}
            onClick={onConfirmar}
            disabled={carregando}
          >
            {carregando ? "Processando..." : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal