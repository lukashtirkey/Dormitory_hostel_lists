/* ═══════════════════════════════════════════════════════════════
   Hostel Dormitory Manager — Admin Client App
   ═══════════════════════════════════════════════════════════════ */

const TOKEN = localStorage.getItem('dorm_token');
const ROLE  = localStorage.getItem('dorm_role');

// ── AUTH GUARD ────────────────────────────────────────────────────
// Allow viewing dashboard for all roles, require admin for restricted management actions

let STATE = null;

// ── BOOT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  refresh();
  setInterval(refresh, 30000);
});

// ── DATA ──────────────────────────────────────────────────────────
async function refresh() {
  try {
    const isHostAdmin = ROLE === 'admin';
    const endpoint = isHostAdmin ? '/api/data' : '/api/public-list';
    const res = await fetch(endpoint, { headers: { 'x-auth-token': TOKEN || '' } });
    if (res.status === 401 || res.status === 403) {
      if (isHostAdmin) { logout(); return; }
    }
    STATE = await res.json();
    if (STATE) {
      if (!STATE.residents) STATE.residents = [];
      if (!STATE.dormitories) STATE.dormitories = [];
    }
    renderCurrentPage();
    updateSidebar();
    updateAuthUI();
  } catch (e) {
    toast('Cannot reach server', 'error');
  }
}

function updateAuthUI() {
  const isAdmin = ROLE === 'admin';
  const loginBtn = document.getElementById('btnAdminLoginModal');
  const adminBtns = document.querySelectorAll('.admin-only');
  if (loginBtn) loginBtn.style.display = isAdmin ? 'none' : 'inline-block';
  adminBtns.forEach(btn => {
    btn.style.display = isAdmin ? 'inline-block' : 'none';
  });
}

async function api(url, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'x-auth-token': TOKEN }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (res.status === 401) { logout(); return {}; }
  return res.json();
}

function logout() {
  fetch('/api/logout', { method: 'POST', headers: { 'x-auth-token': TOKEN } }).catch(() => {});
  localStorage.removeItem('dorm_token');
  localStorage.removeItem('dorm_role');
  localStorage.removeItem('dorm_name');
  window.location.href = '/';
}

// ── NAVIGATION ────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:   '📊 Dashboard',
  dormitories: '🏢 Room Management',
  residents:   '👥 Residents',
  assignments: '📋 Room Assignments',
  share:       '📲 Live Share & QR Scanner',
  download:    '📥 Download & Export',
  import:      '📂 Bulk Import',
  history:     '🕒 Rotation History',
  settings:    '⚙️ Settings',
  dbsm:        '🎓 Don Bosco Skill Mission (DBSM)'
};

let currentPage = 'dashboard';

function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const targetPage = document.getElementById('page-' + name);
  if (targetPage) targetPage.classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('topbarTitle').textContent = PAGE_TITLES[name] || name;
  currentPage = name;
  renderCurrentPage();
}

function renderCurrentPage() {
  if (!STATE) return;
  switch (currentPage) {
    case 'dashboard':   renderDashboard();   break;
    case 'dormitories': renderDormsTable();  break;
    case 'residents':   renderResidents();   break;
    case 'assignments': renderAssignments(); break;
    case 'share':       renderShare();       break;
    case 'download':    break;
    case 'history':     renderHistory();     break;
    case 'settings':    renderSettings();    break;
    case 'dbsm':        break;
  }
}

