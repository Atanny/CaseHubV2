import { cls } from '../../utils/cls';

const DEVICES = [
  ['mobile', 'Mobile'],
  ['tablet', 'Tablet'],
  ['desktop', 'Desktop'],
];

export default function DeviceChecklist({ devices, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {DEVICES.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange({ ...devices, [key]: !devices[key] })}
          className={cls(
            'px-3.5 py-2 rounded-full border font-body text-body transition-colors',
            devices[key] ? 'bg-ch-main border-ch-main text-white' : 'bg-white border-ch-border text-ch-main'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
