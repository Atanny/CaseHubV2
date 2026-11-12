import { createContext, useContext } from 'react'

// App-level session controls (breaks, meetings, log out) shared with every page header,
// so the header buttons drive the same confirmation flows the app root renders.
export const ShellContext = createContext(null)

export function useShell() {
  const value = useContext(ShellContext)
  if (!value) throw new Error('useShell must be used inside <ShellContext.Provider>')
  return value
}
