import type { Ingrediente, Linha, Modo } from '../types';
import { brl, fmt, num } from '../lib/format';
import CommitInput from './CommitInput';

// Usado por quem precisa rolar a página até esta seção (ex.: ao carregar uma mistura salva).
export const MISTURA_SECTION_ID = 'mistura-section';

interface Props {
  misturaAtualNome: string;
  misturaAtualId: number | null;
  onModoChange: (modo: Modo) => void;
  batch: string;
  saco: string;
  onBatchChange: (v: string) => void;
  onSacoChange: (v: string) => void;
  linhas: Linha[];
  ingredientes: Ingrediente[];
  ingredientesPorId: Map<string, Ingrediente>;
  pctMode: boolean;
  base: number;
  batchNum: number;
  onLinhaSelect: (id: string, ingredienteId: string) => void;
  onLinhaPct: (id: string, pct: string) => void;
  onLinhaKg: (id: string, kg: string) => void;
  onLinhaRemove: (id: string) => void;
  onAddLinha: () => void;
  onSalvarMisturaAbrir: () => void;
  onDuplicarMistura: () => void;
  totalPctLabel: string;
  totalKgLabel: string;
  custoTotalLabel: string;
  corTotalPct: string;
  avisoText: string;
}

export default function MisturaSection({
  misturaAtualNome,
  misturaAtualId,
  onModoChange,
  batch,
  saco,
  onBatchChange,
  onSacoChange,
  linhas,
  ingredientes,
  ingredientesPorId,
  pctMode,
  base,
  batchNum,
  onLinhaSelect,
  onLinhaPct,
  onLinhaKg,
  onLinhaRemove,
  onAddLinha,
  onSalvarMisturaAbrir,
  onDuplicarMistura,
  totalPctLabel,
  totalKgLabel,
  custoTotalLabel,
  corTotalPct,
  avisoText
}: Props) {
  const editando = misturaAtualId !== null;

  return (
    <section id={MISTURA_SECTION_ID} tabIndex={-1} className={editando ? 'card card-editando' : 'card'}>
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-step">02</span>
          <h2 className="card-title">Mistura</h2>
          {editando && <span className="badge-editando">Editando</span>}
          <span className="card-hint">{editando ? `Editando "${misturaAtualNome}"` : ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className={editando ? 'btn-outline btn-outline-editando' : 'btn-outline'}
            onClick={onSalvarMisturaAbrir}
          >
            {editando ? 'Editar mistura' : 'Salvar mistura'}
          </button>
          {editando && (
            <button type="button" className="btn-outline" onClick={onDuplicarMistura} title="Criar uma nova mistura a partir desta">
              Duplicar como nova
            </button>
          )}
          <div className="segmented">
            <button type="button" className={pctMode ? 'active' : 'inactive'} onClick={() => onModoChange('pct')}>
              %
            </button>
            <button type="button" className={pctMode ? 'inactive' : 'active'} onClick={() => onModoChange('kg')}>
              kg
            </button>
          </div>
        </div>
      </div>

      <div className="subheader-fields">
        <label className="field">
          <span>Misturador (kg)</span>
          <CommitInput inputMode="decimal" value={batch} onCommit={onBatchChange} />
        </label>
        <label className="field">
          <span>Saco (kg)</span>
          <CommitInput inputMode="decimal" value={saco} onCommit={onSacoChange} />
        </label>
      </div>

      <div>
        <div className="list">
          {!linhas.length && <div className="empty-hint">Nenhum ingrediente na mistura.</div>}
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
              <div className="linha-row" key={l.id}>
                <select
                  className="linha-select"
                  value={l.ingredienteId}
                  onChange={(e) => onLinhaSelect(l.id, e.target.value)}
                >
                  {ingredientes.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome || '(sem nome)'}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="icon-btn-danger"
                  title="Remover linha"
                  onClick={() => onLinhaRemove(l.id)}
                >
                  ×
                </button>
                <div className="linha-sub">
                  <label className="linha-field">
                    <span>%</span>
                    <CommitInput
                      className={pctMode ? 'state-active' : 'state-locked'}
                      readOnly={!pctMode}
                      inputMode="decimal"
                      value={pctVal}
                      onCommit={(v) => onLinhaPct(l.id, v)}
                    />
                  </label>
                  <label className="linha-field">
                    <span>kg</span>
                    <CommitInput
                      className={!pctMode ? 'state-active' : 'state-locked'}
                      readOnly={pctMode}
                      inputMode="decimal"
                      value={kgVal}
                      onCommit={(v) => onLinhaKg(l.id, v)}
                    />
                  </label>
                  <label className="linha-field">
                    <span>Custo</span>
                    <span className="linha-cost">{custo}</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="totals-row">
          <div className="totals-item">
            <span className="totals-label">Total %</span>
            <span className="totals-value" style={{ color: corTotalPct }}>
              {totalPctLabel}
            </span>
          </div>
          <div className="totals-item">
            <span className="totals-label">Total kg</span>
            <span className="totals-value">{totalKgLabel}</span>
          </div>
          <div className="totals-item">
            <span className="totals-label">Custo total</span>
            <span className="totals-value">{custoTotalLabel}</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <button type="button" className="btn-outline" onClick={onAddLinha}>
          + Ingrediente na mistura
        </button>
        <span className="footer-hint">{avisoText}</span>
      </div>
    </section>
  );
}
