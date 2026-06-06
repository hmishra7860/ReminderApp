// ─── API Client ───────────────────────────────────────────────────────────────
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : '/api';

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const defaults = {
    headers: { 'Content-Type': 'application/json' },
  };
  const cfg = { ...defaults, ...options };
  if (cfg.body && typeof cfg.body === 'object') {
    cfg.body = JSON.stringify(cfg.body);
  }

  try {
    const res = await fetch(url, cfg);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (e) {
    // Fallback to localStorage when backend is not available
    console.warn(`API ${path} failed, using local storage:`, e.message);
    return null;
  }
}

// ─── Reminder CRUD ────────────────────────────────────────────────────────────
const ReminderAPI = {
  getAll: () => apiFetch('/reminders'),
  get: (id) => apiFetch(`/reminders/${id}`),
  create: (data) => apiFetch('/reminders', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/reminders/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/reminders/${id}`, { method: 'DELETE' }),
};

// ─── Birthday CRUD ────────────────────────────────────────────────────────────
const BirthdayAPI = {
  getAll: () => apiFetch('/birthdays'),
  create: (data) => apiFetch('/birthdays', { method: 'POST', body: data }),
  delete: (id) => apiFetch(`/birthdays/${id}`, { method: 'DELETE' }),
};

// ─── Local Storage Fallback ───────────────────────────────────────────────────
const LocalDB = {
  _key: 'rcal_reminders',
  _bkey: 'rcal_birthdays',

  getReminders() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); }
    catch { return []; }
  },
  saveReminders(list) {
    localStorage.setItem(this._key, JSON.stringify(list));
  },
  addReminder(data) {
    const list = this.getReminders();
    const item = { ...data, id: Date.now(), created_at: new Date().toISOString() };
    list.push(item);
    this.saveReminders(list);
    return item;
  },
  updateReminder(id, data) {
    const list = this.getReminders().map(r => r.id === id ? { ...r, ...data } : r);
    this.saveReminders(list);
  },
  deleteReminder(id) {
    this.saveReminders(this.getReminders().filter(r => r.id !== id));
  },

  getBirthdays() {
    try { return JSON.parse(localStorage.getItem(this._bkey) || '[]'); }
    catch { return []; }
  },
  saveBirthdays(list) {
    localStorage.setItem(this._bkey, JSON.stringify(list));
  },
  addBirthday(data) {
    const list = this.getBirthdays();
    const item = { ...data, id: Date.now(), created_at: new Date().toISOString() };
    list.push(item);
    this.saveBirthdays(list);
    return item;
  },
  deleteBirthday(id) {
    this.saveBirthdays(this.getBirthdays().filter(b => b.id !== id));
  },
};
