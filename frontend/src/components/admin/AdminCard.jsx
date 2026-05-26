function AdminCard({ titulo, descricao, onClick }) {
  return (
    <div className="card admin-menu-card">
      <h3>{titulo}</h3>
      <p>{descricao}</p>

      <button className="btn primary" type="button" onClick={onClick}>
        Abrir
      </button>
    </div>
  )
}

export default AdminCard