
let currentView = 'month'; // 'month', 'week', or 'day'
let currentDate = new Date(); // Tracks the currently focused date for week/day views

// ─── Calendar ─────────────────────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const today = new Date();
let calYear = today.getFullYear();
let calMonth = today.getMonth();

function buildMonthCells(year, month, eventsByDate) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const todayDate = new Date();
  let cells = '';

  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    const d = prevMonthDays - firstDay + i + 1;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells += buildCell(d, key, true, eventsByDate[key] || []);
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = year === todayDate.getFullYear() && month === todayDate.getMonth() && d === todayDate.getDate();
    cells += buildCell(d, key, false, eventsByDate[key] || [], isToday);
  }

  // Next month padding
  const total = firstDay + daysInMonth;
  const trailing = (7 - total % 7) % 7;
  for (let d = 1; d <= trailing; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells += buildCell(d, key, true, eventsByDate[key] || []);
  }

  return cells;
}

function renderCalendar(reminders = [], birthdays = []) {
  const grid = document.getElementById('calendarDays');
  const weekdaysHeader = document.querySelector('.weekdays');
  
  // Build events-by-date map (keep your existing recurrence projection loop here)
  const eventsByDate = {};
  // ... (leave your existing event mapping & projection logic intact) ...
  function addEvent(dateStr, eventObj) {
    if (!eventsByDate[dateStr]) {
      eventsByDate[dateStr] = [];
    }
    eventsByDate[dateStr].push(eventObj);
  }

  let rangeStart, rangeEnd;
  if (currentView === 'month') {
    rangeStart = new Date(calYear, calMonth, 1);
    rangeEnd = new Date(calYear, calMonth + 1, 0);
  } else if (currentView === 'week') {
    rangeStart = new Date(currentDate);
    rangeStart.setDate(currentDate.getDate() - currentDate.getDay());
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeStart.getDate() + 6);
  } else {
    rangeStart = new Date(currentDate);
    rangeEnd = new Date(currentDate);
  }

  // 2. Project Reminders & Recurrences
  reminders.forEach(r => {
    if (!r.date) return;
    const rec = (r.recurrence || 'none').toLowerCase();
    const origParts = r.date.split('-').map(Number);
    const origDate = new Date(origParts[0], origParts[1] - 1, origParts[2]);

    if (rec === 'none') {
      addEvent(r.date, r);
    } else if (rec === 'daily') {
      let cur = new Date(Math.max(origDate.getTime(), rangeStart.getTime()));
      while (cur <= rangeEnd) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        addEvent(key, r);
        cur.setDate(cur.getDate() + 1);
      }
    } else if (rec === 'weekly') {
      let cur = new Date(origDate);
      while (cur < rangeStart) {
        cur.setDate(cur.getDate() + 7);
      }
      while (cur <= rangeEnd) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        addEvent(key, r);
        cur.setDate(cur.getDate() + 7);
      }
    } else if (rec === 'monthly') {
      const dayNum = origDate.getDate();
      const targetYear = currentView === 'month' ? calYear : currentDate.getFullYear();
      const targetMonth = currentView === 'month' ? calMonth : currentDate.getMonth();
      const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
      const actualDay = Math.min(dayNum, maxDays);
      const projDate = new Date(targetYear, targetMonth, actualDay);

      if (projDate >= origDate) {
        const key = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
        addEvent(key, r);
      }
    } else if (rec === 'yearly') {
      const origMonth = origDate.getMonth();
      const origDay = origDate.getDate();
      const targetYear = currentView === 'month' ? calYear : currentDate.getFullYear();
      const maxDays = new Date(targetYear, origMonth + 1, 0).getDate();
      const actualDay = Math.min(origDay, maxDays);
      const projDate = new Date(targetYear, origMonth, actualDay);

      if (projDate >= origDate) {
        const key = `${targetYear}-${String(origMonth + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
        addEvent(key, r);
      }
    }
  });

  // 3. Project Birthdays (Yearly)
  birthdays.forEach(b => {
    if (!b.date) return;
    const bParts = b.date.split('-').map(Number);
    const targetYear = currentView === 'month' ? calYear : currentDate.getFullYear();
    const key = `${targetYear}-${String(bParts[1]).padStart(2, '0')}-${String(bParts[2]).padStart(2, '0')}`;
    addEvent(key, {
      title: `🎂 ${b.name}'s Birthday`,
      category: 'birthday',
      recurrence: 'yearly'
    });
  });

  // Handle View Layouts
  if (currentView === 'month') {
    weekdaysHeader.style.display = 'grid';
    document.getElementById('monthYear').textContent = `${MONTHS[calMonth]} ${calYear}`;
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    
    // Run your existing month grid builder code here...
    grid.innerHTML = buildMonthCells(calYear, calMonth, eventsByDate);

  } else if (currentView === 'week') {
    weekdaysHeader.style.display = 'grid';
    
    // Find the Sunday of the current week
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    document.getElementById('monthYear').textContent = `${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${MONTHS[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${calYear}`;
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';

    let cells = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const isToday = d.toDateString() === new Date().toDateString();
      cells += buildCell(d.getDate(), key, false, eventsByDate[key] || [], isToday);
    }
    grid.innerHTML = cells;

  } else if (currentView === 'day') {
    weekdaysHeader.style.display = 'none'; // Hide day names header for single day view
    document.getElementById('monthYear').textContent = `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${calYear}`;
    grid.style.gridTemplateColumns = '1fr';

    const key = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    // Render an expanded single day cell view
    grid.innerHTML = `
      <div class="day-cell single-day-view ${isToday ? 'today' : ''}" data-date="${key}" style="min-height: 400px; padding: 16px;">
        <div class="day-num" style="font-size: 18px; width: 36px; height: 36px; margin-bottom: 12px;">${currentDate.getDate()}</div>
        <div class="day-events" style="gap: 8px;">
          ${(eventsByDate[key] || []).map(e => {
            const cls = (e.category || 'personal').toLowerCase();
            const isRecurring = e.recurrence && e.recurrence !== 'none';
            const repeatIcon = isRecurring ? ' <i class="fa-solid fa-repeat"></i>' : '';
            return `<div class="event-pill ${cls}" style="padding: 8px 12px; font-size: 13px;">${escHtml(e.title)} ${e.time ? `(${e.time})` : ''} ${repeatIcon}</div>`;
          }).join('')}
          ${!(eventsByDate[key] || []).length ? '<p style="color: var(--text-muted); margin-top: 20px;">No reminders scheduled for this day.</p>' : ''}
        </div>
      </div>`;
  }

  // Click to create reminder on a date (applies to all views)
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

    const isRecurring = e.recurrence && e.recurrence !== 'none';
    const repeatIcon = isRecurring ? ' <i class="fa-solid fa-repeat" style="font-size: 8px; margin-left: 3px;"></i>' : '';
    
    // Add the icon to the pill
    return `<div class="event-pill ${cls}">${escHtml(e.title)}${repeatIcon}</div>`;

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
  if (currentView === 'month') {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
  } else if (currentView === 'week') {
    currentDate.setDate(currentDate.getDate() - 7);
    calMonth = currentDate.getMonth();
    calYear = currentDate.getFullYear();
  } else if (currentView === 'day') {
    currentDate.setDate(currentDate.getDate() - 1);
    calMonth = currentDate.getMonth();
    calYear = currentDate.getFullYear();
  }
  refreshCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  if (currentView === 'month') {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
  } else if (currentView === 'week') {
    currentDate.setDate(currentDate.getDate() + 7);
    calMonth = currentDate.getMonth();
    calYear = currentDate.getFullYear();
  } else if (currentView === 'day') {
    currentDate.setDate(currentDate.getDate() + 1);
    calMonth = currentDate.getMonth();
    calYear = currentDate.getFullYear();
  }
  refreshCalendar();
});

document.getElementById('todayBtn').addEventListener('click', () => {
  today = new Date();
  calYear = today.getFullYear();
  calMonth = today.getMonth();
  currentDate = new Date();
  refreshCalendar();
});

function refreshCalendar() {
  renderCalendar(window.AppState.reminders, window.AppState.birthdays);
}

// View toggle (UI only)
// View toggle logic
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const text = btn.textContent.trim().toLowerCase();
    if (text === 'month' || text === 'week' || text === 'day') {
      currentView = text;
      refreshCalendar();
    }
  });
});
