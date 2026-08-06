const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'dormitory_data.json');
const HISTORY_FILE = path.join(DATA_DIR, 'rotation_history.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function initFiles() {
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify({ history: [] }, null, 2));
  }
  if (!fs.existsSync(AUTH_FILE)) {
    fs.writeFileSync(AUTH_FILE, JSON.stringify({
      admin: { username: 'Lukash', password: 'Tirkey8590' },
      sessions: {}
    }, null, 2));
  }
}

function readData() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (data && data.dormitories && data.dormitories.length) return data;
  } catch {}

  // Fallback seed data if file missing or empty
  const defaultSeed = {
    dormitories: [
      { name: "Mamma Margaret Mansion:101", capacity: 12, block: "Girls" },
      { name: "Mamma Margaret Mansion:104", capacity: 10, block: "Girls" },
      { name: "Rayanna:306", capacity: 14, block: "Girls" },
      { name: "Velunaachi:307", capacity: 14, block: "Girls" },
      { name: "Krishnadevaraya:302", capacity: 14, block: "Boys" },
      { name: "Kuriakose:303", capacity: 14, block: "Boys" },
      { name: "Thiruvalluvar:304", capacity: 10, block: "Boys" },
      { name: "Sitarama:305", capacity: 10, block: "Boys" },
      { name: "215", capacity: 13, block: "Boys" }
    ],
    residents: [
      { name: "Priyanka - Leader", id: "STU-101-1", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Darathi - Ass. Leader", id: "STU-101-2", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Aihun Ryngkhlem", id: "STU-101-3", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Merlin", id: "STU-101-4", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Aiphrinda Nongrum", id: "STU-101-5", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Emideimaya Dkhar", id: "STU-101-6", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Mahadharshini", id: "STU-101-7", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Daphishisha Lyngdoh", id: "STU-101-8", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Baiamomlang lamare", id: "STU-101-9", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Banasha kurkalang", id: "STU-101-10", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Peacefull lyngdoh", id: "STU-101-11", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Judith susngi", id: "STU-101-12", block: "Girls", dormitory: "Mamma Margaret Mansion:101", joinedDate: "2026-08-01T00:00:00.000Z" },

      { name: "Rakshana - Leader", id: "STU-104-1", block: "Girls", dormitory: "Mamma Margaret Mansion:104", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Jancy - Ass. Leader", id: "STU-104-2", block: "Girls", dormitory: "Mamma Margaret Mansion:104", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Ibadawanshwa Shylla", id: "STU-104-3", block: "Girls", dormitory: "Mamma Margaret Mansion:104", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Sabitha Nayaki", id: "STU-104-4", block: "Girls", dormitory: "Mamma Margaret Mansion:104", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Ibalahun Wahlang", id: "STU-104-5", block: "Girls", dormitory: "Mamma Margaret Mansion:104", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Jacinta Susngi", id: "STU-104-6", block: "Girls", dormitory: "Mamma Margaret Mansion:104", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Arockia Jenifer", id: "STU-104-7", block: "Girls", dormitory: "Mamma Margaret Mansion:104", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Kasarika Lynthong", id: "STU-104-8", block: "Girls", dormitory: "Mamma Margaret Mansion:104", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Lapynbiang Khyriem", id: "STU-104-9", block: "Girls", dormitory: "Mamma Margaret Mansion:104", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Keerthana", id: "STU-104-10", block: "Girls", dormitory: "Mamma Margaret Mansion:104", joinedDate: "2026-08-01T00:00:00.000Z" },

      { name: "Amala Rakkini - Leader", id: "STU-306-1", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Afrin Banu - Ass. Leader", id: "STU-306-2", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Pynsngewbha Shylla", id: "STU-306-3", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Monaliza Dkhar Sawian", id: "STU-306-4", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Roslin", id: "STU-306-5", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Medarita Iawram", id: "STU-306-6", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Ramyowon Siro", id: "STU-306-7", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Amalin Mary", id: "STU-306-8", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Rinmichan Siro", id: "STU-306-9", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Jamila", id: "STU-306-10", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Risolda Nongrum", id: "STU-306-11", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Sathya Jothi", id: "STU-306-12", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Sincerity Shabong", id: "STU-306-13", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Saini Chyrmang", id: "STU-306-14", block: "Girls", dormitory: "Rayanna:306", joinedDate: "2026-08-01T00:00:00.000Z" },

      { name: "Serene - Leader", id: "STU-307-1", block: "Girls", dormitory: "Velunaachi:307", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Swathi - Ass. Leader", id: "STU-307-2", block: "Girls", dormitory: "Velunaachi:307", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Jenifer Jones", id: "STU-307-3", block: "Girls", dormitory: "Velunaachi:307", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Skillfully Rynghang", id: "STU-307-4", block: "Girls", dormitory: "Velunaachi:307", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Kaviyadharshini R", id: "STU-307-5", block: "Girls", dormitory: "Velunaachi:307", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Stacy Reamei", id: "STU-307-6", block: "Girls", dormitory: "Velunaachi:307", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Vanesa Mukhim", id: "STU-307-7", block: "Girls", dormitory: "Velunaachi:307", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Viccuna L. Kadete", id: "STU-307-8", block: "Girls", dormitory: "Velunaachi:307", joinedDate: "2026-08-01T00:00:00.000Z" },

      { name: "Santhosh - Leader", id: "STU-302-1", block: "Boys", dormitory: "Krishnadevaraya:302", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Pavankalyan - Ass. Leader", id: "STU-302-2", block: "Boys", dormitory: "Krishnadevaraya:302", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Carmellus Lakashiang", id: "STU-302-3", block: "Boys", dormitory: "Krishnadevaraya:302", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Veeramani", id: "STU-302-4", block: "Boys", dormitory: "Krishnadevaraya:302", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Allwinson Lyngdoh", id: "STU-302-5", block: "Boys", dormitory: "Krishnadevaraya:302", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Diago Armando Lamin", id: "STU-302-6", block: "Boys", dormitory: "Krishnadevaraya:302", joinedDate: "2026-08-01T00:00:00.000Z" },

      { name: "Tamilmani - Leader", id: "STU-303-1", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Iniyan C - Ass. Leader", id: "STU-303-2", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Dijoy Marak", id: "STU-303-3", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "L Ignatius Kadete", id: "STU-303-4", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Arish Paston C", id: "STU-303-5", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Michealraj", id: "STU-303-6", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Gothandam", id: "STU-303-7", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Arun Kumar", id: "STU-303-8", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Hendry Thomas", id: "STU-303-9", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Surendhiran", id: "STU-303-10", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Hameisha Tyngkan", id: "STU-303-11", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Rohith", id: "STU-303-12", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Vimal arul francis", id: "STU-303-13", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Arun Vineeth", id: "STU-303-14", block: "Boys", dormitory: "Kuriakose:303", joinedDate: "2026-08-01T00:00:00.000Z" },

      { name: "Rohith - Leader", id: "STU-304-1", block: "Boys", dormitory: "Thiruvalluvar:304", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Benadict - Ass. Leader", id: "STU-304-2", block: "Boys", dormitory: "Thiruvalluvar:304", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Robertstar Kharkongor", id: "STU-304-3", block: "Boys", dormitory: "Thiruvalluvar:304", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Balaji", id: "STU-304-4", block: "Boys", dormitory: "Thiruvalluvar:304", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Perfectson Marthong", id: "STU-304-5", block: "Boys", dormitory: "Thiruvalluvar:304", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Joel", id: "STU-304-6", block: "Boys", dormitory: "Thiruvalluvar:304", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Montfort", id: "STU-304-7", block: "Boys", dormitory: "Thiruvalluvar:304", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Syed Farhan", id: "STU-304-8", block: "Boys", dormitory: "Thiruvalluvar:304", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Syed Sameeruddin", id: "STU-304-9", block: "Boys", dormitory: "Thiruvalluvar:304", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Ribok Nongspung", id: "STU-304-10", block: "Boys", dormitory: "Thiruvalluvar:304", joinedDate: "2026-08-01T00:00:00.000Z" },

      { name: "Sam - Leader", id: "STU-305-1", block: "Boys", dormitory: "Sitarama:305", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Ram Charan - Ass. Leader", id: "STU-305-2", block: "Boys", dormitory: "Sitarama:305", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Don Bosco", id: "STU-305-3", block: "Boys", dormitory: "Sitarama:305", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Ryngkatborlang Sohtun", id: "STU-305-4", block: "Boys", dormitory: "Sitarama:305", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Tejas MA", id: "STU-305-5", block: "Boys", dormitory: "Sitarama:305", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Edwin Amburose", id: "STU-305-6", block: "Boys", dormitory: "Sitarama:305", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Subith", id: "STU-305-7", block: "Boys", dormitory: "Sitarama:305", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Praveen Samuel", id: "STU-305-8", block: "Boys", dormitory: "Sitarama:305", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Visazoto Savi", id: "STU-305-9", block: "Boys", dormitory: "Sitarama:305", joinedDate: "2026-08-01T00:00:00.000Z" },

      { name: "Haarris Augusta - Leader", id: "STU-215-1", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Kingsly - Ass. Leader", id: "STU-215-2", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Jeffery", id: "STU-215-3", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Windston", id: "STU-215-4", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Asrar Ahamed", id: "STU-215-5", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Lanka", id: "STU-215-6", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Ajay Kumar", id: "STU-215-7", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Vishwa S", id: "STU-215-8", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Jeron", id: "STU-215-9", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Sonu Joseph S", id: "STU-215-10", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Felix Raja", id: "STU-215-11", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" },
      { name: "Madhavan", id: "STU-215-12", block: "Boys", dormitory: "215", joinedDate: "2026-08-01T00:00:00.000Z" }
    ],
    currentRotation: [
      {
        name: "Mamma Margaret Mansion:101", capacity: 12, block: "Girls",
        residents: ["Priyanka - Leader", "Darathi - Ass. Leader", "Aihun Ryngkhlem", "Merlin", "Aiphrinda Nongrum", "Emideimaya Dkhar", "Mahadharshini", "Daphishisha Lyngdoh", "Baiamomlang lamare", "Banasha kurkalang", "Peacefull lyngdoh", "Judith susngi"]
      },
      {
        name: "Mamma Margaret Mansion:104", capacity: 10, block: "Girls",
        residents: ["Rakshana - Leader", "Jancy - Ass. Leader", "Ibadawanshwa Shylla", "Sabitha Nayaki", "Ibalahun Wahlang", "Jacinta Susngi", "Arockia Jenifer", "Kasarika Lynthong", "Lapynbiang Khyriem", "Keerthana"]
      },
      {
        name: "Rayanna:306", capacity: 14, block: "Girls",
        residents: ["Amala Rakkini - Leader", "Afrin Banu - Ass. Leader", "Pynsngewbha Shylla", "Monaliza Dkhar Sawian", "Roslin", "Medarita Iawram", "Ramyowon Siro", "Amalin Mary", "Rinmichan Siro", "Jamila", "Risolda Nongrum", "Sathya Jothi", "Sincerity Shabong", "Saini Chyrmang"]
      },
      {
        name: "Velunaachi:307", capacity: 14, block: "Girls",
        residents: ["Serene - Leader", "Swathi - Ass. Leader", "Jenifer Jones", "Skillfully Rynghang", "Kaviyadharshini R", "Stacy Reamei", "Vanesa Mukhim", "Viccuna L. Kadete"]
      },
      {
        name: "Krishnadevaraya:302", capacity: 14, block: "Boys",
        residents: ["Santhosh - Leader", "Pavankalyan - Ass. Leader", "Carmellus Lakashiang", "Veeramani", "Allwinson Lyngdoh", "Diago Armando Lamin"]
      },
      {
        name: "Kuriakose:303", capacity: 14, block: "Boys",
        residents: ["Tamilmani - Leader", "Iniyan C - Ass. Leader", "Dijoy Marak", "L Ignatius Kadete", "Arish Paston C", "Michealraj", "Gothandam", "Arun Kumar", "Hendry Thomas", "Surendhiran", "Hameisha Tyngkan", "Rohith", "Vimal arul francis", "Arun Vineeth"]
      },
      {
        name: "Thiruvalluvar:304", capacity: 10, block: "Boys",
        residents: ["Rohith - Leader", "Benadict - Ass. Leader", "Robertstar Kharkongor", "Balaji", "Perfectson Marthong", "Joel", "Montfort", "Syed Farhan", "Syed Sameeruddin", "Ribok Nongspung"]
      },
      {
        name: "Sitarama:305", capacity: 10, block: "Boys",
        residents: ["Sam - Leader", "Ram Charan - Ass. Leader", "Don Bosco", "Ryngkatborlang Sohtun", "Tejas MA", "Edwin Amburose", "Subith", "Praveen Samuel", "Visazoto Savi"]
      },
      {
        name: "215", capacity: 13, block: "Boys",
        residents: ["Haarris Augusta - Leader", "Kingsly - Ass. Leader", "Jeffery", "Windston", "Asrar Ahamed", "Lanka", "Ajay Kumar", "Vishwa S", "Jeron", "Sonu Joseph S", "Felix Raja", "Madhavan"]
      }
    ],
    lastRotationDate: "2026-08-01T00:00:00.000Z",
    nextRotationDate: "2026-08-15T00:00:00.000Z",
    rotationInterval: 15,
    rotationCount: 1
  };

  writeData(defaultSeed);
  return defaultSeed;
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

function readAuth() {
  try { return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')); }
  catch { return { admin: { username: 'Lukash', password: 'Tirkey8590' }, sessions: {} }; }
}

function writeAuth(a) {
  try { fs.writeFileSync(AUTH_FILE, JSON.stringify(a, null, 2)); return true; }
  catch { return false; }
}

function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function buildRotation(residents, dormitories) {
  const dorms = dormitories.map(d => ({ ...d, residents: [] }));
  const pool = [...residents];

  pool.forEach((resident, i) => {
    let target = dorms.find(d =>
      (d.block || '').toLowerCase() === (resident.block || '').toLowerCase() &&
      d.residents.length < d.capacity
    );
    if (!target) target = dorms.find(d => d.residents.length < d.capacity);
    if (!target) target = dorms[i % dorms.length];

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

  const names = data.dormitories.map(d => d.name);
  data.residents.forEach(r => {
    const ci = names.indexOf(r.dormitory);
    r.dormitory = names[(ci + 1) % names.length];
  });

  const dorms = data.dormitories.map(d => ({ ...d, residents: [] }));
  data.residents.forEach(r => {
    const dm = dorms.find(x => x.name === r.dormitory);
    if (dm) dm.residents.push(r.name);
  });

  const now = new Date().toISOString();
  data.currentRotation = dorms;
  data.lastRotationDate = now;
  data.nextRotationDate = addDays(now, data.rotationInterval || 15);
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

// MIME types helper
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function getSession(req) {
  const token = req.headers['x-auth-token'];
  if (!token) return null;
  const auth = readAuth();
  return auth.sessions[token] || null;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Serve static routes
  if (method === 'GET') {
    if (pathname === '/' || pathname === '/login') {
      return sendFile(res, path.join(__dirname, 'public', 'login.html'));
    }
    if (pathname === '/admin') {
      return sendFile(res, path.join(__dirname, 'public', 'index.html'));
    }
    if (pathname === '/student') {
      return sendFile(res, path.join(__dirname, 'public', 'student.html'));
    }
    if (pathname === '/manager' || pathname === '/hostel_manager.html') {
      return sendFile(res, path.join(__dirname, 'hostel_manager.html'));
    }

    // Try serving from public/ first, then root
    const pubPath = path.join(__dirname, 'public', pathname);
    if (fs.existsSync(pubPath) && fs.statSync(pubPath).isFile()) {
      return sendFile(res, pubPath);
    }
    const rootPath = path.join(__dirname, pathname);
    if (fs.existsSync(rootPath) && fs.statSync(rootPath).isFile()) {
      return sendFile(res, rootPath);
    }
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    const session = getSession(req);

    // POST /api/login
    if (pathname === '/api/login' && method === 'POST') {
      const body = await parseBody(req);
      const { role, username, password, studentName } = body;
      const auth = readAuth();

      if (role === 'admin') {
        if (username === auth.admin.username && password === auth.admin.password) {
          const token = generateToken();
          auth.sessions[token] = { role: 'admin', username, loginTime: new Date().toISOString() };
          writeAuth(auth);
          return sendJson(res, 200, { success: true, token, role: 'admin' });
        }
        return sendJson(res, 401, { error: 'Invalid credentials' });
      }

      if (role === 'student') {
        const data = readData() || { residents: [] };
        if (!studentName) return sendJson(res, 400, { error: 'Enter your name' });
        const resident = (data.residents || []).find(r =>
          r.name.toLowerCase() === studentName.trim().toLowerCase() ||
          (r.id && r.id.toLowerCase() === studentName.trim().toLowerCase())
        );
        if (!resident) return sendJson(res, 404, { error: 'Student not found. Ask admin to add you first.' });
        const token = generateToken();
        auth.sessions[token] = { role: 'student', studentName: resident.name, loginTime: new Date().toISOString() };
        writeAuth(auth);
        return sendJson(res, 200, { success: true, token, role: 'student', name: resident.name });
      }

      if (role === 'guest' || role === 'public') {
        const token = generateToken();
        auth.sessions[token] = { role: 'guest', guestName: 'Guest Visitor', loginTime: new Date().toISOString() };
        writeAuth(auth);
        return sendJson(res, 200, { success: true, token, role: 'guest', name: 'Guest Visitor' });
      }

      return sendJson(res, 400, { error: 'Invalid role' });
    }

    // POST /api/logout
    if (pathname === '/api/logout' && method === 'POST') {
      const token = req.headers['x-auth-token'];
      if (token) {
        const auth = readAuth();
        delete auth.sessions[token];
        writeAuth(auth);
      }
      return sendJson(res, 200, { success: true });
    }

    // GET /api/public-list (Public for visitors & dashboard)
    if (pathname === '/api/public-list' && method === 'GET') {
      const data = readData() || { dormitories: [], residents: [] };
      return sendJson(res, 200, {
        dormitories: data.dormitories,
        currentRotation: data.currentRotation,
        lastRotationDate: data.lastRotationDate,
        nextRotationDate: data.nextRotationDate,
        rotationInterval: data.rotationInterval
      });
    }

    // Auth guard for remaining endpoints
    if (!session) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }

    // GET /api/me
    if (pathname === '/api/me' && method === 'GET') {
      const data = readData() || { residents: [], dormitories: [] };
      if (session.role === 'admin') return sendJson(res, 200, { role: 'admin', username: session.username });
      if (session.role === 'guest') return sendJson(res, 200, { role: 'guest', name: 'Guest Visitor', isGuest: true });
      const resident = (data.residents || []).find(r => r.name === session.studentName);
      if (!resident) return sendJson(res, 404, { error: 'Resident not found' });
      const room = (data.currentRotation || []).find(dm => dm.name === resident.dormitory);
      return sendJson(res, 200, {
        role: 'student',
        name: resident.name,
        id: resident.id,
        block: resident.block,
        dormitory: resident.dormitory,
        roommates: room ? (room.residents || []).filter(n => n !== resident.name) : [],
        nextRotationDate: data.nextRotationDate,
        lastRotationDate: data.lastRotationDate,
        rotationInterval: data.rotationInterval
      });
    }

    // GET /api/public-list
    if (pathname === '/api/public-list' && method === 'GET') {
      const data = readData() || { dormitories: [], residents: [] };
      return sendJson(res, 200, {
        dormitories: data.dormitories,
        currentRotation: data.currentRotation,
        lastRotationDate: data.lastRotationDate,
        nextRotationDate: data.nextRotationDate,
        rotationInterval: data.rotationInterval,
        rotationCount: data.rotationCount,
        girlsCount: (data.residents || []).filter(r => (r.block || '').toLowerCase().includes('girl')).length,
        boysCount: (data.residents || []).filter(r => (r.block || '').toLowerCase().includes('boy')).length,
        totalResidents: (data.residents || []).length
      });
    }

    // Admin endpoints check
    if (session.role !== 'admin') {
      return sendJson(res, 403, { error: 'Admin access required' });
    }

    // GET /api/data
    if (pathname === '/api/data' && method === 'GET') {
      return sendJson(res, 200, readData());
    }

    // GET /api/history
    if (pathname === '/api/history' && method === 'GET') {
      return sendJson(res, 200, readHistory());
    }

    // POST /api/dormitories
    if (pathname === '/api/dormitories' && method === 'POST') {
      const data = readData() || { dormitories: [], residents: [] };
      const { name, capacity, block } = await parseBody(req);
      if (!name || !capacity) return sendJson(res, 400, { error: 'Name and capacity required' });
      if (data.dormitories.some(d => d.name.toLowerCase() === name.toLowerCase())) {
        return sendJson(res, 400, { error: 'Dormitory already exists' });
      }
      data.dormitories.push({ name: name.trim(), capacity: parseInt(capacity), block: block || '' });
      writeData(data);
      return sendJson(res, 200, { success: true });
    }

    // DELETE /api/dormitories/:name
    if (pathname.startsWith('/api/dormitories/') && method === 'DELETE') {
      const name = decodeURIComponent(pathname.replace('/api/dormitories/', ''));
      const data = readData() || { dormitories: [], residents: [] };
      data.dormitories = data.dormitories.filter(d => d.name !== name);
      data.residents = data.residents.map(r => { if (r.dormitory === name) r.dormitory = null; return r; });
      if (data.currentRotation) data.currentRotation = data.currentRotation.filter(d => d.name !== name);
      writeData(data);
      return sendJson(res, 200, { success: true });
    }

    // POST /api/residents
    if (pathname === '/api/residents' && method === 'POST') {
      const data = readData() || { dormitories: [], residents: [] };
      const { name, id, block } = await parseBody(req);
      if (!name) return sendJson(res, 400, { error: 'Name is required' });
      if (data.residents.some(r => r.name.toLowerCase() === name.toLowerCase())) {
        return sendJson(res, 400, { error: 'Resident already exists' });
      }
      data.residents.push({ name: name.trim(), id: (id || '').trim(), block: block || '', dormitory: null, joinedDate: new Date().toISOString() });
      writeData(data);
      return sendJson(res, 200, { success: true });
    }

    // POST /api/residents/bulk
    if (pathname === '/api/residents/bulk' && method === 'POST') {
      const data = readData() || { dormitories: [], residents: [] };
      const { residents, block, autoAssign } = await parseBody(req);
      if (!Array.isArray(residents) || !residents.length) return sendJson(res, 400, { error: 'No residents provided' });
      let added = 0, skipped = 0;
      residents.forEach(r => {
        const n = (r.name || '').trim();
        if (!n) return;
        if (data.residents.some(x => x.name.toLowerCase() === n.toLowerCase())) { skipped++; return; }
        data.residents.push({ name: n, id: (r.id || '').trim(), block: block || '', dormitory: null, joinedDate: new Date().toISOString() });
        added++;
      });
      if (autoAssign && data.dormitories.length) {
        const unassigned = data.residents.filter(r => !r.dormitory);
        const dorms = data.dormitories.map(d => {
          const existing = data.currentRotation?.find(x => x.name === d.name);
          return { ...d, residents: existing ? [...(existing.residents || [])] : [] };
        });
        unassigned.forEach(r => {
          let target = dorms.find(d => (!block || (d.block || '').toLowerCase() === block.toLowerCase()) && d.residents.length < d.capacity);
          if (!target) target = dorms.find(d => d.residents.length < d.capacity);
          if (!target) return;
          r.dormitory = target.name; target.residents.push(r.name);
        });
        const now = new Date().toISOString();
        data.currentRotation = dorms; data.lastRotationDate = now; data.nextRotationDate = addDays(now, data.rotationInterval || 15);
        data.rotationCount = (data.rotationCount || 0) + 1;
      }
      writeData(data);
      return sendJson(res, 200, { success: true, added, skipped });
    }

    // DELETE /api/residents/:name
    if (pathname.startsWith('/api/residents/') && method === 'DELETE') {
      const name = decodeURIComponent(pathname.replace('/api/residents/', ''));
      const data = readData() || { dormitories: [], residents: [] };
      data.residents = data.residents.filter(r => r.name !== name);
      if (data.currentRotation) {
        data.currentRotation.forEach(d => { d.residents = (d.residents || []).filter(r => r !== name); });
      }
      writeData(data);
      return sendJson(res, 200, { success: true });
    }

    // POST /api/initialize-rotation
    if (pathname === '/api/initialize-rotation' && method === 'POST') {
      const data = readData() || { dormitories: [], residents: [] };
      if (!data.residents.length || !data.dormitories.length) return sendJson(res, 400, { error: 'Add rooms and residents first' });
      if (data.currentRotation) {
        const hist = readHistory();
        hist.history.unshift({ date: new Date().toISOString(), rotation: JSON.parse(JSON.stringify(data.currentRotation)), auto: false });
        writeHistory(hist);
      }
      const { residents, rotation } = buildRotation(data.residents, data.dormitories);
      const now = new Date().toISOString();
      data.residents = residents; data.currentRotation = rotation; data.lastRotationDate = now;
      data.nextRotationDate = addDays(now, data.rotationInterval || 15);
      data.rotationCount = (data.rotationCount || 0) + 1;
      writeData(data);
      return sendJson(res, 200, { success: true });
    }

    // POST /api/rotate
    if (pathname === '/api/rotate' && method === 'POST') {
      const ok = performRotation(false);
      if (!ok) return sendJson(res, 400, { error: 'Nothing to rotate' });
      return sendJson(res, 200, { success: true, data: readData() });
    }

    // POST /api/settings
    if (pathname === '/api/settings' && method === 'POST') {
      const data = readData() || {};
      const { rotationInterval } = await parseBody(req);
      if (!rotationInterval || rotationInterval < 1) return sendJson(res, 400, { error: 'Invalid interval' });
      data.rotationInterval = parseInt(rotationInterval);
      if (data.lastRotationDate) data.nextRotationDate = addDays(data.lastRotationDate, data.rotationInterval);
      writeData(data);
      return sendJson(res, 200, { success: true });
    }

    // POST /api/change-password
    if (pathname === '/api/change-password' && method === 'POST') {
      const { newPassword } = await parseBody(req);
      if (!newPassword || newPassword.length < 4) return sendJson(res, 400, { error: 'Password must be at least 4 chars' });
      const auth = readAuth();
      auth.admin.password = newPassword;
      writeAuth(auth);
      return sendJson(res, 200, { success: true });
    }

    // POST /api/change-username
    if (pathname === '/api/change-username' && method === 'POST') {
      const { newUsername } = await parseBody(req);
      if (!newUsername || newUsername.trim().length < 3) return sendJson(res, 400, { error: 'Username must be at least 3 chars' });
      const auth = readAuth();
      auth.admin.username = newUsername.trim();
      writeAuth(auth);
      return sendJson(res, 200, { success: true, username: auth.admin.username });
    }

    // POST /api/clear
    if (pathname === '/api/clear' && method === 'POST') {
      writeData({ dormitories: [], residents: [], currentRotation: null, lastRotationDate: null, nextRotationDate: null, rotationInterval: 15, rotationCount: 0 });
      writeHistory({ history: [] });
      return sendJson(res, 200, { success: true });
    }
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

initFiles();
checkAutoRotation();

// Hourly check
setInterval(checkAutoRotation, 3600000);

server.listen(PORT, () => {
  console.log(`\n🏠 Hostel Dormitory Manager running at http://localhost:${PORT}`);
  console.log('   Admin login: Lukash / Tirkey8590');
  console.log('   Data initialized with 9 dormitories and 95 residents across 2 sections (Girls & Boys).\n');
});
