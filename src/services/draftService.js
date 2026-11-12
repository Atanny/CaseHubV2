import { deleteRequest, getRequest, postJson, putJson, withEmail } from './http'

export const listDrafts = (email) => getRequest(withEmail('/api/drafts', email))
export const createDraft = (payload) => postJson('/api/drafts', payload)
export const updateDraft = (id, payload) => putJson(`/api/drafts/${id}`, payload)
export const deleteDraft = (id) => deleteRequest(`/api/drafts/${id}`)

export const listArchivedDrafts = (email) => getRequest(withEmail('/api/archived-drafts', email))
export const archiveDraft = (payload) => postJson('/api/archived-drafts', payload)
export const deleteArchivedDraft = (id) => deleteRequest(`/api/archived-drafts/${id}`)
