import { deleteRequest, getRequest, postJson, putJson } from './http'

export const listAnnouncements = () => getRequest('/api/announcements')
export const createAnnouncement = (payload) => postJson('/api/announcements', payload)
export const updateAnnouncement = (id, payload) => putJson(`/api/announcements/${id}`, payload)
export const deleteAnnouncement = (id) => deleteRequest(`/api/announcements/${id}`)
