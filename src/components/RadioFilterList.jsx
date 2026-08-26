import Icon from './Icon';

/** Radio-style filter list: "checked"/"unchecked" circle icon + label, matching Figma's Radio List. */
export default function RadioFilterList({ options, value, onChange }) {
  return (
    <div className="flex items-center gap-6 flex-wrap">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className="flex items-center gap-2.5 h-[35px]">
          <Icon name={value === v ? 'radio-checked' : 'radio-unchecked'} size={21} color="#40513B" />
          <span className="font-body text-body text-ch-main">{label}</span>
        </button>
      ))}
    </div>
  );
}
