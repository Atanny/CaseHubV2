import { cls } from '../utils/cls';
import Icon from './Icon';

/** Simple checkbox matching the Figma Material-checkbox styling (green fill when checked). */
export default function Checkbox({ checked, onChange, label, className = '' }) {
  return (
    <label className={cls('flex items-center gap-2.5 cursor-pointer select-none', className)}>
      <span
        className={cls(
          'flex items-center justify-center w-5 h-5 rounded-[4px] border shrink-0',
          checked ? 'bg-ch-main border-ch-main' : 'bg-white border-ch-border'
        )}
      >
        {checked && <Icon name="check" size={12} color="#fff" />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {label && <span className="font-body text-body text-ch-main capitalize">{label}</span>}
    </label>
  );
}
