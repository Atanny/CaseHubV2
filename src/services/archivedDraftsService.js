async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const archivedDraftsService = {
  list(email) {
    return request(`/api/archived-drafts?email=${encodeURIComponent(email)}`);
  },
  remove(id) {
    return request(`/api/archived-drafts/${id}`, { method: 'DELETE' });
  },
};
