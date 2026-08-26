async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const sessionsService = {
  list({ email, date }) {
    const q = date ? `?email=${encodeURIComponent(email)}&date=${date}` : `?email=${encodeURIComponent(email)}`;
    return request(`/api/sessions${q}`);
  },
  remove(id) {
    return request(`/api/sessions?id=${id}`, { method: 'DELETE' });
  },
};
