/* ═══════════════════════════════════════════════════
   Hostel Dormitory Manager — Client App
   ═══════════════════════════════════════════════════ */

let STATE = null;  // cached server state

// ── BOOT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  refresh();
  setInterval(refresh, 30000); // keep UI in sync every 30s
});

// ── DATA ──────────────────────────────────────────────────────────
async function refresh() {
  try {
    const res = await fetch('/api/data');
    STATE = await res.json();
    renderCurrentPage();
    updateSidebar();
  } catch (e) {
    toast('Cannot reach server', 'error');
  }
}

async function api(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

// ── NAVIGATION ────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:   '📊 Dashboard',
  dormitories: '🏢 Dormitories',
  residents:   '👥 Residents',
  import:      '📂 Bulk Import',
  assignments: '📋 Room Assignments',
  history:     '🕒 Rotation History',
  settings:    '⚙️ Settings',
};

let currentPage = 'dashboard';

function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
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
    case 'history':     renderHistory();     break;
    case 'settings':    renderSettings();    break;
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

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-icon purple">🏢</div><div><div class="stat-val">${d.dormitories.length}</div><div class="stat-lbl">Total Rooms</div></div></div>
    <div class="stat-card"><div class="stat-icon blue">👥</div><div><div class="stat-val">${d.residents.length}</div><div class="stat-lbl">Total Residents</div></div></div>
    <div class="stat-card"><div class="stat-icon pink">👧</div><div><div class="stat-val">${girls.length}</div><div class="stat-lbl">Girls</div></div></div>
    <div class="stat-card"><div class="stat-icon blue">👦</div><div><div class="stat-val">${boys.length}</div><div class="stat-lbl">Boys</div></div></div>
    <div class="stat-card"><div class="stat-icon green">✅</div><div><div class="stat-val">${d.residents.length - unassigned.length}</div><div class="stat-lbl">Assigned</div></div></div>
    <div class="stat-card"><div class="stat-icon orange">⚠️</div><div><div class="stat-val">${unassigned.length}</div><div class="stat-lbl">Unassigned</div></div></div>`;

  // Occupancy bars
  const oEl = document.getElementById('dashOccupancy');
  if (!d.dormitories.length) {
    oEl.innerHTML = empty('🏢', 'No rooms added yet');
  } else {
    oEl.innerHTML = d.dormitories.map(dm => {
      const rot = (d.currentRotation || []).find(x => x.name === dm.name);
      const cnt = rot ? (rot.residents || []).length : 0;
      const pct = Math.round((cnt / dm.capacity) * 100);
      const col = pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#16a34a';
      return `<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:.83em;margin-bottom:4px">
          <span><strong>${dm.name}</strong> <span style="color:var(--text-muted);font-size:.9em">${dm.block ? '(' + dm.block + ')' : ''}</span></span>
          <span style="font-weight:700;color:${col}">${cnt}/${dm.capacity}</span>
        </div>
        <div class="progress-bg"><div class="progress-bar" style="width:${pct}%;background:${col}"></div></div>
      </div>`;
    }).join('');
  }

  // Rotation info
  const rEl = document.getElementById('dashRotation');
  const days = d.nextRotationDate ? daysLeft(d.nextRotationDate) : null;
  rEl.innerHTML = `
    <div style="margin-bottom:10px"><span style="color:var(--text-muted);font-size:.8em;text-transform:uppercase;font-weight:600">Last Rotation</span>
      <div style="font-weight:700;color:var(--primary)">${d.lastRotationDate ? fmtDateTime(d.lastRotationDate) : 'Never'}</div></div>
    <div style="margin-bottom:10px"><span style="color:var(--text-muted);font-size:.8em;text-transform:uppercase;font-weight:600">Next Rotation</span>
      <div style="font-weight:700;color:var(--primary)">${d.nextRotationDate ? fmtDateTime(d.nextRotationDate) : 'Not scheduled'}</div></div>
    <div style="margin-bottom:10px"><span style="color:var(--text-muted);font-size:.8em;text-transform:uppercase;font-weight:600">Interval</span>
      <div style="font-weight:700">${d.rotationInterval} days &nbsp;·&nbsp; ${d.rotationCount || 0} rotation(s) done</div></div>
    ${days !== null
      ? `<div style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:20px;font-size:.84em;font-weight:700;background:${days <= 0 ? '#fee2e2' : days <= 3 ? '#fef9c3' : '#dcfce7'};color:${days <= 0 ? '#b91c1c' : days <= 3 ? '#92400e' : '#15803d'}">
          ${days <= 0 ? '⚠️ Rotation overdue!' : '⏳ ' + days + ' day' + (days !== 1 ? 's' : '') + ' until next rotation'}
        </div>`
      : ''}`;
}

// ── DORMITORIES ───────────────────────────────────────────────────
async function addDormitory() {
  const name = v('dormName');
  const cap  = v('dormCapacity');
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
  document.getElementById('dormCount').textContent = d.dormitories.length;
  const tb = document.getElementById('dormTbody');
  if (!d.dormitories.length) {
    tb.innerHTML = `<tr><td colspan="8">${empty('🏢', 'No rooms yet — add one above')}</td></tr>`;
    return;
  }
  tb.innerHTML = d.dormitories.map((dm, i) => {
    const rot = (d.currentRotation || []).find(x => x.name === dm.name);
    const occ = rot ? (rot.residents || []).length : 0;
    const avail = Math.max(0, dm.capacity - occ);
    const pct = Math.round((occ / dm.capacity) * 100);
    const col = pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#16a34a';
    const bCls = (dm.block || '').toLowerCase().includes('girl') ? 'badge-girls'
               : (dm.block || '').toLowerCase().includes('boy')  ? 'badge-boys' : 'badge-general';
    return `<tr>
      <td>${i + 1}</td>
      <td><strong>${esc(dm.name)}</strong></td>
      <td><span class="badge ${bCls}">${dm.block || 'General'}</span></td>
      <td>${dm.capacity}</td>
      <td>${occ}</td>
      <td style="color:${avail ? '#16a34a' : '#dc2626'};font-weight:700">${avail}</td>
      <td><div class="progress-bg" style="width:80px"><div class="progress-bar" style="width:${pct}%;background:${col}"></div></div></td>
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
  const fb = (document.getElementById('filterBlock') || {}).value || '';
  const fd = (document.getElementById('filterDorm')  || {}).value || '';
  let rows = d.residents;
  if (fb) rows = rows.filter(r => (r.block || '') === fb);
  if (fd) rows = rows.filter(r => r.dormitory === fd);

  document.getElementById('resCount').textContent = `${rows.length} / ${d.residents.length}`;

  // Populate dorm filter
  const sel = document.getElementById('filterDorm');
  if (sel) {
    const cur = sel.value;
    sel.innerHTML = '<option value="">All Rooms</option>' +
      d.dormitories.map(dm => `<option value="${esc(dm.name)}" ${cur === dm.name ? 'selected' : ''}>${esc(dm.name)}</option>`).join('');
  }

  const tb = document.getElementById('resTbody');
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="7">${empty('👥', 'No residents found')}</td></tr>`;
    return;
  }
  tb.innerHTML = rows.map((r, i) => {
    const bCls = (r.block || '').toLowerCase().includes('girl') ? 'badge-girls'
               : (r.block || '').toLowerCase().includes('boy')  ? 'badge-boys' : 'badge-general';
    return `<tr>
      <td>${i + 1}</td>
      <td><strong>${esc(r.name)}</strong></td>
      <td>${esc(r.id || '—')}</td>
      <td><span class="badge ${bCls}">${r.block || '—'}</span></td>
      <td>${r.dormitory || '<span style="color:var(--danger)">Unassigned</span>'}</td>
      <td>${r.joinedDate ? fmtDate(r.joinedDate) : '—'}</td>
      <td><div class="action-cell">
        <button class="btn btn-danger btn-xs" onclick="deleteResident('${esc(r.name)}')">🗑️</button>
      </div></td>
    </tr>`;
  }).join('');
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
    // Skip header lines
    if (i === 0 && /^(name|s\.?n|no\.|sno)/i.test(line.split(',')[0])) return;
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts[0]) result.push({ name: parts[0], id: parts[1] || '' });
  });
  return result;
}

async function importNames() {
  if (!parsedList.length) return toast('Nothing to import', 'error');
  if (!STATE.dormitories.length)
    return toast('Add at least one dormitory/room first, then import', 'warn');

  const block = v('impBlock');
  const r = await api('/api/residents/bulk', 'POST', {
    residents: parsedList,
    block,
    autoAssign: true
  });
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
  if (r.success) {
    toast('✅ All residents assigned!');
    await refresh();
  } else toast(r.error || 'Error assigning', 'error');
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

  let html = '';
  if (girls.length) html += section('girls', `👧 Girls Section`, gc, girls.length, girls, 'girls');
  if (boys.length)  html += section('boys',  `👦 Boys Section`,  bc, boys.length,  boys,  'boys');
  if (other.length) html += section('other', `🏢 Other Rooms`,   oc, other.length, other, 'other');

  html += `<div class="summary-bar">
    ${gc ? `<div class="sum-item"><div class="sum-val girls">${gc}</div><div class="sum-lbl">👧 Girls</div></div>` : ''}
    ${bc ? `<div class="sum-item"><div class="sum-val boys">${bc}</div><div class="sum-lbl">👦 Boys</div></div>` : ''}
    ${oc ? `<div class="sum-item"><div class="sum-val" style="color:#7c3aed">${oc}</div><div class="sum-lbl">🏢 Other</div></div>` : ''}
    <div class="sum-item"><div class="sum-val total">${gc + bc + oc}</div><div class="sum-lbl">Total</div></div>
    <div class="sum-item"><div class="sum-val" style="color:var(--text-muted);font-size:1.4em">${d.dormitories.length}</div><div class="sum-lbl">Rooms</div></div>
  </div>`;

  el.innerHTML = html;
}

function section(id, label, count, rooms, list, cls) {
  return `<div class="gender-sec">
    <div class="gender-hdr ${cls}">
      <span>${label}</span>
      <span class="gh-meta">${count} residents · ${rooms} room${rooms !== 1 ? 's' : ''}</span>
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
        ? (dm.residents || []).map((r, i) => `<li><span class="li-num">${i + 1}.</span>${esc(r)}</li>`).join('')
        : '<li style="opacity:.7;font-style:italic">No residents</li>'}
    </ul>
  </div>`;
}

// ── HISTORY ───────────────────────────────────────────────────────
async function renderHistory() {
  try {
    const hist = await (await fetch('/api/history')).json();
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
    document.getElementById('historyView').innerHTML = '<p style="color:red">Error loading history</p>';
  }
}

function toggleHistory(id) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
}

// ── SETTINGS ──────────────────────────────────────────────────────
function renderSettings() {
  if (STATE) document.getElementById('rotInterval').value = STATE.rotationInterval || 15;
}

async function saveSettings() {
  const v = parseInt(document.getElementById('rotInterval').value);
  if (!v || v < 1) return toast('Enter a valid interval', 'error');
  const r = await api('/api/settings', 'POST', { rotationInterval: v });
  if (r.success) { toast(`Interval set to ${v} days`); await refresh(); }
  else toast(r.error || 'Error saving', 'error');
}

async function clearAllData() {
  if (!confirm('⚠️ Delete ALL dormitories, residents, assignments, and history?\n\nThis CANNOT be undone.')) return;
  const r = await api('/api/clear', 'POST');
  if (r.success) { toast('All data cleared', 'info'); await refresh(); }
}

// ── HELPERS ───────────────────────────────────────────────────────
const v   = id => document.getElementById(id)?.value.trim() || '';
const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate     = iso => new Date(iso).toLocaleDateString();
const fmtDateTime = iso => new Date(iso).toLocaleString();
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
