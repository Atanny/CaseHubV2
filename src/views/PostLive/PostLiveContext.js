import { createContext, useContext } from 'react'

// Shared state and actions of the post-live screen. PostLivePage owns the state and provides it;
// large child views read what they need with usePostLive() instead of receiving dozens of props.
export const PostLiveContext = createContext(null)

export function usePostLive() {
  const value = useContext(PostLiveContext)
  if (!value) throw new Error('usePostLive must be used inside <PostLiveContext.Provider>')
  return value
}
