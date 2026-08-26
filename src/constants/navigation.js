import { ROUTES } from './routes';

/**
 * Sidebar navigation, grouped as "Work" and "Tools" — matches the Figma
 * "Sidebar v2" component and the functional groupings from the legacy app.
 */
export const NAV_GROUPS = [
  {
    label: 'Work',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: ROUTES.dashboard },
      { id: 'postlive', label: 'Post-Live Amends', icon: 'postlive', href: ROUTES.postlive },
      { id: 'history', label: 'Case History', icon: 'history', href: ROUTES.history },
      { id: 'sessions', label: 'Session Logs', icon: 'history', href: ROUTES.sessions },
      { id: 'archives', label: 'Archived Cases', icon: 'archive', href: ROUTES.archives },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'announcements', label: 'Updates & Announcement', icon: 'announce', href: ROUTES.announcements },
      { id: 'links', label: 'Quick Links', icon: 'links', href: ROUTES.links },
      { id: 'filenames', label: 'File Name Generator', icon: 'draft', href: ROUTES.filenames },
      { id: 'profile', label: 'Profile & Settings', icon: 'user', href: ROUTES.profile },
    ],
  },
];

/** Break/timer options shown in the sidebar footer and header quick-actions. */
export const BREAK_OPTIONS = [
  { label: '15 min', icon: 'coffee', mins: 15 },
  { label: '30 min', icon: 'meditate', mins: 30 },
  { label: 'Lunch (1hr)', icon: 'lunch', mins: 60 },
];
