// ─── Birthdays ────────────────────────────────────────────────────────────────
function renderBirthdayGrid() {
  const el = document.getElementById('birthdayGrid');
  const list = LocalDB.getBirthdays();

  if (!list.length) {
    el.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-cake-candles"></i>
        <p>No birthdays added yet. Add one to start sending wishes!</p>
      </div>`;
    return;
  }

  el.innerHTML = list.map(b => {
    const age = getAge(b.date_of_birth);
    const next = nextBirthday(b.date_of_birth);
    const daysLeft = daysUntil(next);
    return `
      <div class="reminder-card" data-bid="${b.id}">
        <div class="card-accent" style="background:#EC4899"></div>
        <div class="card-category" style="color:#DB2777">Birthday</div>
        <h4><i class="fa-solid fa-cake-candles" style="color:#EC4899;margin-right:6px"></i>${escHtml(b.name)}</h4>
        <p>${b.email || '<em style="opacity:.5">No email set</em>'}</p>
        <div class="card-meta">
          <div class="card-date">
            <i class="fa-regular fa-calendar"></i>
            ${formatDate(b.date_of_birth)} · Age ${age} · ${daysLeft === 0 ? '🎉 Today!' : daysLeft + 'd left'}
          </div>
          <div class="card-actions">
            <button class="del-btn" data-bid="${b.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm('Remove this birthday?')) return;
      LocalDB.deleteBirthday(+btn.dataset.bid);
      showToast('Birthday removed', 'success');
      renderBirthdayGrid();
      renderBirthdaySidebar();
      refreshCalendar();
    });
  });
}

function renderBirthdaySidebar() {
  const el = document.getElementById('birthdayList');
  const today_ = new Date();
  const list = LocalDB.getBirthdays()
    .map(b => ({ ...b, daysLeft: daysUntil(nextBirthday(b.date_of_birth)) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  if (!list.length) {
    el.innerHTML = '<div class="sidebar-empty">No birthdays added</div>';
    return;
  }
  el.innerHTML = list.map(b => `
    <div class="sidebar-item">
      <div class="sidebar-dot" style="background:#EC4899"></div>
      <div class="sidebar-item-text">
        <strong>${escHtml(b.name)}</strong>
        <span>${b.daysLeft === 0 ? '🎉 Today!' : `in ${b.daysLeft} day${b.daysLeft !== 1 ? 's' : ''}`}</span>
      </div>
    </div>`).join('');
}

// ─── Save Birthday ────────────────────────────────────────────────────────────
document.getElementById('saveBirthday').addEventListener('click', () => {
  const name = document.getElementById('bName').value.trim();
  const dob  = document.getElementById('bDob').value;
  if (!name) { alert('Name is required'); return; }
  if (!dob)  { alert('Date of birth is required'); return; }

  LocalDB.addBirthday({ name, email: document.getElementById('bEmail').value.trim(), date_of_birth: dob });
  showToast(`Birthday added for ${name}!`, 'success');
  closeModal('birthdayModal');
  renderBirthdayGrid();
  renderBirthdaySidebar();
  refreshCalendar();
});

// ─── Open button ──────────────────────────────────────────────────────────────
document.getElementById('openBirthdayModal')?.addEventListener('click', () => {
  document.getElementById('bName').value = '';
  document.getElementById('bEmail').value = '';
  document.getElementById('bDob').value = '';
  openModal('birthdayModal');
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAge(dob) {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

function nextBirthday(dob) {
  const d = new Date(dob + 'T00:00:00');
  const now = new Date();
  let next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    next = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
  }
  return next;
}

function daysUntil(date) {
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date - t) / 86400000);
}
