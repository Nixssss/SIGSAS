function SkeletonLoader({
  tipo = "cards",
  linhas = 6,
  colunas = 4,
  titulo = true,
}) {
  if (tipo === "tabela") {
    return (
      <div className="skeleton-table-card">
        {titulo && (
          <div className="skeleton-table-header">
            <div>
              <div className="skeleton skeleton-line medium" />
              <div className="skeleton skeleton-line short" />
            </div>

            <div className="skeleton skeleton-button" />
          </div>
        )}

        <div className="skeleton-table-wrapper">
          <div
            className="skeleton-table-grid skeleton-table-head"
            style={{ gridTemplateColumns: `repeat(${colunas}, 1fr)` }}
          >
            {Array.from({ length: colunas }).map((_, index) => (
              <div key={index} className="skeleton skeleton-line medium" />
            ))}
          </div>

          {Array.from({ length: linhas }).map((_, linhaIndex) => (
            <div
              key={linhaIndex}
              className="skeleton-table-grid"
              style={{ gridTemplateColumns: `repeat(${colunas}, 1fr)` }}
            >
              {Array.from({ length: colunas }).map((_, colunaIndex) => (
                <div
                  key={colunaIndex}
                  className={`skeleton skeleton-line ${
                    colunaIndex % 2 === 0 ? "long" : "medium"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (tipo === "auditoria") {
    return (
      <div className="skeleton-auditoria">
        <div className="skeleton-auditoria-hero">
          <div>
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line long" />
          </div>

          <div className="skeleton-actions">
            <div className="skeleton skeleton-button" />
            <div className="skeleton skeleton-button" />
            <div className="skeleton skeleton-button" />
          </div>
        </div>

        <div className="skeleton-stats-grid">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton-stat-card">
              <div className="skeleton skeleton-line medium" />
              <div className="skeleton skeleton-number" />
              <div className="skeleton skeleton-line short" />
            </div>
          ))}
        </div>

        <div className="skeleton-monitor-grid">
          <div className="skeleton-panel-card">
            <div className="skeleton skeleton-line medium" />
            <div className="skeleton skeleton-donut" />
          </div>

          <div className="skeleton-panel-card">
            <div className="skeleton skeleton-line medium" />
            <div className="skeleton skeleton-chart" />
          </div>

          <div className="skeleton-panel-card">
            <div className="skeleton skeleton-line medium" />
            <div className="skeleton skeleton-chart" />
          </div>
        </div>

        <SkeletonLoader tipo="tabela" linhas={5} colunas={8} titulo={false} />
      </div>
    )
  }

  return (
    <div className="skeleton-card-grid">
      {Array.from({ length: linhas }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton skeleton-line long" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  )
}

export default SkeletonLoader