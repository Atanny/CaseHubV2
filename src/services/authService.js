const STORAGE_KEYS = {
  token: 'ch_token',
  refresh: 'ch_refresh',
  user: 'ch_user',
};

async function callAuthApi(action, body) {
  const res = await fetch(`/api/auth/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `${action} failed`);
  return data;
}

function persistSession({ access_token, refresh_token, user }) {
  localStorage.setItem(STORAGE_KEYS.token, access_token);
  localStorage.setItem(STORAGE_KEYS.refresh, refresh_token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export const authService = {
  async signIn({ email, password }) {
    const data = await callAuthApi('signin', { email, password });
    persistSession(data);
    return data.user;
  },

  async signUp({ name, email, password, role }) {
    const data = await callAuthApi('signup', { name, email, password, role });
    if (data.needsConfirmation) return { needsConfirmation: true, message: data.message };
    persistSession(data);
    return { user: data.user };
  },

  async refresh() {
    const refresh_token = localStorage.getItem(STORAGE_KEYS.refresh);
    if (!refresh_token) throw new Error('No refresh token');
    const data = await callAuthApi('refresh', { refresh_token });
    persistSession(data);
    return data.user;
  },

  async updateProfile(fields) {
    const accessToken = localStorage.getItem(STORAGE_KEYS.token);
    await callAuthApi('update', { ...fields, accessToken });
  },

  async changePassword(newPassword) {
    const accessToken = localStorage.getItem(STORAGE_KEYS.token);
    await callAuthApi('password', { newPassword, accessToken });
  },

  signOut() {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.refresh);
    localStorage.removeItem(STORAGE_KEYS.user);
  },

  getStoredUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.user);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(STORAGE_KEYS.token);
  },
};
