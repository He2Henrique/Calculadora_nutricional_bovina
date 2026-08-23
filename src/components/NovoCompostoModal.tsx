import type { NovoComposto } from '../types';
import CommitInput from './CommitInput';

interface Props {
  novoComposto: NovoComposto | null;
  onNomeChange: (nome: string) => void;
  onUnidadeChange: (unidade: string) => void;
  onCancelar: () => void;
  onConfirmar: () => void;
}

export default function NovoCompostoModal({
  novoComposto,
  onNomeChange,
  onUnidadeChange,
  onCancelar,
  onConfirmar
}: Props) {
  const overlayClass = 'overlay-center' + (novoComposto ? '' : ' hidden');
  if (!novoComposto) {
    return <div className={overlayClass} />;
  }

  return (
    <div className={overlayClass}>
      <div className="overlay-backdrop" onClick={onCancelar} />
      <div className="modal modal-tight">
        <span className="modal-title">Novo composto</span>
        <label className="modal-field">
          <span>Nome</span>
          <CommitInput placeholder="ex: Vitamina A" value={novoComposto.nome} onCommit={onNomeChange} />
        </label>
        <label className="modal-field">
          <span>Unidade</span>
          <select value={novoComposto.unidade} onChange={(e) => onUnidadeChange(e.target.value)}>
            <option value="%">%</option>
            <option value="g">g</option>
            <option value="mg">mg</option>
          </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="btn-confirm" onClick={onConfirmar}>
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
