const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'dormitory_data.json');
const HISTORY_FILE = path.join(DATA_DIR, 'rotation_history.json');

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// ─── DATA HELPERS ───────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function initFiles() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      dormitories: [],
      residents: [],
      currentRotation: null,
      lastRotationDate: null,
      nextRotationDate: null,
      rotationInterval: 15,
      rotationCount: 0
    }, null, 2));
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify({ history: [] }, null, 2));
  }
}

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return null; }
}

function writeData(d) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); return true; }
  catch { return false; }
}

function readHistory() {
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); }
  catch { return { history: [] }; }
}

function writeHistory(h) {
  try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2)); return true; }
  catch { return false; }
}

function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ─── ROTATION LOGIC ──────────────────────────────────────────────
function buildRotation(residents, dormitories) {
  // Distribute residents across dormitories respecting capacity
  const dorms = dormitories.map(d => ({ ...d, residents: [] }));
  const pool = [...residents];

  pool.forEach((resident, i) => {
    // Try to fill same gender block first, then any with space
    let target = dorms.find(d =>
      (d.block || '').toLowerCase() === (resident.block || '').toLowerCase() &&
      d.residents.length < d.capacity
    );
    if (!target) target = dorms.find(d => d.residents.length < d.capacity);
    if (!target) target = dorms[i % dorms.length]; // overflow fallback

    resident.dormitory = target.name;
    target.residents.push(resident.name);
  });

  return { residents: pool, rotation: dorms };
}

function performRotation(auto = false) {
  const data = readData();
  if (!data || !data.residents.length || !data.dormitories.length) {
    console.log('[Rotation] Skipped — no residents or dormitories.');
    return false;
  }

  // Archive current rotation
  if (data.currentRotation) {
    const hist = readHistory();
    hist.history.unshift({
      date: data.lastRotationDate || new Date().toISOString(),
      rotation: JSON.parse(JSON.stringify(data.currentRotation)),
      auto
    });
    if (hist.history.length > 50) hist.history = hist.history.slice(0, 50);
    writeHistory(hist);
  }

  // Shift residents: each resident moves to next dormitory in list
  const names = data.dormitories.map(d => d.name);
  data.residents.forEach(r => {
    const ci = names.indexOf(r.dormitory);
    r.dormitory = names[(ci + 1) % names.length];
  });

  // Rebuild rotation map
  const dorms = data.dormitories.map(d => ({ ...d, residents: [] }));
  data.residents.forEach(r => {
    const dm = dorms.find(x => x.name === r.dormitory);
    if (dm) dm.residents.push(r.name);
  });

  const now = new Date().toISOString();
  data.currentRotation = dorms;
  data.lastRotationDate = now;
  data.nextRotationDate = addDays(now, data.rotationInterval);
  data.rotationCount = (data.rotationCount || 0) + 1;

  writeData(data);
  console.log(`[Rotation] #${data.rotationCount} done (${auto ? 'auto' : 'manual'}). Next: ${data.nextRotationDate}`);
  return true;
}

function checkAutoRotation() {
  const data = readData();
  if (!data || !data.nextRotationDate) return;
  if (new Date() >= new Date(data.nextRotationDate)) {
    console.log('[Rotation] Auto-rotation triggered.');
    performRotation(true);
  }
}

// ─── API ─────────────────────────────────────────────────────────

// GET full state
app.get('/api/data', (req, res) => {
  res.json(readData());
});

// GET history
app.get('/api/history', (req, res) => {
  res.json(readHistory());
});

// POST add dormitory
app.post('/api/dormitories', (req, res) => {
  const data = readData();
  const { name, capacity, block } = req.body;
  if (!name || !capacity) return res.status(400).json({ error: 'Name and capacity are required' });
  if (data.dormitories.some(d => d.name.toLowerCase() === name.toLowerCase()))
    return res.status(400).json({ error: 'Dormitory already exists' });

  data.dormitories.push({ name: name.trim(), capacity: parseInt(capacity), block: block || '' });
  writeData(data);
  res.json({ success: true });
});

// DELETE dormitory
app.delete('/api/dormitories/:name', (req, res) => {
  const data = readData();
  const name = decodeURIComponent(req.params.name);
  data.dormitories = data.dormitories.filter(d => d.name !== name);
  data.residents = data.residents.map(r => {
    if (r.dormitory === name) r.dormitory = null;
    return r;
  });
  if (data.currentRotation) data.currentRotation = data.currentRotation.filter(d => d.name !== name);
  writeData(data);
  res.json({ success: true });
});

// POST add single resident
app.post('/api/residents', (req, res) => {
  const data = readData();
  const { name, id, block } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (data.residents.some(r => r.name.toLowerCase() === name.toLowerCase()))
    return res.status(400).json({ error: 'Resident already exists' });

  data.residents.push({
    name: name.trim(),
    id: (id || '').trim(),
    block: block || '',
    dormitory: null,
    joinedDate: new Date().toISOString()
  });
  writeData(data);
  res.json({ success: true });
});

