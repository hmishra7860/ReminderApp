// ─── Calendar ─────────────────────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const today = new Date();
let calYear = today.getFullYear();
let calMonth = today.getMonth();

function renderCalendar(reminders = [], birthdays = []) {
  document.getElementById('monthYear').textContent = `${MONTHS[calMonth]} ${calYear}`;

  const grid = document.getElementById('calendarDays');
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

  // Build events-by-date map
  const eventsByDate = {};
  reminders.forEach(r => {
    const d = r.date?.slice(0, 10);
    if (!d) return;
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push({ type: 'reminder', ...r });
  });
  birthdays.forEach(b => {
    if (!b.date_of_birth) return;
    const dob = b.date_of_birth.slice(0, 10);
    const month = parseInt(dob.split('-')[1]) - 1;
    const day = parseInt(dob.split('-')[2]);
    const key = `${calYear}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push({ type: 'birthday', title: `🎂 ${b.name}`, category: 'Birthday' });
  });

  let cells = '';

  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    const d = prevMonthDays - firstDay + i + 1;
    const m = calMonth === 0 ? 11 : calMonth - 1;
    const y = calMonth === 0 ? calYear - 1 : calYear;
    const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells += buildCell(d, key, true, eventsByDate[key] || []);
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = calYear === today.getFullYear() && calMonth === today.getMonth() && d === today.getDate();
    cells += buildCell(d, key, false, eventsByDate[key] || [], isToday);
  }

  // Next month padding
  const total = firstDay + daysInMonth;
  const trailing = (7 - total % 7) % 7;
  for (let d = 1; d <= trailing; d++) {
    const m = calMonth === 11 ? 0 : calMonth + 1;
    const y = calMonth === 11 ? calYear + 1 : calYear;
    const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells += buildCell(d, key, true, eventsByDate[key] || []);
  }

  grid.innerHTML = cells;

  // Click to create reminder on a date
  grid.querySelectorAll('.day-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      document.getElementById('rDate').value = cell.dataset.date;
      openModal('reminderModal');
    });
  });
}

function buildCell(day, key, otherMonth, events, isToday = false) {
  const classes = ['day-cell'];
  if (otherMonth) classes.push('other-month');
  if (isToday) classes.push('today');

  const shown = events.slice(0, 3);
  const more = events.length - shown.length;

  const pills = shown.map(e => {
    const cls = (e.category || 'personal').toLowerCase();
    return `<div class="event-pill ${cls}">${escHtml(e.title)}</div>`;
  }).join('');
  const morePill = more > 0 ? `<div class="event-pill more">+${more} more</div>` : '';

  return `
    <div class="${classes.join(' ')}" data-date="${key}">
      <div class="day-num">${day}</div>
      <div class="day-events">${pills}${morePill}</div>
    </div>`;
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Navigation
document.getElementById('prevMonth').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  refreshCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  refreshCalendar();
});
document.getElementById('todayBtn').addEventListener('click', () => {
  calYear = today.getFullYear();
  calMonth = today.getMonth();
  refreshCalendar();
});

function refreshCalendar() {
  const reminders = LocalDB.getReminders();
  const birthdays = LocalDB.getBirthdays();
  renderCalendar(reminders, birthdays);
}

// View toggle (UI only)
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
