import type { Ingrediente, Linha } from '../types';
import { brl, fmt, num } from '../lib/format';

interface Props {
  misturaAtualNome: string;
  batch: string;
  saco: string;
  linhas: Linha[];
  ingredientesPorId: Map<string, Ingrediente>;
  pctMode: boolean;
  base: number;
  batchNum: number;
  totalPctLabel: string;
  totalKgLabel: string;
  custoTotalLabel: string;
}

export default function ListToPrint({
  misturaAtualNome,
  batch,
  saco,
  linhas,
  ingredientesPorId,
  pctMode,
  base,
  batchNum,
  totalPctLabel,
  totalKgLabel,
  custoTotalLabel
}: Props) {
  return (
    <section className="only-print print-sheet">
      <header className="print-sheet-header">
        <h1 className="print-sheet-title">{misturaAtualNome || 'Mistura sem nome'}</h1>
        <span className="print-sheet-sub">
          Misturador {batch} kg · Saco {saco} kg
        </span>
      </header>

      <h2 className="print-sheet-heading">Composição</h2>
      <div className="print-sheet-list">
        {linhas.map((l) => {
          const p = num(l.pct);
          const k = num(l.kg);
          const frac = base > 0 ? (pctMode ? p : k) / base : 0;
          const kgLinha = pctMode ? frac * batchNum : k;
          const ing = ingredientesPorId.get(l.ingredienteId);
          const pctVal = pctMode ? l.pct : base > 0 ? fmt(frac * 100, 1) : '0,0';
          const kgVal = pctMode ? fmt(kgLinha, kgLinha >= 100 ? 0 : 1) : l.kg;
          const custo = ing && num(ing.preco) > 0 ? brl(num(ing.preco) * kgLinha) : '—';

          return (
            <div className="print-sheet-row" key={l.id}>
              <span className="print-sheet-row-label">{ing?.nome || '(sem nome)'}</span>
              <span className="print-sheet-row-value">{pctVal}%</span>
              <span className="print-sheet-row-value">{kgVal} kg</span>
              <span className="print-sheet-row-value">{custo}</span>
            </div>
          );
        })}
      </div>

      <div className="print-sheet-totals">
        <span>Total {totalPctLabel}</span>
        <span>{totalKgLabel} kg</span>
        <span>{custoTotalLabel}</span>
      </div>
    </section>
  );
}
