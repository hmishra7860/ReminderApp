// ─── Reminders ────────────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Work: '#3B82F6', Personal: '#8B5CF6', Birthday: '#EC4899',
  Finance: '#F59E0B', Health: '#10B981',
};

function getCatClass(cat) {
  return (cat || 'personal').toLowerCase().replace(' ', '');
}

// ─── Render Reminder Grid ─────────────────────────────────────────────────────
function renderReminderGrid(reminders, container = 'reminderGrid') {
  const el = document.getElementById(container);
  if (!reminders.length) {
    el.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-calendar-xmark"></i>
        <p>No reminders yet. Create one to get started!</p>
      </div>`;
    return;
  }

  el.innerHTML = reminders.map(r => {
    const color = CATEGORY_COLORS[r.category] || '#64748B';
    const catCls = getCatClass(r.category);
    const dateStr = formatDate(r.date);
    const timeStr = r.time ? ` · ${r.time}` : '';
    return `
      <div class="reminder-card" data-id="${r.id}">
        <div class="card-accent cat-${catCls}" style="background:${color}"></div>
        <div class="card-category cat-label-${catCls}">${r.category || 'General'}</div>
        <h4>${escHtml(r.title)}</h4>
        <p>${r.description ? escHtml(r.description) : '<em style="opacity:.5">No description</em>'}</p>
        <div class="card-meta">
          <div class="card-date">
            <i class="fa-regular fa-calendar"></i> ${dateStr}${timeStr}
          </div>
          <div class="card-actions">
            <button class="edit-btn" data-id="${r.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="del-btn" data-id="${r.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');

  // Events
  el.querySelectorAll('.reminder-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-actions')) return;
      const r = LocalDB.getReminders().find(x => x.id == card.dataset.id);
      if (r) openViewModal(r);
    });
  });
  el.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = LocalDB.getReminders().find(x => x.id == btn.dataset.id);
      if (r) openEditModal(r);
    });
  });
  el.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteReminder(+btn.dataset.id);
    });
  });
}

// ─── Render Sidebar Upcoming ──────────────────────────────────────────────────
function renderUpcoming() {
  const el = document.getElementById('upcomingList');
  const all = LocalDB.getReminders();
  const todayStr = toDateStr(today);
  const upcoming = all
    .filter(r => r.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  if (!upcoming.length) {
    el.innerHTML = '<div class="sidebar-empty">No upcoming reminders</div>';
    return;
  }
  el.innerHTML = upcoming.map(r => {
    const color = CATEGORY_COLORS[r.category] || '#64748B';
    return `
      <div class="sidebar-item" data-id="${r.id}">
        <div class="sidebar-dot" style="background:${color}"></div>
        <div class="sidebar-item-text">
          <strong>${escHtml(r.title)}</strong>
          <span>${relativeDate(r.date)}</span>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      const r = LocalDB.getReminders().find(x => x.id == item.dataset.id);
      if (r) openViewModal(r);
    });
  });
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────
function updateStats() {
  const all = LocalDB.getReminders();
  const todayStr = toDateStr(today);
  document.getElementById('stat-total').textContent = all.length;
  document.getElementById('stat-today').textContent = all.filter(r => r.date === todayStr).length;
  document.getElementById('stat-upcoming').textContent = all.filter(r => r.date > todayStr).length;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
function deleteReminder(id) {
  if (!confirm('Delete this reminder?')) return;
  LocalDB.deleteReminder(id);
  showToast('Reminder deleted', 'success');
  refreshAll();
}

// ─── Open Modals ──────────────────────────────────────────────────────────────
function openEditModal(r) {
  document.getElementById('reminderModalTitle').textContent = 'Edit Reminder';
  document.getElementById('reminderId').value = r.id;
  document.getElementById('rTitle').value = r.title;
  document.getElementById('rDesc').value = r.description || '';
  document.getElementById('rCategory').value = r.category || 'Work';
  document.getElementById('rDate').value = r.date || '';
  document.getElementById('rTime').value = r.time || '';
  openModal('reminderModal');
}

function openViewModal(r) {
  document.getElementById('viewTitle').textContent = r.title;
  document.getElementById('viewBody').innerHTML = `
    <div class="view-row"><div class="view-label">Category</div><div>${r.category || '—'}</div></div>
    <div class="view-row"><div class="view-label">Date</div><div>${formatDate(r.date)}</div></div>
    <div class="view-row"><div class="view-label">Time</div><div>${r.time || '—'}</div></div>
    <div class="view-row"><div class="view-label">Description</div><div>${r.description || '—'}</div></div>
    <div class="view-row"><div class="view-label">Created</div><div>${formatDate(r.created_at?.slice(0,10))}</div></div>
  `;
  document.getElementById('deleteFromView').onclick = () => {
    closeModal('viewModal');
    deleteReminder(r.id);
  };
  document.getElementById('editFromView').onclick = () => {
    closeModal('viewModal');
    openEditModal(r);
  };
  openModal('viewModal');
}

// ─── Save Reminder ────────────────────────────────────────────────────────────
document.getElementById('saveReminder').addEventListener('click', () => {
  const title = document.getElementById('rTitle').value.trim();
  const date  = document.getElementById('rDate').value;
  if (!title) { alert('Title is required'); return; }
  if (!date)  { alert('Date is required'); return; }

  const id = document.getElementById('reminderId').value;
  const data = {
    title,
    description: document.getElementById('rDesc').value.trim(),
    category: document.getElementById('rCategory').value,
    date,
    time: document.getElementById('rTime').value,
  };

  if (id) {
    LocalDB.updateReminder(+id, data);
    showToast('Reminder updated!', 'success');
  } else {
    LocalDB.addReminder(data);
    showToast('Reminder created!', 'success');
  }

  closeModal('reminderModal');
  refreshAll();
});

// ─── Search & Filter ──────────────────────────────────────────────────────────
function applyFilters() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat = document.getElementById('categoryFilter')?.value || '';
  let list = LocalDB.getReminders();
  if (q) list = list.filter(r => r.title.toLowerCase().includes(q) || (r.description||'').toLowerCase().includes(q));
  if (cat) list = list.filter(r => r.category === cat);
  renderReminderGrid(list);
}

document.getElementById('searchInput')?.addEventListener('input', applyFilters);
document.getElementById('categoryFilter')?.addEventListener('change', applyFilters);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function relativeDate(d) {
  const target = new Date(d + 'T00:00:00');
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((target - t) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff < 7) return target.toLocaleDateString('en-US', { weekday: 'long' });
  return formatDate(d);
}
