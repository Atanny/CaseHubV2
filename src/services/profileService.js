import { getRequest, postJson, withEmail } from './http'

export const getProfile = (email) => getRequest(withEmail('/api/profile', email))
export const saveProfile = (payload) => postJson('/api/profile', payload)
