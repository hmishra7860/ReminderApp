const API_BASE = window.location.port === '3000'
  ? 'http://localhost:8000'
  : '/api';

// ─── Token Interceptor ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('rcal_token');
  
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cfg = { ...options, headers: { ...headers, ...(options.headers || {}) } };
  
  if (cfg.body && typeof cfg.body === 'object') {
    // Check if the body is a URLSearchParams object (needed for OAuth2 form login)
    if (cfg.body instanceof URLSearchParams) {
      cfg.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      cfg.headers['Content-Type'] = 'application/json';
      cfg.body = JSON.stringify(cfg.body);
    }
  }

  try {
    const res = await fetch(url, cfg);
    
    // Automatically log user out if token is expired/invalid
    if (res.status === 401) {
      Auth.logout();
      throw new Error("Session expired. Please log in again.");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    
    if (res.status === 204) return null;
    return res.json();
  } catch (e) {
    throw e; // Throw to the calling function to handle UI errors
  }
}

// ─── Authentication API ───────────────────────────────────────────────────────
const AuthAPI = {
  login: (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    return apiFetch('/auth/login', { method: 'POST', body: params });
  },
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: data }),
  getProfile: () => apiFetch('/auth/profile')
};

// ─── Reminder & Birthday CRUD (Updated to throw errors) ─────────────────────
const ReminderAPI = {
  getAll: () => apiFetch('/reminders'),
  get: (id) => apiFetch(`/reminders/${id}`),
  create: (data) => apiFetch('/reminders', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/reminders/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/reminders/${id}`, { method: 'DELETE' }),
};

const BirthdayAPI = {
  getAll: () => apiFetch('/birthdays'),
  create: (data) => apiFetch('/birthdays', { method: 'POST', body: data }),
  delete: (id) => apiFetch(`/birthdays/${id}`, { method: 'DELETE' }),
};

// Note: LocalDB fallback remains unchanged, but production code should rely on the API.