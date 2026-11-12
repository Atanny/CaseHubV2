// Guarded localStorage access. The app is client-only, but several code paths
// run during initial state computation, so every call keeps the window guard.
const hasWindow = () => typeof window !== 'undefined'

export const storage = {
  get: (key) => (hasWindow() ? localStorage.getItem(key) : null),
  set: (key, value) => { if (hasWindow()) localStorage.setItem(key, value) },
  remove: (key) => { if (hasWindow()) localStorage.removeItem(key) },
}
