import { cls } from '../../utils/cls';

/** Text input matching the Figma "Field" component (white, rounded, bordered). */
export default function Input({ className = '', ...rest }) {
  return (
    <input
      className={cls(
        'w-full h-[55px] px-6 py-4 bg-white border border-ch-border rounded-ch-lg',
        'font-body text-body text-ch-main placeholder:text-ch-main placeholder:opacity-50',
        'outline-none focus:border-ch-main transition-colors',
        className
      )}
      {...rest}
    />
  );
}