// ── SIDEBAR ───────────────────────────────────────────────────────
function updateSidebar() {
  if (!STATE) return;
  const cd = document.getElementById('sideCountdown');
  const nd = document.getElementById('sideNextDate');
  if (!STATE.nextRotationDate) {
    cd.textContent = '—';
    cd.className = 'countdown';
    nd.textContent = 'Not scheduled';
    return;
  }
  const days = daysLeft(STATE.nextRotationDate);
  cd.textContent = days <= 0 ? '⚠️ Overdue!' : days + (days === 1 ? ' day' : ' days');
  cd.className = 'countdown' + (days <= 0 ? ' urgent' : '');
  nd.textContent = fmtDate(STATE.nextRotationDate);
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function renderDashboard() {
  const d = STATE;
  const girls = d.residents.filter(r => (r.block || '').toLowerCase().includes('girl'));
  const boys  = d.residents.filter(r => (r.block || '').toLowerCase().includes('boy'));
  const unassigned = d.residents.filter(r => !r.dormitory);

  document.getElementById('dashGirlsCount').textContent = girls.length;
  document.getElementById('dashBoysCount').textContent  = boys.length;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-icon purple">🏢</div><div><div class="stat-val">${d.dormitories.length}</div><div class="stat-lbl">Total Rooms</div></div></div>
    <div class="stat-card"><div class="stat-icon blue">👥</div><div><div class="stat-val">${d.residents.length}</div><div class="stat-lbl">Total Residents</div></div></div>
    <div class="stat-card"><div class="stat-icon green">✅</div><div><div class="stat-val">${d.residents.length - unassigned.length}</div><div class="stat-lbl">Assigned</div></div></div>
    <div class="stat-card"><div class="stat-icon orange">⚠️</div><div><div class="stat-val">${unassigned.length}</div><div class="stat-lbl">Unassigned</div></div></div>
    <div class="stat-card"><div class="stat-icon purple">🔄</div><div><div class="stat-val">${d.rotationCount || 0}</div><div class="stat-lbl">Rotations Done</div></div></div>`;

  // Occupancy bars
  const oEl = document.getElementById('dashOccupancy');
  if (!d.dormitories.length) {
    oEl.innerHTML = empty('🏢', 'No rooms added yet');
  } else {
    oEl.innerHTML = d.dormitories.map(dm => {
      const rot = (d.currentRotation || []).find(x => x.name === dm.name);
      const cnt = rot ? (rot.residents || []).length : 0;
      const pct = Math.round((cnt / dm.capacity) * 100);
      const col = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
      const isGirl = (dm.block || '').toLowerCase().includes('girl');
      const isBoy  = (dm.block || '').toLowerCase().includes('boy');
      const barColor = isGirl ? 'linear-gradient(90deg,#f43f5e,#ec4899)' : isBoy ? 'linear-gradient(90deg,#3b82f6,#6366f1)' : 'linear-gradient(90deg,#7c3aed,#6d28d9)';
      return `<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:.83em;margin-bottom:5px">
          <span><strong style="color:#fff">${dm.name}</strong> <span style="color:var(--muted);font-size:.85em">${dm.block ? '('+dm.block+')' : ''}</span></span>
          <span style="font-weight:700;color:${col}">${cnt}/${dm.capacity}</span>
        </div>
        <div class="progress-bg"><div class="progress-bar" style="width:${pct}%;background:${barColor}"></div></div>
      </div>`;
    }).join('');
  }

  // Rotation info
  const rEl = document.getElementById('dashRotation');
  const days = d.nextRotationDate ? daysLeft(d.nextRotationDate) : null;

  // Current period label
  let periodLabel = '';
  if (d.lastRotationDate && d.nextRotationDate) {
    periodLabel = `<div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.83em">
      <span style="color:#a5b4fc;font-weight:700">📅 Current Period:</span>
      <span style="color:#fff;margin-left:6px">${fmtDate(d.lastRotationDate)} — ${fmtDate(d.nextRotationDate)}</span>
    </div>`;
  }

  rEl.innerHTML = `
    ${periodLabel}
    <div style="margin-bottom:10px"><span style="color:var(--muted);font-size:.76em;text-transform:uppercase;font-weight:700">Last Rotation</span>
      <div style="font-weight:700;color:#a5b4fc">${d.lastRotationDate ? fmtDateTime(d.lastRotationDate) : 'Never'}</div></div>
    <div style="margin-bottom:10px"><span style="color:var(--muted);font-size:.76em;text-transform:uppercase;font-weight:700">Next Rotation</span>
      <div style="font-weight:700;color:#a5b4fc">${d.nextRotationDate ? fmtDateTime(d.nextRotationDate) : 'Not scheduled'}</div></div>
    <div style="margin-bottom:14px"><span style="color:var(--muted);font-size:.76em;text-transform:uppercase;font-weight:700">Interval</span>
      <div style="font-weight:700;color:#fff">${d.rotationInterval} days</div></div>
    ${days !== null
      ? `<div style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;font-size:.83em;font-weight:700;background:${days <= 0 ? 'rgba(239,68,68,0.15)' : days <= 3 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'};color:${days <= 0 ? '#fca5a5' : days <= 3 ? '#fde68a' : '#6ee7b7'};border:1px solid ${days <= 0 ? 'rgba(239,68,68,0.3)' : days <= 3 ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}">
          ${days <= 0 ? '⚠️ Rotation overdue!' : '⏳ ' + days + ' day' + (days !== 1 ? 's' : '') + ' until next rotation'}
        </div>`
      : ''}`;

  // Update banner period
  const periodEl = document.getElementById('dashBannerPeriod');
  if (periodEl) {
    periodEl.textContent = (d.lastRotationDate ? fmtDate(d.lastRotationDate) : '01.08.2026') + ' - ' + (d.nextRotationDate ? fmtDate(d.nextRotationDate) : '15.08.2026');
  }

  // Render student lists directly on Dashboard
  const dashListEl = document.getElementById('dashStudentLists');
  if (dashListEl && d.currentRotation && d.currentRotation.length) {
    const girlsDorms = d.currentRotation.filter(dm => (dm.block || '').toLowerCase().includes('girl'));
    const boysDorms  = d.currentRotation.filter(dm => (dm.block || '').toLowerCase().includes('boy'));
    const gc = girlsDorms.reduce((s, dm) => s + (dm.residents || []).length, 0);
    const bc = boysDorms.reduce((s, dm) => s + (dm.residents || []).length, 0);

    let html = '';
    if (girlsDorms.length) html += section('dash-girls', `👧 Girls Section (${gc} Residents)`, gc, girlsDorms.length, girlsDorms, 'girls');
    if (boysDorms.length)  html += section('dash-boys',  `👦 Boys Section (${bc} Residents)`,  bc, boysDorms.length,  boysDorms,  'boys');

    html += `<div class="summary-bar" style="margin-top:20px;">
      <div class="sum-item"><div class="sum-val girls">${gc}</div><div class="sum-lbl">👧 Girls</div></div>
      <div class="sum-item"><div class="sum-val boys">${bc}</div><div class="sum-lbl">👦 Boys</div></div>
      <div class="sum-item"><div class="sum-val total">${gc + bc}</div><div class="sum-lbl">Total</div></div>
      <div class="sum-item"><div class="sum-val" style="color:var(--muted);font-size:1.4em;">${d.dormitories.length}</div><div class="sum-lbl">Rooms</div></div>
    </div>`;

    dashListEl.innerHTML = html;
  } else if (dashListEl) {
    dashListEl.innerHTML = '';
  }
}

// ── DASHBOARD ADMIN LOGIN MODAL ───────────────────────────────────
function openAdminLoginModal() {
  const modal = document.getElementById('adminLoginModal');
  if (modal) modal.classList.add('open');
}
function closeAdminLoginModal() {
  const modal = document.getElementById('adminLoginModal');
  if (modal) modal.classList.remove('open');
}

async function loginAdminFromModal() {
  const btn = document.getElementById('dashAdminSubmitBtn');
  const err = document.getElementById('dashAdminErr');
  const username = (document.getElementById('dashAdminUser')?.value || '').trim();
  const password = document.getElementById('dashAdminPass')?.value || '';
  if (!username || !password) {
    if (err) { err.textContent = '⚠️ Enter username and password'; err.style.display = 'block'; }
    return;
  }
  if (btn) btn.disabled = true;
  if (err) err.style.display = 'none';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin', username, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('dorm_token', data.token);
      localStorage.setItem('dorm_role', 'admin');
      toast('🔐 Admin Logged In Successfully!');
      closeAdminLoginModal();
      window.location.reload();
    } else {
      if (err) { err.textContent = '⚠️ ' + (data.error || 'Login failed'); err.style.display = 'block'; }
    }
  } catch (e) {
    if (err) { err.textContent = '⚠️ Cannot connect to server'; err.style.display = 'block'; }
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ── DORMITORIES ───────────────────────────────────────────────────
async function addDormitory() {
  const name  = v('dormName');
  const cap   = v('dormCapacity');
  const block = v('dormBlock');
  if (!name) return toast('Enter a room name', 'error');
  if (!cap)  return toast('Enter capacity', 'error');
  const r = await api('/api/dormitories', 'POST', { name, capacity: parseInt(cap), block });
  if (r.success) {
    toast(`Room "${name}" added!`);
    set('dormName', ''); set('dormCapacity', ''); set('dormBlock', '');
    await refresh();
  } else toast(r.error || 'Error adding room', 'error');
}

async function deleteDormitory(name) {
  if (!confirm(`Delete room "${name}"? Residents will become unassigned.`)) return;
  const r = await api('/api/dormitories/' + encodeURIComponent(name), 'DELETE');
  if (r.success) { toast('Room deleted', 'info'); await refresh(); }
  else toast('Error deleting room', 'error');
}

function renderDormsTable() {
  const d = STATE;
  const girls = d.dormitories.filter(dm => (dm.block || '').toLowerCase().includes('girl'));
  const boys  = d.dormitories.filter(dm => (dm.block || '').toLowerCase().includes('boy'));

  document.getElementById('girlsDormCount').textContent = girls.length + ' room' + (girls.length !== 1 ? 's' : '');
  document.getElementById('boysDormCount').textContent  = boys.length + ' room' + (boys.length !== 1 ? 's' : '');

  document.getElementById('girlsDormTbody').innerHTML = dormRows(girls, d, 1);
  document.getElementById('boysDormTbody').innerHTML  = dormRows(boys,  d, 1);
}

function dormRows(list, d, startIdx) {
  if (!list.length) return `<tr><td colspan="7">${empty('🏢', 'No rooms in this section')}</td></tr>`;
  return list.map((dm, i) => {
    const rot   = (d.currentRotation || []).find(x => x.name === dm.name);
    const occ   = rot ? (rot.residents || []).length : 0;
    const avail = Math.max(0, dm.capacity - occ);
    const pct   = Math.round((occ / dm.capacity) * 100);
    const col   = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
    return `<tr>
      <td>${startIdx + i}</td>
      <td><strong style="color:#fff">${esc(dm.name)}</strong></td>
      <td>${dm.capacity}</td>
      <td>${occ}</td>
      <td style="color:${avail ? '#34d399' : '#ef4444'};font-weight:700">${avail}</td>
      <td><div class="progress-bg" style="width:80px"><div class="progress-bar" style="width:${pct}%;background:${col}"></div></div> <span style="font-size:.8em;color:var(--muted)">${pct}%</span></td>
      <td><div class="action-cell">
        <button class="btn btn-danger btn-xs" onclick="deleteDormitory('${esc(dm.name)}')">🗑️ Delete</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ── RESIDENTS ─────────────────────────────────────────────────────
async function addResident() {
  const name  = v('resName');
  const id    = v('resId');
  const block = v('resBlock');
  if (!name) return toast('Enter a name', 'error');
  const r = await api('/api/residents', 'POST', { name, id, block });
  if (r.success) {
    toast(`Resident "${name}" added!`);
    set('resName', ''); set('resId', ''); set('resBlock', '');
    await refresh();
  } else toast(r.error || 'Error adding resident', 'error');
}

async function deleteResident(name) {
  if (!confirm(`Remove "${name}"?`)) return;
  const r = await api('/api/residents/' + encodeURIComponent(name), 'DELETE');
  if (r.success) { toast('Resident removed', 'info'); await refresh(); }
  else toast('Error removing resident', 'error');
}

function renderResidents() {
  const d = STATE;
  const fd = (document.getElementById('filterDorm') || {}).value || '';

  // Populate dorm filter
  const sel = document.getElementById('filterDorm');
  if (sel) {
    const cur = sel.value;
    sel.innerHTML = '<option value="">All Rooms</option>' +
      d.dormitories.map(dm => `<option value="${esc(dm.name)}" ${cur === dm.name ? 'selected' : ''}>${esc(dm.name)}</option>`).join('');
  }

  let rows = d.residents;
  if (fd) rows = rows.filter(r => r.dormitory === fd);

  const girls = rows.filter(r => (r.block || '').toLowerCase().includes('girl'));
  const boys  = rows.filter(r => (r.block || '').toLowerCase().includes('boy'));

  document.getElementById('girlsResCount').textContent = girls.length + ' resident' + (girls.length !== 1 ? 's' : '');
  document.getElementById('boysResCount').textContent  = boys.length  + ' resident' + (boys.length  !== 1 ? 's' : '');

  document.getElementById('girlsResTbody').innerHTML = residentRows(girls, 1);
  document.getElementById('boysResTbody').innerHTML  = residentRows(boys, 1);
}

function residentRows(list, startIdx) {
  if (!list.length) return `<tr><td colspan="6">${empty('👥', 'No residents in this section')}</td></tr>`;
  return list.map((r, i) => `<tr>
    <td>${startIdx + i}</td>
    <td><strong style="color:#fff">${esc(r.name)}</strong></td>
    <td><span style="color:var(--muted)">${esc(r.id || '—')}</span></td>
    <td>${r.dormitory || '<span style="color:var(--danger)">Unassigned</span>'}</td>
    <td><span style="color:var(--muted);font-size:.85em">${r.joinedDate ? fmtDate(r.joinedDate) : '—'}</span></td>
    <td><div class="action-cell">
      <button class="btn btn-danger btn-xs" onclick="deleteResident('${esc(r.name)}')">🗑️</button>
    </div></td>
  </tr>`).join('');
}

// ── QUICK ADD MODAL ───────────────────────────────────────────────
function openQuickAdd(type) {
  const overlay = document.getElementById('quickModal');
  const header  = document.getElementById('modalHeader');
  const body    = document.getElementById('modalBody');

  if (type === 'member') {
    header.innerHTML = `<span>➕ Add New Member</span><span class="modal-close" onclick="closeModalDirect()">✕</span>`;
    body.innerHTML = `
      <div class="form-row" style="flex-direction:column;gap:14px">
        <div class="fg">
          <label>Full Name</label>
          <input id="qResName" placeholder="Student full name" onkeydown="if(event.key==='Enter')quickAddResident()">
        </div>
        <div class="fg">
          <label>ID / Roll No.</label>
          <input id="qResId" placeholder="e.g. STU-001">
        </div>
        <div class="fg">
          <label>Gender</label>
          <select id="qResBlock">
            <option value="">— Select —</option>
            <option value="Girls">👧 Female</option>
            <option value="Boys">👦 Male</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px">
          <button class="btn btn-ghost" onclick="closeModalDirect()">Cancel</button>
          <button class="btn btn-primary" onclick="quickAddResident()">➕ Add Member</button>
        </div>
      </div>`;
  } else {
    header.innerHTML = `<span>🏢 Add New Room</span><span class="modal-close" onclick="closeModalDirect()">✕</span>`;
    body.innerHTML = `
      <div class="form-row" style="flex-direction:column;gap:14px">
        <div class="fg">
          <label>Room Name</label>
          <input id="qDormName" placeholder="e.g. Mamma Margaret 101">
        </div>
        <div class="fg">
          <label>Capacity</label>
          <input id="qDormCapacity" type="number" min="1" placeholder="12">
        </div>
        <div class="fg">
          <label>Gender Block</label>
          <select id="qDormBlock">
            <option value="">General</option>
            <option value="Girls">👧 Girls</option>
            <option value="Boys">👦 Boys</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px">
          <button class="btn btn-ghost" onclick="closeModalDirect()">Cancel</button>
          <button class="btn btn-primary" onclick="quickAddRoom()">🏢 Add Room</button>
        </div>
      </div>`;
  }

  overlay.classList.add('open');
}

function closeModal(e) {
  if (e.target === document.getElementById('quickModal')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('quickModal').classList.remove('open');
}

async function quickAddResident() {
  const name  = document.getElementById('qResName')?.value.trim() || '';
  const id    = document.getElementById('qResId')?.value.trim() || '';
  const block = document.getElementById('qResBlock')?.value || '';
  if (!name) return toast('Enter a name', 'error');
  const r = await api('/api/residents', 'POST', { name, id, block });
  if (r.success) {
    toast(`Resident "${name}" added!`);
    closeModalDirect();
    await refresh();
  } else toast(r.error || 'Error adding resident', 'error');
}

async function quickAddRoom() {
  const name  = document.getElementById('qDormName')?.value.trim() || '';
  const cap   = document.getElementById('qDormCapacity')?.value || '';
  const block = document.getElementById('qDormBlock')?.value || '';
  if (!name) return toast('Enter a room name', 'error');
  if (!cap)  return toast('Enter capacity', 'error');
  const r = await api('/api/dormitories', 'POST', { name, capacity: parseInt(cap), block });
  if (r.success) {
    toast(`Room "${name}" added!`);
    closeModalDirect();
    await refresh();
  } else toast(r.error || 'Error adding room', 'error');
}

// ── BULK IMPORT ───────────────────────────────────────────────────
let parsedList = [];

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropZone').classList.remove('over');
  readFile(e.dataTransfer.files[0]);
}
function handleFile(e) { readFile(e.target.files[0]); }

function readFile(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'txt'].includes(ext)) return toast('Only .csv or .txt supported', 'error');
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('pasteArea').value = e.target.result;
    previewNames();
  };
  reader.readAsText(file);
}

