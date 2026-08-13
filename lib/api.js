// All frontend API calls go through our own Next.js API routes
// This keeps Supabase service key 100% server-side

async function req(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

// ── CASES ──────────────────────────────────────────────────────────────────
export const getCases = (email) =>
  req(`/api/cases?email=${encodeURIComponent(email)}`)

export const createCase = (caseData) =>
  req('/api/cases', { method: 'POST', body: JSON.stringify(caseData) })

export const updateCase = (id, caseData) =>
  req(`/api/cases/${id}`, { method: 'PUT', body: JSON.stringify(caseData) })

export const deleteCase = (id) =>
  req(`/api/cases/${id}`, { method: 'DELETE' })

// ── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
export const getAnnouncements = () =>
  req('/api/announcements')

export const createAnnouncement = (data) =>
  req('/api/announcements', { method: 'POST', body: JSON.stringify(data) })

export const deleteAnnouncement = (id) =>
  req(`/api/announcements/${id}`, { method: 'DELETE' })

// ── LINKS ──────────────────────────────────────────────────────────────────
export const getLinks = (email) =>
  req(`/api/links?email=${encodeURIComponent(email)}`)

export const createLink = (data) =>
  req('/api/links', { method: 'POST', body: JSON.stringify(data) })

export const deleteLink = (id) =>
  req(`/api/links/${id}`, { method: 'DELETE' })

// ── REQUESTORS ─────────────────────────────────────────────────────────────
export const getRequestors = () =>
  req('/api/requestors')

export const createRequestor = (name) =>
  req('/api/requestors', { method: 'POST', body: JSON.stringify({ name }) })

export const deleteRequestor = (name) =>
  req(`/api/requestors/${encodeURIComponent(name)}`, { method: 'DELETE' })

// ── IMAGES ─────────────────────────────────────────────────────────────────
export const uploadImage = async (file, fileName) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', fileName)
  const res = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data
}

export const deleteImage = (path) =>
  req('/api/images/delete', { method: 'POST', body: JSON.stringify({ path }) })