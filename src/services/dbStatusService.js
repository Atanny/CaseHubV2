// Health probe used by the sidebar DB indicator.
export const checkDbStatus = () =>
  fetch('/api/db-status', { method: 'GET', signal: AbortSignal.timeout(5000) })
