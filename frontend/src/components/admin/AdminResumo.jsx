function AdminResumo({ instituicoes, campi, edificios, salas }) {
  return (
    <div className="card dashboard-grid">
      <div className="dash-box">🏛 Instituições: {instituicoes.length}</div>
      <div className="dash-box">🏫 Campi: {campi.length}</div>
      <div className="dash-box">🏢 Edifícios: {edificios.length}</div>
      <div className="dash-box">🚪 Salas: {salas.length}</div>
    </div>
  )
}

export default AdminResumo