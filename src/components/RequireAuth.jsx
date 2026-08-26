import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '../hooks/useSession';
import { ROUTES } from '../constants/routes';

/**
 * Wraps authenticated pages. Renders nothing (and redirects to /login)
 * until a session is confirmed, so protected content never flashes for a
 * logged-out visitor.
 */
export default function RequireAuth({ children }) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.login);
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  return children;
}
