/**
 * Joins conditional class names, filtering out falsy values.
 * Usage: cls('base', isActive && 'active', isDisabled && 'disabled')
 */
export function cls(...args) {
  return args.filter(Boolean).join(' ');
}
