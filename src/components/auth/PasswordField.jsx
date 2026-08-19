import { useState } from 'react';
import Icon from '../icons/Icon';

/** Password field with a show/hide toggle, matching the Figma "eyes" affordance. */
export default function PasswordField({ label, value, onChange, onKeyDown, placeholder, disabled }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-2.5 items-start w-full">
      <p className="text-[10px] font-label font-bold uppercase text-ch-main">{label}</p>
      <div className="flex items-center justify-between w-full h-[55px] px-6 py-4 bg-white border border-ch-border rounded-ch-lg focus-within:border-ch-main transition-colors">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 outline-none font-body text-body text-ch-main placeholder:text-ch-main placeholder:opacity-50"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="shrink-0 ml-2"
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={18} color="#40513B" />
        </button>
      </div>
    </div>
  );
}
