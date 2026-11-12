// In-app routing configuration. The app is a single Next.js route ("/"); screens
// are switched with a `page` state value that is persisted in localStorage.

// Visible navigation (the icon rail). Items with `group` are section labels.
export const NAV_ITEMS = [
  { group: 'Work' },
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'postlive', label: 'Post-Live Amends', icon: 'checklist' },
  { id: 'history', label: 'Case History', icon: 'briefcase' },
  { id: 'sessions', label: 'Session Logs', icon: 'clock' },
  { id: 'archives', label: 'Archived Cases', icon: 'folderLock' },
  { group: 'Tools' },
  { id: 'announcements', label: 'Updates & Announcements', icon: 'megaphone' },
  { id: 'links', label: 'Quick Links', icon: 'link' },
  { id: 'filenames', label: 'File Name Generator', icon: 'fileSettings' },
  { id: 'profile', label: 'Profile & Settings', icon: 'user' },
]

// Screens that still exist (and can be restored from a saved page value) but are not in the nav:
// both are "coming soon" placeholders and do not appear in the current designs.
export const HIDDEN_PAGE_IDS = ['build', 'prelive']

export const PAGE_IDS = [...NAV_ITEMS.filter((item) => item.id).map((item) => item.id), ...HIDDEN_PAGE_IDS]

export const DEFAULT_PAGE = 'dashboard'

export const isValidPage = (id) => PAGE_IDS.includes(id)
