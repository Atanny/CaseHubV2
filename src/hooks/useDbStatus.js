import { checkDbStatus } from '@/services/dbStatusService'
import { useCallback, useEffect, useState } from 'react'

// ── DB Connection Status Hook ──
export function useDbStatus() {
  const [status, setStatus] = useState("connecting"); // connecting | connected | error
  const [lastSaved, setLastSaved] = useState(null);
  const [latency, setLatency] = useState(null);

  const check = useCallback(async () => {
    const t0 = Date.now();
    try {
      const res = await checkDbStatus();
      const ms = Date.now() - t0;
      if (res.ok) {
        setStatus("connected");
        setLatency(ms);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
      setLatency(null);
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 15000); // re-check every 15s
    return () => clearInterval(interval);
  }, [check]);

  // expose a "markSaved" so operations can update lastSaved time
  const markSaved = useCallback(() => setLastSaved(new Date()), []);

  return { status, latency, lastSaved, markSaved, recheck: check };
}
