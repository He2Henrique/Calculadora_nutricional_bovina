interface ResultadoItem {
  id: string;
  label: string;
  unit: string;
  valor: string;
}

interface Props {
  custoKgLabel: string;
  custoSacoLabel: string;
  resultado: ResultadoItem[];
  onImprimir: () => void;
}

export default function ResultadoSection({ custoKgLabel, custoSacoLabel, resultado, onImprimir }: Props) {
  return (
    <section className="result-card">
      <div className="result-header">
        <h2 className="result-title">Produto final</h2>
      </div>
      <div className="result-summary">
        <div className="result-summary-item">
          <span className="result-summary-label">Custo por kg</span>
          <span className="result-summary-value">{custoKgLabel}</span>
        </div>
        <div className="result-summary-item">
          <span className="result-summary-label">Custo por saco</span>
          <span className="result-summary-value">{custoSacoLabel}</span>
        </div>
      </div>
      <div className="result-list-label">Níveis de garantia / kg</div>
      <div className="list">
        {!resultado.length && (
          <div className="empty-hint" style={{ color: '#9c948a' }}>
            Nenhum composto cadastrado.
          </div>
        )}
        {resultado.map((r) => (
          <div className="result-row" key={r.id}>
            <span className="result-row-label">
              {r.label} <span className="result-row-unit">{r.unit}</span>
            </span>
            <span className="result-row-value">{r.valor}</span>
          </div>
        ))}
      </div>
      <div className="result-footer">
        <button type="button" className="btn-gold" onClick={onImprimir}>
          Imprimir / PDF
        </button>
      </div>
    </section>
  );
}