function previewNames() {
  const raw = document.getElementById('pasteArea').value;
  parsedList = parseNameText(raw);
  if (!parsedList.length) return toast('No names found', 'error');
  const existing = new Set(STATE.residents.map(r => r.name.toLowerCase()));
  document.getElementById('previewCount').textContent = parsedList.length;
  document.getElementById('previewBody').innerHTML = parsedList.map((r, i) => {
    const dup = existing.has(r.name.toLowerCase());
    return `<tr>
      <td>${i + 1}</td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.id || '—')}</td>
      <td class="${dup ? 'preview-dup' : 'preview-new'}">${dup ? '⚠️ Duplicate' : '✅ New'}</td>
    </tr>`;
  }).join('');
  document.getElementById('previewCard').style.display = 'block';
}

function parseNameText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  const result = [];
  lines.forEach((line, i) => {
    if (i === 0 && /^(name|s\.?n|no\.|sno)/i.test(line.split(',')[0])) return;
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts[0]) result.push({ name: parts[0], id: parts[1] || '' });
  });
  return result;
}

async function importNames() {
  if (!parsedList.length) return toast('Nothing to import', 'error');
  if (!STATE.dormitories.length) return toast('Add at least one room first', 'warn');
  const block = v('impBlock');
  const r = await api('/api/residents/bulk', 'POST', { residents: parsedList, block, autoAssign: true });
  if (r.success) {
    let msg = `✅ ${r.added} added`;
    if (r.skipped) msg += `, ${r.skipped} duplicate(s) skipped`;
    toast(msg);
    clearPreview();
    await refresh();
    showPage('assignments', document.querySelector('[data-page=assignments]'));
  } else toast(r.error || 'Import failed', 'error');
}

