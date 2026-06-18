function AdminBuscaDesktop({ busca, setBusca }) {
  return (
    <div className="card">
      <input
        placeholder="Buscar instituição, campus ou edifício..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
    </div>
  )
}

export default AdminBuscaDesktop