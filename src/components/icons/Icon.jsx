const ICONS = {
  dashboard: (c) => (
    <>
      <rect x="1" y="1" width="6" height="6" fill={c} />
      <rect x="9" y="1" width="6" height="6" fill={c} opacity=".5" />
      <rect x="1" y="9" width="6" height="6" fill={c} opacity=".5" />
      <rect x="9" y="9" width="6" height="6" fill={c} opacity=".25" />
    </>
  ),
  postlive: (c) => (
    <>
      <rect x="2" y="2" width="12" height="12" stroke={c} strokeWidth="1.5" />
      <path d="M5 8.5l2.5 2.5L11 6" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  history: (c) => (
    <>
      <circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1.5" />
      <path d="M8 5v3.5l2.5 1.5" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  archive: (c) => (
    <>
      <rect x="1" y="4" width="14" height="2" fill={c} opacity=".7" />
      <rect x="1" y="1" width="14" height="3" stroke={c} strokeWidth="1.5" />
      <rect x="1" y="6" width="14" height="9" stroke={c} strokeWidth="1.5" />
      <path d="M5.5 10.5h5" stroke={c} strokeWidth="1.4" strokeLinecap="square" opacity=".6" />
    </>
  ),
  announce: (c) => (
    <>
      <path d="M3 6h2v5H3V6zM5 6l7-4v13L5 11V6z" fill={c} opacity=".8" />
      <rect x="8" y="12" width="2" height="3" rx="1" fill={c} />
    </>
  ),
  links: (c) => (
    <>
      <path d="M6 9.5a3.5 3.5 0 004.95-4.95L9.54 3.15A3.5 3.5 0 004.6 8.1" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
      <path d="M10 6.5a3.5 3.5 0 00-4.95 4.95l1.41 1.4A3.5 3.5 0 0011.4 7.9" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  draft: (c) => (
    <>
      <rect x="3" y="1" width="10" height="14" stroke={c} strokeWidth="1.5" />
      <path d="M6 5h4M6 8h4M6 11h2" stroke={c} strokeWidth="1.4" strokeLinecap="square" opacity=".7" />
    </>
  ),
  user: (c) => (
    <>
      <circle cx="8" cy="5" r="3" stroke={c} strokeWidth="1.5" />
      <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  coffee: (c) => (
    <>
      <path d="M3 5h8v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke={c} strokeWidth="1.5" />
      <path d="M11 7h1a2 2 0 010 4h-1" stroke={c} strokeWidth="1.5" />
      <path d="M6 2v2M8 1v2" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  meditate: (c) => (
    <>
      <circle cx="8" cy="3" r="2" stroke={c} strokeWidth="1.5" />
      <path d="M4 8c0-2 1.5-3.5 4-3.5S12 6 12 8" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
      <path d="M1 11h14M4 11v3M12 11v3M8 8v3" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  lunch: (c) => (
    <path d="M3 2v12M6 2v5a3 3 0 003 3v4M9 2v4a3 3 0 003-3V2" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
  ),
  clock: (c) => (
    <>
      <circle cx="8" cy="9" r="6" stroke={c} strokeWidth="1.5" />
      <path d="M8 6v3.5l2 2" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  timer: (c) => (
    <>
      <circle cx="8" cy="9" r="6" stroke={c} strokeWidth="1.5" />
      <path d="M8 6v3.5l2 2" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
      <path d="M6 1h4" stroke={c} strokeWidth="2" strokeLinecap="square" />
    </>
  ),
  bell: (c) => (
    <>
      <path d="M8 1v1M8 1a5 5 0 015 5v4l1.5 1.5H1.5L3 11V7a5 5 0 015-5z" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
      <path d="M6 13a2 2 0 004 0" stroke={c} strokeWidth="1.5" />
    </>
  ),
  snooze: (c) => (
    <>
      <circle cx="8" cy="9" r="6" stroke={c} strokeWidth="1.5" />
      <path d="M5.5 7h3L5.5 11H9" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
      <path d="M3 3L2 2M13 3l1-2" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  close: (c) => <path d="M3 3l10 10M13 3L3 13" stroke={c} strokeWidth="1.5" strokeLinecap="square" />,
  check: (c) => <path d="M2 8l4.5 5L14 3" stroke={c} strokeWidth="2" strokeLinecap="square" />,
  back: (c) => <path d="M10 3L5 8l5 5" stroke={c} strokeWidth="1.5" strokeLinecap="square" />,
  loading: (c) => (
    <>
      <circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1.5" opacity=".25" />
      <path d="M8 2a6 6 0 016 6" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  logout: (c) => (
    <>
      <path d="M6 14H2V2h4" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
      <path d="M10 5l4 3-4 3M14 8H6" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  calendar: (c) => (
    <>
      <rect x="2" y="3" width="12" height="11" stroke={c} strokeWidth="1.5" />
      <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  search: (c) => (
    <>
      <circle cx="7" cy="7" r="5" stroke={c} strokeWidth="1.5" />
      <path d="M11 11l3.5 3.5" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  trash: (c) => (
    <path
      d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"
      stroke={c}
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  ),
  edit: (c) => <path d="M10 2l4 4-8 8H2v-4l8-8z" stroke={c} strokeWidth="1.5" strokeLinecap="square" />,
  plus: (c) => <path d="M8 2v12M2 8h12" stroke={c} strokeWidth="1.5" strokeLinecap="square" />,
  eye: (c) => (
    <>
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
      <circle cx="8" cy="8" r="2" stroke={c} strokeWidth="1.5" />
    </>
  ),
  'eye-off': (c) => (
    <>
      <path d="M2 2l12 12" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
      <path d="M1 8s2.5-5 7-5c1.1 0 2.06.27 2.88.66M15 8s-1 2-3 3.4M9.4 9.4a2 2 0 01-2.8-2.8" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  login: (c) => (
    <>
      <path d="M10 14h4V2h-4" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
      <path d="M6 5l-4 3 4 3M2 8h8" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  'check-square': (c) => (
    <>
      <rect x="2" y="2" width="12" height="12" rx="2" stroke={c} strokeWidth="1.5" />
      <path d="M4.5 8l2.3 2.5L11.5 5.5" stroke={c} strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
};

/**
 * Renders a named icon from the shared icon set as an inline SVG.
 * Falls back to an empty viewbox for unknown names so layout never breaks.
 */
export default function Icon({ name, size = 16, color = 'currentColor', className = '', style = {} }) {
  const body = ICONS[name];
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {body ? body(color) : null}
    </svg>
  );
}
