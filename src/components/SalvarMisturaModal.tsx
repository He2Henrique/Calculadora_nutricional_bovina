import type { SalvarMisturaState } from '../types';
import CommitInput from './CommitInput';

interface Props {
  salvarMisturaAberto: SalvarMisturaState | null;
  editando: boolean;
  onNomeChange: (nome: string) => void;
  onCancelar: () => void;
  onConfirmar: () => void;
}

export default function SalvarMisturaModal({ salvarMisturaAberto, editando, onNomeChange, onCancelar, onConfirmar }: Props) {
  const overlayClass = 'overlay-center' + (salvarMisturaAberto ? '' : ' hidden');
  if (!salvarMisturaAberto) {
    return <div className={overlayClass} />;
  }

  return (
    <div className={overlayClass}>
      <div className="overlay-backdrop" onClick={onCancelar} />
      <div className="modal modal-tight">
        <span className="modal-title">{editando ? 'Editar mistura' : 'Salvar mistura'}</span>
        <label className="modal-field">
          <span>Nome da mistura</span>
          <CommitInput
            placeholder="ex: Ração de engorda"
            value={salvarMisturaAberto.nome}
            onCommit={onNomeChange}
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="btn-confirm" onClick={onConfirmar}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
