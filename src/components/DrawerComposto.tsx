import type { Ingrediente, Nutriente } from '../types';
import CommitInput from './CommitInput';

interface Props {
  ingrediente: Ingrediente | null;
  nutrientes: Nutriente[];
  onClose: () => void;
  onNomeChange: (nome: string) => void;
  onValorChange: (nutrienteId: string, valor: string) => void;
  onAddComposto: () => void;
  onEditComposto: (n: Nutriente) => void;
  onEditUnidade: (n: Nutriente) => void;
  onRemoverProduto: () => void;
  onRemoveNutriente: (n: Nutriente) => void;
}

export default function DrawerComposto({
  ingrediente,
  nutrientes,
  onClose,
  onNomeChange,
  onValorChange,
  onAddComposto,
  onEditComposto,
  onEditUnidade,
  onRemoverProduto,
  onRemoveNutriente
}: Props) {
  const overlayClass = 'overlay' + (ingrediente ? '' : ' hidden');
  if (!ingrediente) {
    return <div className={overlayClass} />;
  }

  return (
    <div className={overlayClass}>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-handle-wrap">
          <span className="drawer-handle" />
        </div>
        <div className="drawer-head">
          <div className="drawer-head-fields">
            <span className="drawer-head-eyebrow">Compostos do produto</span>
            <CommitInput
              className="drawer-name-input"
              placeholder="Nome do produto"
              value={ingrediente.nome}
              onCommit={onNomeChange}
            />
          </div>
          <button type="button" className="drawer-close" title="Fechar" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-table-head">
            <span className="drawer-cell-label">Composto</span>
            <span className="drawer-cell-label">Valor / kg</span>
          </div>
          {!nutrientes.length && <div className="empty-hint">Nenhum composto cadastrado. Use "+ Composto" abaixo.</div>}
          {nutrientes.map((n) => (
            <div className="composto-row" key={n.id}>
              <span className="composto-name">
                <span
                  className="composto-label"
                  role="button"
                  tabIndex={0}
                  title="Editar nome do composto"
                  onClick={() => onEditComposto(n)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onEditComposto(n)}
                >
                  {n.label}
                </span>{' '}
                <span
                  className="composto-unit"
                  role="button"
                  tabIndex={0}
                  title="Editar unidade de medida"
                  onClick={() => onEditUnidade(n)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onEditUnidade(n)}
                >
                  {n.unit}
                </span>
                <button
                  type="button"
                  className="composto-remove"
                  title="Remover composto"
                  onClick={() => onRemoveNutriente(n)}
                >
                  ×
                </button>
              </span>
              <CommitInput
                className="composto-value-input"
                inputMode="decimal"
                placeholder="—"
                value={ingrediente.valores[n.id] ?? ''}
                onCommit={(valor) => onValorChange(n.id, valor)}
              />
            </div>
          ))}
        </div>

        <div className="drawer-footer">
          <button type="button" className="btn-outline" onClick={onAddComposto}>
            + Composto
          </button>
          <button type="button" className="btn-danger-outline" onClick={onRemoverProduto}>
            Excluir produto
          </button>
          <button type="button" className="btn-dark-flex" onClick={onClose}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
