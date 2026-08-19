import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import RequireAuth from './RequireAuth';
import { useSession } from '../../hooks/useSession';
import { ROUTES } from '../../constants/routes';

/**
 * AppLayout — the authenticated app shell: sidebar + scrollable main content
 * area. Matches the Figma "Desktop" frame (Sidebar v2 + Body).
 *
 * Wraps children in RequireAuth, so any page using AppLayout is
 * automatically protected and redirects to /login when there's no session.
 *
 * Break-timer state and cross-cutting overlays (alarms, break bar, modals)
 * plug in here in a later milestone — kept out for now so this component
 * stays a simple, testable shell.
 */
export default function AppLayout({ children, counts, customLinks }) {
  const router = useRouter();
  const { signOut } = useSession();

  function handleLogout() {
    signOut();
    router.push(ROUTES.login);
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-ch-background">
        <Sidebar counts={counts} customLinks={customLinks} onLogout={handleLogout} />
        <main className="flex-1 flex flex-col gap-2.5 items-start p-5 rounded-ch min-w-0">
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
