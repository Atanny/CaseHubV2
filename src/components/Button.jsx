import { cls } from '../utils/cls';

const VARIANTS = {
  primary: 'bg-ch-main border border-ch-main text-white',
  danger: 'bg-ch-red border border-ch-red text-white',
  secondary: 'bg-white border border-ch-main text-ch-main',
  outline: 'bg-white border border-ch-border text-ch-main',
  ghost: 'bg-transparent border border-transparent text-ch-main',
};

/**
 * Shared button component, matched to the Figma button styles: bold
 * uppercase label, moderately rounded corners (not a full pill), subtle
 * drop shadow, icon docked to one side. Pass `uppercase={false}` for the
 * few buttons Figma shows in sentence case (e.g. "Log Out").
 */
export default function Button({
  variant = 'secondary',
  icon,
  iconPosition = 'right',
  size = 'md',
  uppercase = true,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const padding = size === 'sm' ? 'px-4 py-2 text-[11px]' : 'px-5 py-3 text-[12px]';
  return (
    <button
      className={cls(
        'inline-flex items-center justify-center gap-2 rounded-ch-lg font-body font-bold shadow-ch transition-opacity whitespace-nowrap',
        uppercase && 'uppercase tracking-wide',
        padding,
        VARIANTS[variant],
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90',
        className
      )}
      disabled={disabled}
      {...rest}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </button>
  );
}

