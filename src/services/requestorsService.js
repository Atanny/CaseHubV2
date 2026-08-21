async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const requestorsService = {
  list() {
    return request('/api/requestors');
  },
  create(name) {
    return request('/api/requestors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  },
  remove(name) {
    return request(`/api/requestors/${encodeURIComponent(name)}`, { method: 'DELETE' });
  },
};
