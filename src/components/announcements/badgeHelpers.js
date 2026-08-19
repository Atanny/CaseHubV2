export const BADGE_OPTIONS = [
  ['info', 'Info'],
  ['update', 'Update'],
  ['urgent', 'Urgent'],
];

export const FILTER_OPTIONS = [
  ['all', 'All'],
  ['update', 'Updates'],
  ['info', 'Announcements'],
];

/** Background color for the badge chip on a feed card. */
export function badgeColor(badge) {
  if (badge === 'urgent') return '#C54446';
  if (badge === 'update') return '#40513B';
  return '#4760FF';
}

/** Human-readable label for a badge value. */
export function badgeLabel(badge) {
  if (badge === 'urgent') return 'Urgent';
  if (badge === 'update') return 'Update';
  return 'Announcement';
}

/** Up to 2-letter initials from a display name. */
export function initialsOf(name) {
  return (name || '?')
    .split(' ')
    .map((w) => w && w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
