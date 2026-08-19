import { cls } from '../../utils/cls';

const VARIANTS = {
  primary: 'bg-ch-main border border-ch-main text-white',
  danger: 'bg-ch-red border border-ch-red text-white',
  secondary: 'bg-white border border-ch-main text-ch-main',
  outline: 'bg-white border border-ch-border text-ch-main',
  ghost: 'bg-transparent border border-transparent text-ch-main',
};

/**
 * Shared button component. Matches the "Primary/Secondary Button" and
 * "Break Button" components from the Figma design system.
 */
export default function Button({
  variant = 'secondary',
  icon,
  iconPosition = 'right',
  size = 'md',
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const padding = size === 'sm' ? 'px-4 py-2' : 'px-5 py-2.5';
  return (
    <button
      className={cls(
        'inline-flex items-center justify-center gap-2 rounded-ch font-body text-body shadow-ch transition-opacity',
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