function clearPreview() {
  parsedList = [];
  document.getElementById('previewCard').style.display = 'none';
  document.getElementById('pasteArea').value = '';
  document.getElementById('fileInput').value = '';
}

// ── ASSIGNMENTS ───────────────────────────────────────────────────
async function initAssign() {
  if (!STATE.residents.length) return toast('Add residents first', 'error');
  if (!STATE.dormitories.length) return toast('Add rooms first', 'error');
  const r = await api('/api/initialize-rotation', 'POST');
  if (r.success) { toast('✅ All residents assigned!'); await refresh(); }
  else toast(r.error || 'Error assigning', 'error');
}

async function rotateNow() {
  if (!STATE.currentRotation) return toast('Run Auto-Assign first', 'warn');
  if (!confirm('Rotate all residents to new rooms now?')) return;
  const r = await api('/api/rotate', 'POST');
  if (r.success) {
    toast('🔄 Rotation complete!', 'info');
    await refresh();
    showPage('assignments', document.querySelector('[data-page=assignments]'));
  } else toast(r.error || 'Rotation failed', 'error');
}

function renderAssignments() {
  const d = STATE;
  const el = document.getElementById('assignView');
  if (!d.currentRotation || !d.currentRotation.length) {
    el.innerHTML = `<div class="card">${empty('📋', 'No assignments yet. Add rooms &amp; residents, then click <strong>🚀 Auto-Assign All</strong>')}</div>`;
    return;
  }

  const girls = d.currentRotation.filter(dm => (dm.block || '').toLowerCase().includes('girl'));
  const boys  = d.currentRotation.filter(dm => (dm.block || '').toLowerCase().includes('boy'));
  const other = d.currentRotation.filter(dm => !girls.includes(dm) && !boys.includes(dm));

  const gc = girls.reduce((s, dm) => s + (dm.residents || []).length, 0);
  const bc = boys.reduce((s, dm) => s + (dm.residents || []).length, 0);
  const oc = other.reduce((s, dm) => s + (dm.residents || []).length, 0);

  // Current period label
  let periodBanner = '';
  if (d.lastRotationDate && d.nextRotationDate) {
    const daysRemain = daysLeft(d.nextRotationDate);
    periodBanner = `<div style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:14px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-family:Outfit,sans-serif;font-size:.85em;font-weight:700;color:#a5b4fc">📅 Current Rotation Period</div>
        <div style="font-size:1.05em;font-weight:700;color:#fff;margin-top:4px">${fmtDate(d.lastRotationDate)} — ${fmtDate(d.nextRotationDate)}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:.78em;color:var(--muted)">Next auto-rotation in</div>
        <div style="font-size:1.4em;font-weight:800;color:${daysRemain <= 0 ? '#fca5a5' : daysRemain <= 3 ? '#fde68a' : '#6ee7b7'}">${daysRemain <= 0 ? '⚠️ Overdue!' : daysRemain + ' days'}</div>
      </div>
    </div>`;
  }

  let html = periodBanner;
  if (girls.length) html += section('girls', `👧 Girls Section`, gc, girls.length, girls, 'girls');
  if (boys.length)  html += section('boys',  `👦 Boys Section`,  bc, boys.length,  boys,  'boys');
  if (other.length) html += section('other', `🏢 Other Rooms`,   oc, other.length, other, 'other');

  html += `<div class="summary-bar">
    ${gc ? `<div class="sum-item"><div class="sum-val girls">${gc}</div><div class="sum-lbl">👧 Girls</div></div>` : ''}
    ${bc ? `<div class="sum-item"><div class="sum-val boys">${bc}</div><div class="sum-lbl">👦 Boys</div></div>` : ''}
    ${oc ? `<div class="sum-item"><div class="sum-val" style="color:#a78bfa">${oc}</div><div class="sum-lbl">🏢 Other</div></div>` : ''}
    <div class="sum-item"><div class="sum-val total">${gc + bc + oc}</div><div class="sum-lbl">Total</div></div>
    <div class="sum-item"><div class="sum-val" style="color:var(--muted);font-size:1.4em">${d.dormitories.length}</div><div class="sum-lbl">Rooms</div></div>
  </div>`;

  el.innerHTML = html;
}

