import { deleteRequest, getRequest, postJson, putJson, withEmail } from './http'

export const listLinks = (email) => getRequest(withEmail('/api/links', email))
export const createLink = (payload) => postJson('/api/links', payload)
export const updateLink = (id, payload) => putJson(`/api/links/${id}`, payload)
export const deleteLink = (id) => deleteRequest(`/api/links/${id}`)
