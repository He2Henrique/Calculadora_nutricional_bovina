import type { MisturaSalva } from '../types';

interface Props {
  misturas: MisturaSalva[];
  onCarregar: (m: MisturaSalva) => void;
  onExcluir: (m: MisturaSalva) => void;
}

export default function MisturasSection({ misturas, onCarregar, onExcluir }: Props) {
  if (!misturas.length) {
    return <div className="empty-hint">Nenhuma mistura salva.</div>;
  }

  return (
    <div className="list">
      {misturas.map((m) => (
        <div className="mix-row" key={m.id}>
          <button type="button" className="mix-name-btn" onClick={() => onCarregar(m)}>
            {m.nome}
          </button>
          <button type="button" className="icon-btn-danger" title="Excluir mistura" onClick={() => onExcluir(m)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