function section(id, label, count, rooms, list, cls) {
  return `<div class="gender-sec">
    <div class="gender-hdr ${cls}">
      <span>${label}</span>
      <span class="gh-meta">${count} resident${count !== 1 ? 's' : ''} · ${rooms} room${rooms !== 1 ? 's' : ''}</span>
    </div>
    <div class="dorms-grid">
      ${list.map(dm => dormCard(dm, cls)).join('')}
    </div>
  </div>`;
}

function dormCard(dm, cls) {
  const occ = (dm.residents || []).length;
  const pct = dm.capacity ? Math.min(100, Math.round((occ / dm.capacity) * 100)) : 0;
  return `<div class="dorm-card ${cls}">
    <h3>🏢 ${esc(dm.name)}</h3>
    <div class="dm-sub">Capacity: ${dm.capacity} &nbsp;·&nbsp; Occupied: ${occ}</div>
    <div class="dorm-bar-bg"><div class="dorm-bar" style="width:${pct}%"></div></div>
    <ul>
      ${occ
        ? (dm.residents || []).map((r, i) => formatResidentItem(r, i)).join('')
        : '<li style="opacity:.6;font-style:italic">No residents</li>'}
    </ul>
  </div>`;
}

function formatResidentItem(r, i) {
  const isLeader = r.includes(' - Leader');
  const isAssLeader = r.includes(' - Ass. Leader');
  if (isLeader) {
    const name = r.replace(' - Leader', '');
    return `<li><span class="li-num">${i + 1}.</span><strong style="color:#f43f5e;font-weight:800">${esc(name)}</strong> <span class="role-badge leader">— Leader</span></li>`;
  }
  if (isAssLeader) {
    const name = r.replace(' - Ass. Leader', '');
    return `<li><span class="li-num">${i + 1}.</span><strong style="color:#6366f1;font-weight:700">${esc(name)}</strong> <span class="role-badge ass-leader">— Ass. Leader</span></li>`;
  }
  return `<li><span class="li-num">${i + 1}.</span>${esc(r)}</li>`;
}