// POST bulk import residents
app.post('/api/residents/bulk', (req, res) => {
  const data = readData();
  const { residents, block, autoAssign } = req.body; // residents: [{name, id?}]
  if (!Array.isArray(residents) || !residents.length)
    return res.status(400).json({ error: 'No residents provided' });

  let added = 0, skipped = 0;
  const newResidents = [];
  residents.forEach(r => {
    const name = (r.name || '').trim();
    if (!name) return;
    if (data.residents.some(x => x.name.toLowerCase() === name.toLowerCase())) {
      skipped++; return;
    }
    const entry = {
      name,
      id: (r.id || '').trim(),
      block: block || '',
      dormitory: null,
      joinedDate: new Date().toISOString()
    };
    data.residents.push(entry);
    newResidents.push(entry);
    added++;
  });

  if (autoAssign && data.dormitories.length) {
    // Assign unassigned residents
    const unassigned = data.residents.filter(r => !r.dormitory);
    const dorms = data.dormitories.map(d => {
      const existing = data.currentRotation?.find(x => x.name === d.name);
      return { ...d, residents: existing ? [...(existing.residents || [])] : [] };
    });

    unassigned.forEach(r => {
      let target = dorms.find(d =>
        (!block || (d.block || '').toLowerCase() === block.toLowerCase()) &&
        d.residents.length < d.capacity
      );
      if (!target) target = dorms.find(d => d.residents.length < d.capacity);
      if (!target) return;
      r.dormitory = target.name;
      target.residents.push(r.name);
    });

    const now = new Date().toISOString();
    data.currentRotation = dorms;
    data.lastRotationDate = now;
    data.nextRotationDate = addDays(now, data.rotationInterval);
    data.rotationCount = (data.rotationCount || 0) + 1;
  }

  writeData(data);
  res.json({ success: true, added, skipped });
});

// DELETE resident
app.delete('/api/residents/:name', (req, res) => {
  const data = readData();
  const name = decodeURIComponent(req.params.name);
  data.residents = data.residents.filter(r => r.name !== name);
  if (data.currentRotation) {
    data.currentRotation.forEach(d => {
      d.residents = (d.residents || []).filter(r => r !== name);
    });
  }
  writeData(data);
  res.json({ success: true });
});

// POST initialize / auto-assign
app.post('/api/initialize-rotation', (req, res) => {
  const data = readData();
  if (!data.residents.length || !data.dormitories.length)
    return res.status(400).json({ error: 'Add dormitories and residents first' });

  if (data.currentRotation) {
    const hist = readHistory();
    hist.history.unshift({ date: new Date().toISOString(), rotation: JSON.parse(JSON.stringify(data.currentRotation)), auto: false });
    writeHistory(hist);
  }

  const { residents, rotation } = buildRotation(data.residents, data.dormitories);
  const now = new Date().toISOString();
  data.residents = residents;
  data.currentRotation = rotation;
  data.lastRotationDate = now;
  data.nextRotationDate = addDays(now, data.rotationInterval);
  data.rotationCount = (data.rotationCount || 0) + 1;
  writeData(data);
  res.json({ success: true });
});

// POST manual rotate
app.post('/api/rotate', (req, res) => {
  const ok = performRotation(false);
  if (!ok) return res.status(400).json({ error: 'Nothing to rotate' });
  res.json({ success: true, data: readData() });
});

// POST update settings
app.post('/api/settings', (req, res) => {
  const data = readData();
  const { rotationInterval } = req.body;
  if (!rotationInterval || rotationInterval < 1)
    return res.status(400).json({ error: 'Invalid rotation interval' });
  data.rotationInterval = parseInt(rotationInterval);
  if (data.lastRotationDate)
    data.nextRotationDate = addDays(data.lastRotationDate, data.rotationInterval);
  writeData(data);
  res.json({ success: true });
});

// POST clear all data
app.post('/api/clear', (req, res) => {
  writeData({
    dormitories: [], residents: [], currentRotation: null,
    lastRotationDate: null, nextRotationDate: null,
    rotationInterval: 15, rotationCount: 0
  });
  writeHistory({ history: [] });
  res.json({ success: true });
});

// ─── CRON ────────────────────────────────────────────────────────
// Check every hour
cron.schedule('0 * * * *', () => {
  console.log('[Cron] Hourly rotation check...');
  checkAutoRotation();
});
// Also check at midnight daily
cron.schedule('0 0 * * *', () => {
  console.log('[Cron] Midnight rotation check...');
  checkAutoRotation();
});

// ─── BOOT ────────────────────────────────────────────────────────
initFiles();
checkAutoRotation(); // Check on startup too

app.listen(PORT, () => {
  console.log(`\n🏠 Hostel Dormitory Manager running at http://localhost:${PORT}`);
  console.log('   Auto-rotation is ACTIVE (cron: hourly + midnight)\n');
});
