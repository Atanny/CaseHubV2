import Modal from './Modal';
import Icon from './Icon';

export default function CancelFormModal({ open, onClose, onConfirmCancel, onMinimize }) {
  return (
    <Modal open={open} onClose={onClose}>
      <p className="font-heading font-bold text-h6 text-ch-main uppercase">Would You Like To Cancel Case Form?</p>
      <p className="font-body text-body text-ch-main opacity-70 mt-1.5">The Inserted Data Wont Be Retrieve Once Canceled.</p>
      <div className="flex gap-2.5 justify-center mt-5">
        <button onClick={onConfirmCancel} className="flex items-center gap-2 px-4 h-10 rounded-ch border border-ch-red text-ch-red font-body text-body">
          Yes, Cancel Form
          <Icon name="archive" size={14} color="#C54446" />
        </button>
        <button onClick={onClose} className="flex items-center gap-2 px-4 h-10 rounded-ch bg-ch-main text-white font-body text-body">
          No, Return to Form
          <Icon name="archive" size={14} color="#fff" />
        </button>
      </div>
      {onMinimize && (
        <button onClick={onMinimize} className="font-body text-body text-ch-main opacity-60 underline mt-3">
          Minimize Form Instead
        </button>
      )}
    </Modal>
  );
}
