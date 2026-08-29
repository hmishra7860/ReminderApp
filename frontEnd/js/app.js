window.AppState = { reminders: [], birthdays: [] };

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

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});

document.getElementById('openReminderModal').addEventListener('click', resetReminderModal);
document.getElementById('openReminderModal2')?.addEventListener('click', resetReminderModal);

function resetReminderModal() {
  document.getElementById('reminderModalTitle').textContent = 'New Reminder';
  document.getElementById('reminderId').value = '';
  document.getElementById('rTitle').value = '';
  document.getElementById('rDesc').value = '';
  document.getElementById('rCategory').value = 'Work';
  document.getElementById('rDate').value = '';
  document.getElementById('rTime').value = '';
  if(document.getElementById('rRecurrence')) document.getElementById('rRecurrence').value = 'none';
  openModal('reminderModal');
}

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

// ─── Global Refresh ───────────────────────────────────────────────────────────
async function loadDataFromAPI() {
  try {
    const [remFromApi, bFromApi] = await Promise.all([ ReminderAPI.getAll(), BirthdayAPI.getAll() ]);
    AppState.reminders = remFromApi || [];
    AppState.birthdays = bFromApi || [];
    refreshUI();
  } catch (err) {
    console.error("Failed to load data:", err);
  }
}

function refreshUI() {
  renderCalendar(AppState.reminders, AppState.birthdays);
  renderReminderGrid(AppState.reminders);
  renderUpcoming();
  renderBirthdaySidebar();
  updateStats();
}

// ─── Authentication & Initialization ──────────────────────────────────────────
const Auth = {
  login: async () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    
    try {
      btn.textContent = "Logging in..."; btn.disabled = true;
      const res = await AuthAPI.login(email, pass);
      localStorage.setItem('rcal_token', res.access_token);
      showToast('Login successful!', 'success');
      await AppInit.startSession();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = "Log In"; btn.disabled = false;
    }
  },

  register: async () => {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const btn = document.getElementById('registerBtn');

    if (pass !== confirm) return showToast('Passwords do not match', 'error');

    try {
      btn.textContent = "Creating account..."; btn.disabled = true;
      await AuthAPI.register({ full_name: name, email: email, password: pass, confirm_password: confirm });
      showToast('Registration successful! Please log in.', 'success');
      switchPage('page-login');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = "Sign Up"; btn.disabled = false;
    }
  },

  logout: () => {
    localStorage.removeItem('rcal_token');
    document.body.classList.add('unauthenticated');
    switchPage('page-login');
  }
};

const AppInit = {
  startSession: async () => {
    try {
      const profile = await AuthAPI.getProfile();
      
      const nameEl = document.getElementById('profileName');
      const avatarEl = document.getElementById('profileAvatar');
      if (nameEl) nameEl.textContent = profile.full_name;
      if (avatarEl) avatarEl.textContent = profile.full_name.charAt(0).toUpperCase();

      if (document.getElementById('smtpHost')) {
        document.getElementById('smtpHost').value = profile.smtp_host || '';
        document.getElementById('smtpPort').value = profile.smtp_port || '';
        document.getElementById('smtpUser').value = profile.smtp_user || '';
        document.getElementById('fromEmail').value = profile.from_email || '';
        // Note: We intentionally leave the password blank for security
      }
      
      document.body.classList.remove('unauthenticated');
      switchPage('page-dashboard');
      
      await loadDataFromAPI(); // Fetch DB data and populate UI

    } catch (err) {
      console.error("Session start failed:", err);
      Auth.logout();
    }
  }
};

// ─── Events ───────────────────────────────────────────────────────────────────
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

document.getElementById('goToRegister').addEventListener('click', () => switchPage('page-register'));

// ─── Save SMTP Settings (Bulletproof Method) ──────────────────────────────────
document.addEventListener('click', async (e) => {
  // Check if the clicked element has the ID 'saveSmtpBtn'
  const Btn = e.target.closest('#saveSmtpBtn');
  
  if (Btn) {
    e.preventDefault(); 
    console.log("Save button clicked! Gathering data...");
    
    // Gather values from the form
    const data = {
      smtp_host: document.getElementById('smtpHost')?.value.trim() || null,
      smtp_port: parseInt(document.getElementById('smtpPort')?.value) || null,
      smtp_user: document.getElementById('smtpUser')?.value.trim() || null,
      smtp_pass: document.getElementById('smtpPass')?.value.trim() || null,
      from_email: document.getElementById('fromEmail')?.value.trim() || null
    };

    console.log("Save button clicked! Data to send:", data); // <-- Debugging line

    try {
      Btn.textContent = "Saving..."; 
      Btn.disabled = true;
      
      await AuthAPI.updateSmtp(data);
      showToast('SMTP settings saved successfully!', 'success');
      
    } catch (err) {
      console.error("API Error:", err);
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      Btn.textContent = "Save SMTP Details"; 
      Btn.disabled = false;
    }
  }
});

document.getElementById('goToLogin').addEventListener('click', () => switchPage('page-login'));
document.getElementById('loginBtn').addEventListener('click', Auth.login);
document.getElementById('registerBtn').addEventListener('click', Auth.register);

document.querySelector('.profile').addEventListener('click', () => {
  if (confirm("Do you want to log out?")) Auth.logout();
});

// Start App
(async function init() {
  if (localStorage.getItem('rcal_token')) {
    await AppInit.startSession();
  } else {
    Auth.logout();
  }
})();