import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '../hooks/useSession';
import { ROUTES } from '../constants/routes';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? ROUTES.dashboard : ROUTES.login);
  }, [loading, user, router]);

  return null;
}
