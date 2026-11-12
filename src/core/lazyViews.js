import dynamic from 'next/dynamic'

// Route-level code splitting. These screens are mounted only while active, so
// their code is fetched on first visit instead of with the initial bundle.
// (DashboardPage is the default screen and PostLivePage / FileNameGeneratorPage are
// always mounted, so those stay in the main bundle.)
const lazyView = (loader, name) => dynamic(() => loader().then((m) => m[name]), { ssr: false })

export const CaseHistoryPage = lazyView(() => import('@/views/History/CaseHistoryPage'), 'CaseHistoryPage')
export const AnnouncementsPage = lazyView(() => import('@/views/Announcements/AnnouncementsPage'), 'AnnouncementsPage')
export const LinksPage = lazyView(() => import('@/views/Links/LinksPage'), 'LinksPage')
export const ProfilePage = lazyView(() => import('@/views/Profile/ProfilePage'), 'ProfilePage')
export const SessionLogPage = lazyView(() => import('@/views/SessionLog/SessionLogPage'), 'SessionLogPage')
export const ArchivePage = lazyView(() => import('@/views/Archive/ArchivePage'), 'ArchivePage')
