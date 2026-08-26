async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const casesService = {
  list(email) {
    return request(`/api/cases?email=${encodeURIComponent(email)}`);
  },
  create(payload) {
    return request('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  update(id, patch) {
    return request(`/api/cases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  },
  remove(id) {
    return request(`/api/cases/${id}`, { method: 'DELETE' });
  },
};
