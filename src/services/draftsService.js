async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const draftsService = {
  list(email) {
    return request(`/api/drafts?email=${encodeURIComponent(email)}`);
  },
  save({ userEmail, mode, draftData }) {
    return request('/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, mode, draftData }),
    });
  },
  update(id, draftData) {
    return request(`/api/drafts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftData }),
    });
  },
  remove(id) {
    return request(`/api/drafts/${id}`, { method: 'DELETE' });
  },
};
