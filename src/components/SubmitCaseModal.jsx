import { useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { BREAK_OPTIONS } from '../constants/navigation';

/**
 * Three-stage modal matching Figma's submit flow:
 * 1. "Submit Case #<num>?" confirmation
 * 2. "Would you like to take a break?" prompt
 * 3. "Submitting, please wait" spinner
 */
export default function SubmitCaseModal({ open, caseNum, onClose, onConfirm, onStartBreak }) {
  const [stage, setStage] = useState('confirm'); // confirm | break | submitting

  if (!open) return null;

  function handleConfirm() {
    setStage('break');
  }

  async function finish(breakOpt) {
    setStage('submitting');
    if (breakOpt) onStartBreak?.(breakOpt);
    await onConfirm();
  }

  return (
    <Modal open={open} onClose={stage === 'confirm' ? onClose : undefined}>
      {stage === 'confirm' && (
        <>
          <p className="font-heading font-bold text-h6 text-ch-main uppercase">
            Submit Case <span className="text-[#4760FF]">#{caseNum}</span>?
          </p>
          <div className="flex gap-2.5 justify-center mt-5">
            <button onClick={onClose} className="flex items-center gap-2 px-4 h-10 rounded-ch border border-ch-border text-ch-main font-body text-body">
              Cancel
            </button>
            <button onClick={handleConfirm} className="flex items-center gap-2 px-4 h-10 rounded-ch bg-ch-main text-white font-body text-body">
              Yes, Proceed
              <Icon name="archive" size={14} color="#fff" />
            </button>
          </div>
        </>
      )}

      {stage === 'break' && (
        <>
          <p className="font-heading font-bold text-h6 text-ch-main uppercase">Would You Like To Take A Break?</p>
          <div className="flex gap-2 justify-center flex-wrap mt-4">
            {BREAK_OPTIONS.map((opt) => (
              <button key={opt.mins} onClick={() => finish(opt)} className="flex items-center gap-1.5 px-3 h-9 rounded-ch bg-ch-secondary text-ch-main font-body text-body">
                <Icon name={opt.icon} size={14} color="#40513B" />
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={() => finish(null)} className="w-full h-10 rounded-ch border border-ch-red text-ch-red font-body text-body mt-3">
            No Thanks, Skip Break
          </button>
        </>
      )}

      {stage === 'submitting' && (
        <>
          <div className="flex justify-center mb-2">
            <Icon name="loading" size={28} color="#40513B" />
          </div>
          <p className="font-heading font-bold text-h6 text-ch-main uppercase">Submitting, Please Wait</p>
          <p className="font-body text-body text-ch-main opacity-60 mt-1">Don&apos;t close this tab while your case is being saved.</p>
        </>
      )}
    </Modal>
  );
}
