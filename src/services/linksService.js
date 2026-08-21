async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const linksService = {
  list(email) {
    return request(`/api/links?email=${encodeURIComponent(email)}`);
  },
  create({ title, url, icon, userEmail }) {
    return request('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url, icon, userEmail }),
    });
  },
  update(id, { title, url, icon }) {
    return request(`/api/links/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url, icon }),
    });
  },
  remove(id) {
    return request(`/api/links/${id}`, { method: 'DELETE' });
  },
};