// ── HISTORY ───────────────────────────────────────────────────────
async function renderHistory() {
  try {
    const hist = await (await fetch('/api/history', { headers: { 'x-auth-token': TOKEN } })).json();
    const el = document.getElementById('historyView');
    if (!hist.history || !hist.history.length) {
      el.innerHTML = empty('🕒', 'No rotation history yet');
      return;
    }
    el.innerHTML = hist.history.map((entry, i) => {
      const id = 'hbody' + i;
      const girls = (entry.rotation || []).filter(dm => (dm.block || '').toLowerCase().includes('girl'));
      const boys  = (entry.rotation || []).filter(dm => (dm.block || '').toLowerCase().includes('boy'));
      const other = (entry.rotation || []).filter(dm => !girls.includes(dm) && !boys.includes(dm));
      return `<div class="history-entry">
        <div class="history-date-bar" onclick="toggleHistory('${id}')">
          <span>Rotation #${hist.history.length - i} &nbsp;—&nbsp; ${fmtDateTime(entry.date)}</span>
          <small>${entry.auto ? '🤖 Automatic' : '👆 Manual'}</small>
        </div>
        <div class="history-body" id="${id}">
          <div class="dorms-grid" style="margin-bottom:12px">
            ${girls.map(dm => dormCard(dm, 'girls')).join('')}
            ${boys.map(dm => dormCard(dm, 'boys')).join('')}
            ${other.map(dm => dormCard(dm, 'other')).join('')}
          </div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    document.getElementById('historyView').innerHTML = '<p style="color:#ef4444">Error loading history</p>';
  }
}

function toggleHistory(id) {
  document.getElementById(id).classList.toggle('open');
}

// ── SETTINGS ──────────────────────────────────────────────────────
function renderSettings() {
  if (STATE) document.getElementById('rotInterval').value = STATE.rotationInterval || 15;
}

async function saveSettings() {
  const val = parseInt(document.getElementById('rotInterval').value);
  if (!val || val < 1) return toast('Enter a valid interval', 'error');
  const r = await api('/api/settings', 'POST', { rotationInterval: val });
  if (r.success) { toast(`Interval set to ${val} days`); await refresh(); }
  else toast(r.error || 'Error saving', 'error');
}

async function changePassword() {
  const newPass = document.getElementById('newPass')?.value || '';
  if (newPass.length < 4) return toast('Password must be at least 4 characters', 'error');
  const r = await api('/api/change-password', 'POST', { newPassword: newPass });
  if (r.success) { toast('Password updated!'); document.getElementById('newPass').value = ''; }
  else toast(r.error || 'Error updating password', 'error');
}

async function changeAdminUsername() {
  const newUsername = document.getElementById('newAdminUser')?.value.trim() || '';
  if (newUsername.length < 3) return toast('Username must be at least 3 characters', 'error');
  const r = await api('/api/change-username', 'POST', { newUsername });
  if (r.success) {
    toast(`Admin username updated to "${r.username}"!`);
    document.getElementById('newAdminUser').value = '';
  } else toast(r.error || 'Error updating username', 'error');
}

async function clearAllData() {
  if (!confirm('⚠️ Delete ALL dormitories, residents, assignments, and history?\n\nThis CANNOT be undone.')) return;
  const r = await api('/api/clear', 'POST');
  if (r.success) { toast('All data cleared', 'info'); await refresh(); }
}

// ── LIVE SHARE & SCANNER ──────────────────────────────────────────
function renderShare() {
  const shareUrl = window.location.origin + '/';
  const input = document.getElementById('shareUrlInput');
  if (input) input.value = shareUrl;
  const qrImg = document.getElementById('qrImage');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`;
  }
}

function copyShareLink() {
  const input = document.getElementById('shareUrlInput');
  if (input) {
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
      toast('📋 Share link copied to clipboard!');
    }).catch(() => {
      toast('Link: ' + input.value);
    });
  }
}

