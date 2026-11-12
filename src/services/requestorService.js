import { deleteRequest, getRequest, postJson } from './http'

export const listRequestors = () => getRequest('/api/requestors')
export const createRequestor = (payload) => postJson('/api/requestors', payload)
export const deleteRequestor = (name) => deleteRequest(`/api/requestors/${encodeURIComponent(name)}`)
