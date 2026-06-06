// ─── Navigation ───────────────────────────────────────────────────────────────
const pages = { dashboard: 'page-dashboard', reminders: 'page-reminders', birthdays: 'page-birthdays', settings: 'page-settings' };

document.querySelectorAll('.menu li').forEach(li => {
  li.addEventListener('click', () => {
    document.querySelectorAll('.menu li').forEach(x => x.classList.remove('active'));
    li.classList.add('active');
    const page = li.dataset.page;
    Object.values(pages).forEach(id => document.getElementById(id)?.classList.remove('active'));
    document.getElementById(pages[page])?.classList.add('active');
    if (page === 'reminders') applyFilters();
    if (page === 'birthdays') renderBirthdayGrid();
  });
});

// ─── Modal Helpers ────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// Reminder modal open buttons
document.getElementById('openReminderModal').addEventListener('click', () => {
  document.getElementById('reminderModalTitle').textContent = 'New Reminder';
  document.getElementById('reminderId').value = '';
  document.getElementById('rTitle').value = '';
  document.getElementById('rDesc').value = '';
  document.getElementById('rCategory').value = 'Work';
  document.getElementById('rDate').value = '';
  document.getElementById('rTime').value = '';
  openModal('reminderModal');
});

document.getElementById('openReminderModal2')?.addEventListener('click', () => {
  document.getElementById('reminderModalTitle').textContent = 'New Reminder';
  document.getElementById('reminderId').value = '';
  document.getElementById('rTitle').value = '';
  document.getElementById('rDesc').value = '';
  document.getElementById('rCategory').value = 'Work';
  document.getElementById('rDate').value = '';
  document.getElementById('rTime').value = '';
  openModal('reminderModal');
});

// Close buttons
document.getElementById('closeReminderModal').addEventListener('click', () => closeModal('reminderModal'));
document.getElementById('cancelReminderModal').addEventListener('click', () => closeModal('reminderModal'));
document.getElementById('closeBirthdayModal').addEventListener('click', () => closeModal('birthdayModal'));
document.getElementById('cancelBirthdayModal').addEventListener('click', () => closeModal('birthdayModal'));
document.getElementById('closeViewModal').addEventListener('click', () => closeModal('viewModal'));

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ─── Refresh All ──────────────────────────────────────────────────────────────
function refreshAll() {
  const reminders = LocalDB.getReminders();
  const birthdays = LocalDB.getBirthdays();
  renderCalendar(reminders, birthdays);
  renderReminderGrid(reminders);
  renderUpcoming();
  renderBirthdaySidebar();
  updateStats();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
(async function init() {
  // Try to load from backend; fall back to local storage
  const [remFromApi, bFromApi] = await Promise.all([
    ReminderAPI.getAll(),
    BirthdayAPI.getAll(),
  ]);

  if (remFromApi) {
    LocalDB.saveReminders(remFromApi);
  }
  if (bFromApi) {
    LocalDB.saveBirthdays(bFromApi);
  }

  refreshAll();
})();
