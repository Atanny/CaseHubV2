import Input from './Input';

/** Labeled form field — uppercase Prompt-bold label above a white rounded input. */
export default function FormField({ label, className = '', ...inputProps }) {
  return (
    <div className={`flex flex-col gap-2.5 items-start w-full ${className}`}>
      <p className="text-[10px] font-label font-bold uppercase text-ch-main">{label}</p>
      <Input {...inputProps} />
    </div>
  );
}
