import type { Ingrediente, Nutriente } from '../types';
import { num } from '../lib/format';
import CommitInput from './CommitInput';

interface Props {
  ingredientes: Ingrediente[];
  nutrientes: Nutriente[];
  onAbrir: (id: string) => void;
  onPrecoChange: (id: string, valor: string) => void;
  buscaAtiva?: boolean;
}

export default function IngredientesSection({ ingredientes, nutrientes, onAbrir, onPrecoChange, buscaAtiva }: Props) {
  if (!ingredientes.length) {
    return <div className="empty-hint">{buscaAtiva ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado.'}</div>;
  }

  return (
    <div className="list">
      {ingredientes.map((ing) => {
        const preenchidos = nutrientes.filter((n) => num(ing.valores[n.id]) > 0).length;
        return (
          <div className="ing-row" key={ing.id}>
            <button type="button" className="ing-open-btn" onClick={() => onAbrir(ing.id)}>
              <span className="ing-name">{ing.nome || '(sem nome)'}</span>
              <span className="ing-summary">
                {preenchidos} de {nutrientes.length} compostos informados
              </span>
            </button>
            <label className="ing-price-label">
              <span>R$/kg</span>
              <CommitInput
                className="ing-price-input"
                inputMode="decimal"
                placeholder="—"
                value={ing.preco}
                onCommit={(valor) => onPrecoChange(ing.id, valor)}
              />
            </label>
            <button type="button" className="ing-chevron" title="Editar compostos" onClick={() => onAbrir(ing.id)}>
              ›
            </button>
          </div>
        );
      })}
    </div>
  );
}
