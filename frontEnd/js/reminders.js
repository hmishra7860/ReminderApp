// ─── Reminders ────────────────────────────────────────────────────────────────
const CATEGORY_COLORS = { Work: '#3B82F6', Personal: '#8B5CF6', Birthday: '#EC4899', Finance: '#F59E0B', Health: '#10B981' };
function getCatClass(cat) { return (cat || 'personal').toLowerCase().replace(' ', ''); }

// ─── Render Reminder Grid ─────────────────────────────────────────────────────
function renderReminderGrid(reminders, container = 'reminderGrid') {
  const el = document.getElementById(container);
  if (!reminders.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><p>No reminders yet.</p></div>`;
    return;
  }

  el.innerHTML = reminders.map(r => {
    const color = CATEGORY_COLORS[r.category] || '#64748B';
    const catCls = getCatClass(r.category);
    return `
      <div class="reminder-card" data-id="${r.id}">
        <div class="card-accent cat-${catCls}" style="background:${color}"></div>
        <div class="card-category cat-label-${catCls}">${r.category || 'General'}</div>
        <h4>${escHtml(r.title)}</h4>
        <p>${r.description ? escHtml(r.description) : '<em style="opacity:.5">No description</em>'}</p>
        <div class="card-meta">
          <div class="card-date"><i class="fa-regular fa-calendar"></i> ${formatDate(r.date)}${r.time ? ` · ${r.time}` : ''}</div>
          <div class="card-actions">
            <button class="edit-btn" data-id="${r.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="del-btn" data-id="${r.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('.reminder-card').forEach(card => card.addEventListener('click', (e) => {
    if (!e.target.closest('.card-actions')) openViewModal(AppState.reminders.find(x => x.id == card.dataset.id));
  }));
  el.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => {
    e.stopPropagation(); openEditModal(AppState.reminders.find(x => x.id == btn.dataset.id));
  }));
  el.querySelectorAll('.del-btn').forEach(btn => btn.addEventListener('click', (e) => {
    e.stopPropagation(); deleteReminder(+btn.dataset.id);
  }));
}

// ─── Render Sidebar Upcoming ──────────────────────────────────────────────────
function renderUpcoming() {
  const el = document.getElementById('upcomingList');
  const todayStr = toDateStr(new Date());
  const upcoming = AppState.reminders.filter(r => r.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  if (!upcoming.length) return el.innerHTML = '<div class="sidebar-empty">No upcoming reminders</div>';
  el.innerHTML = upcoming.map(r => `
      <div class="sidebar-item" data-id="${r.id}">
        <div class="sidebar-dot" style="background:${CATEGORY_COLORS[r.category] || '#64748B'}"></div>
        <div class="sidebar-item-text"><strong>${escHtml(r.title)}</strong><span>${relativeDate(r.date)}</span></div>
      </div>`).join('');
  el.querySelectorAll('.sidebar-item').forEach(item => item.addEventListener('click', () => openViewModal(AppState.reminders.find(x => x.id == item.dataset.id))));
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────
function updateStats() {
  const todayStr = toDateStr(new Date());
  document.getElementById('stat-total').textContent = AppState.reminders.length;
  document.getElementById('stat-today').textContent = AppState.reminders.filter(r => r.date === todayStr).length;
  document.getElementById('stat-upcoming').textContent = AppState.reminders.filter(r => r.date > todayStr).length;
}

// ─── CRUD (Async) ─────────────────────────────────────────────────────────────
async function deleteReminder(id) {
  if (!confirm('Delete this reminder?')) return;
  try {
    await ReminderAPI.delete(id);
    showToast('Reminder deleted', 'success');
    await loadDataFromAPI(); // Sync with DB
  } catch (err) { showToast(err.message, 'error'); }
}

document.getElementById('saveReminder').addEventListener('click', async () => {
  const title = document.getElementById('rTitle').value.trim();
  const date  = document.getElementById('rDate').value;
  if (!title || !date) return alert('Title and Date are required');

  const id = document.getElementById('reminderId').value;
  const data = {
    title, date,
    description: document.getElementById('rDesc').value.trim() || null,
    category: document.getElementById('rCategory').value,
    time: document.getElementById('rTime').value || null,
  };

  try {
    const btn = document.getElementById('saveReminder');
    btn.disabled = true; btn.textContent = "Saving...";
    if (id) {
      await ReminderAPI.update(+id, data);
      showToast('Reminder updated!', 'success');
    } else {
      await ReminderAPI.create(data);
      showToast('Reminder created!', 'success');
    }
    closeModal('reminderModal');
    await loadDataFromAPI();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    document.getElementById('saveReminder').disabled = false;
    document.getElementById('saveReminder').textContent = "Save Reminder";
  }
});

// ─── Open Modals ──────────────────────────────────────────────────────────────
function openEditModal(r) {
  if(!r) return;
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
  if(!r) return;
  document.getElementById('viewTitle').textContent = r.title;
  document.getElementById('viewBody').innerHTML = `
    <div class="view-row"><div class="view-label">Category</div><div>${r.category || '—'}</div></div>
    <div class="view-row"><div class="view-label">Date</div><div>${formatDate(r.date)}</div></div>
    <div class="view-row"><div class="view-label">Time</div><div>${r.time || '—'}</div></div>
    <div class="view-row"><div class="view-label">Description</div><div>${r.description || '—'}</div></div>
  `;
  document.getElementById('deleteFromView').onclick = () => { closeModal('viewModal'); deleteReminder(r.id); };
  document.getElementById('editFromView').onclick = () => { closeModal('viewModal'); openEditModal(r); };
  openModal('viewModal');
}

// ─── Search & Filter ──────────────────────────────────────────────────────────
function applyFilters() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat = document.getElementById('categoryFilter')?.value || '';
  let list = AppState.reminders;
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
function toDateStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function relativeDate(d) {
  const target = new Date(d + 'T00:00:00');
  const t = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const diff = Math.round((target - t) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff < 7) return target.toLocaleDateString('en-US', { weekday: 'long' });
  return formatDate(d);
}