let scannerStream = null;
async function openScannerModal() {
  const modal = document.getElementById('scannerModal');
  const video = document.getElementById('scannerVideo');
  const status = document.getElementById('scannerStatus');
  if (modal) modal.classList.add('open');
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (video) video.srcObject = scannerStream;
      if (status) status.textContent = '🎥 Camera active. Scanning...';
    } catch (e) {
      if (status) status.textContent = '⚠️ Camera permission denied or unsupported.';
    }
  } else {
    if (status) status.textContent = '⚠️ Camera API not supported in this browser.';
  }
}

function closeScannerModal() {
  const modal = document.getElementById('scannerModal');
  const video = document.getElementById('scannerVideo');
  if (modal) modal.classList.remove('open');
  if (scannerStream) {
    scannerStream.getTracks().forEach(track => track.stop());
    scannerStream = null;
  }
  if (video) video.srcObject = null;
}

// ── DOWNLOAD & EXPORT ─────────────────────────────────────────────
function downloadCSV() {
  const d = STATE;
  if (!d) return toast('Data loading...', 'error');
  let csv = 'Room Name,Block/Gender,Capacity,Resident Name,Resident ID,Joined Date\n';
  d.dormitories.forEach(dm => {
    const rot = (d.currentRotation || []).find(x => x.name === dm.name);
    const residents = rot ? (rot.residents || []) : [];
    if (!residents.length) {
      csv += `"${dm.name}","${dm.block||''}",${dm.capacity},"(empty)","",""\n`;
    } else {
      residents.forEach(rName => {
        const r = (d.residents || []).find(x => x.name === rName);
        csv += `"${dm.name}","${dm.block||''}",${dm.capacity},"${rName}","${r?.id||''}","${r?.joinedDate ? new Date(r.joinedDate).toLocaleDateString() : ''}"\n`;
      });
    }
  });
  triggerDownload(csv, 'don_bosco_hostel_assignments.csv', 'text/csv');
  toast('📊 CSV downloaded!');
}

function downloadExcel() {
  const d = STATE;
  if (!d) return toast('Data loading...', 'error');
  let html = '<html><head><meta charset="UTF-8"></head><body>';
  html += '<h2>Don Bosco Skill Mission — Hostel Room Assignments</h2>';
  html += `<p>Period: ${d.lastRotationDate ? fmtDate(d.lastRotationDate) : '01.08.2026'} — ${d.nextRotationDate ? fmtDate(d.nextRotationDate) : '15.08.2026'}</p>`;
  html += '<table border="1"><thead><tr><th>Room Name</th><th>Gender/Block</th><th>Capacity</th><th>Resident Name</th><th>Resident ID</th></tr></thead><tbody>';
  d.dormitories.forEach(dm => {
    const rot = (d.currentRotation || []).find(x => x.name === dm.name);
    const residents = rot ? (rot.residents || []) : [];
    if (!residents.length) {
      html += `<tr><td>${dm.name}</td><td>${dm.block||''}</td><td>${dm.capacity}</td><td colspan="2" style="color:gray;font-style:italic">Empty</td></tr>`;
    } else {
      residents.forEach((rName, i) => {
        const r = (d.residents || []).find(x => x.name === rName);
        html += `<tr><td>${i===0 ? dm.name : ''}</td><td>${i===0 ? (dm.block||'') : ''}</td><td>${i===0 ? dm.capacity : ''}</td><td>${rName}</td><td>${r?.id||''}</td></tr>`;
      });
    }
  });
  html += '</tbody></table></body></html>';
  triggerDownload(html, 'don_bosco_hostel_assignments.xls', 'application/vnd.ms-excel');
  toast('📗 Excel downloaded!');
}

function downloadJSON() {
  const d = STATE;
  if (!d) return toast('Data loading...', 'error');
  triggerDownload(JSON.stringify(d, null, 2), 'don_bosco_dormitory_backup.json', 'application/json');
  toast('📦 JSON backup downloaded!');
}

