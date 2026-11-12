import { deleteRequest, getRequest, postJson } from './http'

// POST actions: time_in | time_out | log_case | close_case | save_log | start_break | end_break
export const postSessionAction = (payload) => postJson('/api/sessions', payload)

export const listSessions = (query = '') => getRequest(`/api/sessions${query}`)
export const getSessionLog = (sessionId) =>
  getRequest(`/api/sessions?action=get_log&session_id=${sessionId}`)
export const deleteSession = (id) => deleteRequest(`/api/sessions?id=${id}`)
