import Icon from './Icon';
import { cls } from '../utils/cls';

export const WIZARD_STEPS = [
  ['caseInfo', 'Case Info'],
  ['beforeBackup', 'Before SS/Additional Backup'],
  ['notepad', 'Notepad/Assumption'],
  ['afterBackup', 'After SS/B&A Backup'],
  ['finalChecklist', 'Final Checklist'],
];

/** 5-tab step progress bar. A step is "done" (green check) once its index is behind the active one. */
export default function WizardStepBar({ activeIndex, onStepClick }) {
  return (
    <div className="flex items-stretch w-full bg-white rounded-ch shadow-ch overflow-hidden">
      {WIZARD_STEPS.map(([key, label], i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <button
            key={key}
            onClick={() => onStepClick?.(i)}
            disabled={i > activeIndex}
            className={cls(
              'flex-1 flex flex-col items-center gap-1.5 py-3 border-r border-ch-secondary last:border-r-0 transition-colors',
              done && 'bg-green-50',
              active && 'bg-white border border-ch-main -m-px z-10'
            )}
          >
            {done ? <Icon name="check-square" size={18} color="#1a7d3a" /> : <Icon name="radio-unchecked" size={18} color={active ? '#40513B' : '#40513B80'} />}
            <span className={cls('text-badge font-label font-bold uppercase', active ? 'text-ch-main' : 'text-ch-main opacity-50')}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