function triggerDownload(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openPrintablePoster() {
  const d = STATE;
  if (!d) return toast('Data loading...', 'error');

  const girls = (d.currentRotation || []).filter(dm => (dm.block || '').toLowerCase().includes('girl'));
  const boys  = (d.currentRotation || []).filter(dm => (dm.block || '').toLowerCase().includes('boy'));

  const gc = girls.reduce((s, dm) => s + (dm.residents || []).length, 0);
  const bc = boys.reduce((s, dm) => s + (dm.residents || []).length, 0);

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Don Bosco Skill Mission — Dormitory List Poster</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #0f172a; }
        .poster { max-width: 1200px; margin: 0 auto; background: #fff; border-radius: 20px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
        .hdr { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; padding: 20px 30px; border-radius: 16px; margin-bottom: 24px; }
        .hdr h1 { font-family: 'Outfit', sans-serif; font-size: 2.2em; font-weight: 900; margin: 0; letter-spacing: 1px; }
        .hdr .date { font-size: 1.1em; font-weight: 700; background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; }
        .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .sec-hdr { font-family: 'Outfit', sans-serif; font-size: 1.3em; font-weight: 800; padding: 12px 18px; border-radius: 12px; margin-bottom: 16px; color: #fff; }
        .sec-hdr.girls { background: linear-gradient(135deg, #e11d48, #ec4899); }
        .sec-hdr.boys  { background: linear-gradient(135deg, #2563eb, #4f46e5); }
        .card { background: #f1f5f9; border-radius: 14px; padding: 16px; margin-bottom: 16px; border: 1.5px solid #e2e8f0; }
        .card.girls { border-left: 5px solid #e11d48; }
        .card.boys  { border-left: 5px solid #2563eb; }
        .card h3 { font-family: 'Outfit', sans-serif; font-size: 1.1em; margin: 0 0 10px; color: #1e293b; }
        .card ol { margin: 0; padding-left: 20px; }
        .card li { font-size: 0.9em; padding: 3px 0; font-weight: 500; }
        .card li.leader { color: #dc2626; font-weight: 700; }
        .card li.ass-leader { color: #4f46e5; font-weight: 700; }
        .sum-box { margin-top: 24px; background: #0f172a; color: #fff; padding: 20px; border-radius: 16px; display: flex; justify-content: space-around; text-align: center; }
        .sum-val { font-family: 'Outfit', sans-serif; font-size: 2em; font-weight: 800; }
        @media print { body { background: #fff; padding: 0; } .poster { box-shadow: none; border-radius: 0; } }
      </style>
    </head>
    <body>
      <div class="poster">
        <div class="hdr">
          <div>
            <h1>DON BOSCO SKILL MISSION</h1>
            <div style="font-size:0.9em;opacity:0.9;margin-top:4px;">DORMITORY LIST</div>
          </div>
          <div class="date">${d.lastRotationDate ? fmtDate(d.lastRotationDate) : '01.08.2026'} — ${d.nextRotationDate ? fmtDate(d.nextRotationDate) : '15.08.2026'}</div>
        </div>

        <div class="cols">
          <div>
            <div class="sec-hdr girls">👧 GIRLS SECTION (${gc} Residents)</div>
            ${girls.map(dm => `
              <div class="card girls">
                <h3>${esc(dm.name)} (${(dm.residents||[]).length}/${dm.capacity})</h3>
                <ol>
                  ${(dm.residents||[]).map(r => {
                    const isL = r.includes(' - Leader');
                    const isAL = r.includes(' - Ass. Leader');
                    return `<li class="${isL ? 'leader' : isAL ? 'ass-leader' : ''}">${esc(r)}</li>`;
                  }).join('')}
                </ol>
              </div>
            `).join('')}
          </div>

          <div>
            <div class="sec-hdr boys">👦 BOYS SECTION (${bc} Residents)</div>
            ${boys.map(dm => `
              <div class="card boys">
                <h3>${esc(dm.name)} (${(dm.residents||[]).length}/${dm.capacity})</h3>
                <ol>
                  ${(dm.residents||[]).map(r => {
                    const isL = r.includes(' - Leader');
                    const isAL = r.includes(' - Ass. Leader');
                    return `<li class="${isL ? 'leader' : isAL ? 'ass-leader' : ''}">${esc(r)}</li>`;
                  }).join('')}
                </ol>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="sum-box">
          <div><div class="sum-val" style="color:#fb7185">${gc}</div><div>Girls</div></div>
          <div><div class="sum-val" style="color:#60a5fa">${bc}</div><div>Boys</div></div>
          <div><div class="sum-val" style="color:#38bdf8">${gc + bc}</div><div>TOTAL</div></div>
        </div>
      </div>
      <script>window.onload = () => window.print();</script>
    </body>
    </html>
  `);
  win.document.close();
}

// ── HELPERS ───────────────────────────────────────────────────────
const v   = id => document.getElementById(id)?.value.trim() || '';
const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate     = iso => new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const fmtDateTime = iso => new Date(iso).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
const daysLeft    = iso => Math.ceil((new Date(iso) - new Date()) / 86400000);
const empty = (icon, msg) => `<div class="empty"><span class="e-icon">${icon}</span><p>${msg}</p></div>`;

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.display = 'none', 3800);
}
