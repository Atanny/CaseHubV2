import { postJson } from './http'

export const signIn = (credentials) => postJson('/api/auth/signin', credentials)
export const signUp = (payload) => postJson('/api/auth/signup', payload)
export const requestPasswordReset = (payload) => postJson('/api/auth/reset', payload)
export const refreshSession = (payload) => postJson('/api/auth/refresh', payload)
export const changePassword = (payload) => postJson('/api/auth/password', payload)
