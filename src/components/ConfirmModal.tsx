import type { Confirmacao } from '../types';

interface Props {
  confirmacao: Confirmacao | null;
  onCancelar: () => void;
  onOk: () => void;
}

export default function ConfirmModal({ confirmacao, onCancelar, onOk }: Props) {
  const overlayClass = 'overlay-center' + (confirmacao ? '' : ' hidden');
  if (!confirmacao) {
    return <div className={overlayClass} />;
  }

  return (
    <div className={overlayClass}>
      <div className="overlay-backdrop" onClick={onCancelar} />
      <div className="modal">
        <span className="modal-text">{confirmacao.mensagem}</span>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="btn-danger" onClick={onOk}>
            {confirmacao.rotulo || 'Remover'}
          </button>
        </div>
      </div>
    </div>
  );
}
