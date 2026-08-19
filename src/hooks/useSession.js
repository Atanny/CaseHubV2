import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

/**
 * Reads the persisted session on mount. `loading` is true only for the
 * brief window before we've checked localStorage, so pages can avoid a
 * flash of the wrong UI.
 */
export function useSession() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(authService.getStoredUser());
    setLoading(false);
  }, []);

  function signOut() {
    authService.signOut();
    setUser(null);
  }

  return { user, loading, signOut, setUser };
}
