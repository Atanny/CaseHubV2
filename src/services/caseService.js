import { deleteRequest, getRequest, postJson, putJson, withEmail } from './http'

export const listCases = (email) => getRequest(withEmail('/api/cases', email))
export const createCase = (payload) => postJson('/api/cases', payload)
export const updateCase = (id, payload) => putJson(`/api/cases/${id}`, payload)
export const deleteCase = (id) => deleteRequest(`/api/cases/${id}`)
