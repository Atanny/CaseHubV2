// Outline icon set used by the redesigned shell and screens (24x24 grid, rounded strokes).
// Usage: <LineIcon name="clock" size={20} />  — color follows `currentColor`.
const P = {
  speedometer: <><path d="M3.6 17.5a9.2 9.2 0 1 1 16.8 0" /><path d="M12 15.2l4.6-5.6" /><circle cx="12" cy="15.4" r="1.4" fill="currentColor" stroke="none" /></>,
  grid: <><circle cx="7" cy="7" r="2.7" /><circle cx="17" cy="7" r="2.7" /><circle cx="7" cy="17" r="2.7" /><circle cx="17" cy="17" r="2.7" /></>,
  checklist: <><rect x="4" y="3.5" width="16" height="17" rx="2.5" /><path d="M8 9.5l1.7 1.7 3-3.2" /><path d="M8 16h8" /></>,
  briefcase: <><rect x="3" y="8" width="18" height="12" rx="2.2" /><path d="M9 8V6.2A1.7 1.7 0 0 1 10.7 4.5h2.6A1.7 1.7 0 0 1 15 6.2V8" /><path d="M3 13.2h18" /><rect x="10.4" y="11.6" width="3.2" height="3.2" rx=".6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.2 1.9" /></>,
  folderLock: <><path d="M3 7.2A2.2 2.2 0 0 1 5.2 5H9l2 2.2h7.8A2.2 2.2 0 0 1 21 9.4v8.4A2.2 2.2 0 0 1 18.8 20H5.2A2.2 2.2 0 0 1 3 17.8z" /><rect x="9" y="12.2" width="6" height="4.6" rx="1" /><path d="M10.2 12.2v-1a1.8 1.8 0 0 1 3.6 0v1" /></>,
  megaphone: <><path d="M4 10v4h3l5.2 3.8V6.2L7 10z" /><path d="M15.4 9.2a4 4 0 0 1 0 5.6" /><path d="M18 6.6a7.6 7.6 0 0 1 0 10.8" /></>,
  link: <><path d="M10.2 13.8a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-.9.9" /><path d="M13.8 10.2a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l.9-.9" /></>,
  fileSettings: <><path d="M12 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v3" /><path d="M14 3v5h5" /><circle cx="17" cy="17" r="2.1" /><path d="M17 13.6v.8M17 19.6v.8M13.6 17h.8M19.6 17h.8" /></>,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" /></>,
  listDoc: <><rect x="4" y="3.5" width="16" height="17" rx="2.5" /><path d="M8 9h8M8 12.5h8M8 16h5" /></>,
  folderOpen: <><path d="M3 8V6.2A2.2 2.2 0 0 1 5.2 4H9l2 2.2h6.8A2.2 2.2 0 0 1 20 8.4V10" /><path d="M3.2 10.5h17.6a.9.9 0 0 1 .9 1.1l-1.7 7a1.6 1.6 0 0 1-1.6 1.2H5.6A1.6 1.6 0 0 1 4 18.6z" /></>,
  logout: <><path d="M10 4H6.2A2.2 2.2 0 0 0 4 6.2v11.6A2.2 2.2 0 0 0 6.2 20H10" /><path d="M16 8l4 4-4 4" /><path d="M20 12H9" /></>,
  coffee: <><path d="M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" /><path d="M16 11h1.4a2.6 2.6 0 0 1 0 5.2H16" /><path d="M8.2 3.5v2.2M11.6 3.5v2.2" /></>,
  burger: <><path d="M3.6 11.2a8.4 6 0 0 1 16.8 0z" /><path d="M3 14.4h18" /><path d="M5 17.8h14a1.6 1.6 0 0 1-1.6 2.2H6.6A1.6 1.6 0 0 1 5 17.8z" /></>,
  umbrella: <><path d="M12 3.5a9 9 0 0 1 9 8.2H3a9 9 0 0 1 9-8.2z" /><path d="M12 11.7V19a2 2 0 0 1-4 0" /><path d="M7 11.7c.5-1.8 1.6-4.5 5-6.8M17 11.7c-.5-1.8-1.6-4.5-5-6.8" /></>,
  meeting: <><rect x="3" y="4" width="18" height="12" rx="1.6" /><path d="M8 20l4-4 4 4" /><path d="M8 12.5v-2M12 12.5V8.5M16 12.5v-3.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.4" /><path d="M3.5 10h17M8 3v4M16 3v4" /><rect x="12.5" y="13" width="4" height="3.4" rx=".6" /></>,
  search: <><circle cx="11" cy="11" r="6.6" /><path d="M16 16l4.2 4.2" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  plusCircle: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  closeCircle: <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  edit: <><path d="M4 20h4l11-11a2.4 2.4 0 0 0-3.4-3.4L4.6 16.6z" /><path d="M13.5 7.7l2.8 2.8" /></>,
  editBox: <><path d="M11 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V13" /><path d="M9 15l.7-3.4 8.2-8.2a2 2 0 0 1 2.8 2.8l-8.2 8.2z" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12.2A2 2 0 0 0 9 21h6a2 2 0 0 0 2-1.8L18 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" /></>,
  chevronDown: <><path d="M6 9.5l6 6 6-6" /></>,
  chevronUp: <><path d="M6 14.5l6-6 6 6" /></>,
  chevronRight: <><path d="M9.5 6l6 6-6 6" /></>,
  heart: <><path d="M12 20.2S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6C20.5 15 12 20.2 12 20.2z" /></>,
  bookmark: <><path d="M6.5 4h11v16.5L12 16.6l-5.5 3.9z" /></>,
  more: <><circle cx="5.5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18.5" cy="12" r="1.2" fill="currentColor" /></>,
  upload: <><path d="M7.5 17.5A4.5 4.5 0 0 1 7 8.6a5.5 5.5 0 0 1 10.6 1.1 3.9 3.9 0 0 1-.1 7.8" /><path d="M12 20v-8M9 14.5l3-3 3 3" /></>,
  download: <><path d="M12 4v11M7.5 10.8l4.5 4.7 4.5-4.7" /><path d="M5 19.5h14" /></>,
  save: <><path d="M5 4h11l3 3v11.5A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5z" /><path d="M8 4v4.5h6V4M8 20v-6h8v6" /></>,
  clockSmall: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.2" /><circle cx="9" cy="10" r="1.7" /><path d="M4.5 18l5-5 3.5 3.5 2.5-2.5 4 4" /></>,
  book: <><path d="M5 4.5h11a2 2 0 0 1 2 2V19H7a2 2 0 0 1-2-2z" /><path d="M5 17a2 2 0 0 1 2-2h11" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.6 8.4l-2 5.2-5.2 2 2-5.2z" /></>,
  award: <><circle cx="12" cy="9" r="5" /><path d="M9 13.3L7.6 20 12 17.8l4.4 2.2L15 13.3" /></>,
  at: <><circle cx="12" cy="12" r="3.4" /><path d="M15.4 12v1.4a2.2 2.2 0 0 0 4.4 0V12a7.8 7.8 0 1 0-3 6.1" /></>,
  warning: <><path d="M12 4l9.2 16H2.8z" /><path d="M12 10v4.5M12 17.6v.1" /></>,
  bold: <><path d="M7 5h6a3.2 3.2 0 0 1 0 6.4H7zM7 11.4h6.8a3.3 3.3 0 0 1 0 6.6H7z" /></>,
  italic: <><path d="M10 5h7M7 19h7M14.5 5l-5 14" /></>,
  underline: <><path d="M7 4.5v6.5a5 5 0 0 0 10 0V4.5M5 20h14" /></>,
  listBullets: <><path d="M9 7h11M9 12h11M9 17h11" /><circle cx="4.8" cy="7" r="1" fill="currentColor" /><circle cx="4.8" cy="12" r="1" fill="currentColor" /><circle cx="4.8" cy="17" r="1" fill="currentColor" /></>,
  listNumbers: <><path d="M10 7h10M10 12h10M10 17h10" /><path d="M4.5 5.6L6 5v4M4.4 14.6c.4-.8 2-.9 2 .2 0 .9-1.6 1.2-2 2.2h2.3" /></>,
}

export function LineIcon({ name, size = 20, strokeWidth = 1.7, className, style, title }) {
  const body = P[name]
  if (!body) return null
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0, display: 'inline-block', ...style }}
      aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {body}
    </svg>
  )
}

export const LINE_ICON_NAMES = Object.keys(P)
