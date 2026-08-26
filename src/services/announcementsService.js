async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const announcementsService = {
  list() {
    return request('/api/announcements');
  },
  create({ title, body, badge, author }) {
    return request('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, badge, author }),
    });
  },
  update(id, { title, body, badge }) {
    return request(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, badge }),
    });
  },
  remove(id) {
    return request(`/api/announcements/${id}`, { method: 'DELETE' });
  },
};
