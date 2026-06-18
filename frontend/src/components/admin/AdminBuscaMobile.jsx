import "../../styles/admin/AdminBuscaMobile.css"

function AdminBuscaMobile({ busca, setBusca }) {
  return (
    <section className="admin-mobile-search" aria-label="Busca administrativa">
      <label className="admin-mobile-search-label" htmlFor="admin-mobile-busca">
        Buscar registros administrativos
      </label>

      <input
        id="admin-mobile-busca"
        placeholder="Buscar instituição, campus ou edifício..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
    </section>
  )
}

export default AdminBuscaMobile
