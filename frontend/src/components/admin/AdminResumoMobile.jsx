import "../../styles/admin/AdminResumoMobile.css"

function AdminResumoMobile({ instituicoes, campi, edificios, salas }) {
  const indicadores = [
    { rotulo: "Instituições", valor: instituicoes.length },
    { rotulo: "Campi", valor: campi.length },
    { rotulo: "Edifícios", valor: edificios.length },
    { rotulo: "Salas", valor: salas.length },
  ]

  return (
    <section className="admin-mobile-resumo" aria-label="Resumo administrativo">
      {indicadores.map((indicador) => (
        <div className="admin-mobile-resumo-item" key={indicador.rotulo}>
          <span>{indicador.rotulo}</span>
          <strong>{indicador.valor}</strong>
        </div>
      ))}
    </section>
  )
}

export default AdminResumoMobile
