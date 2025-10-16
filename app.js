// Basic, framework-free directory with search/filters/sort.
// By default we load a local JSON file. Later you can switch to a real API endpoint.
// Example: replace fetch('./startups.json') with fetch('/api/startups').

const state = {
  rows: [],
  filtered: []
};

const els = {
  search: document.getElementById('search'),
  year: document.getElementById('year'),
  tag: document.getElementById('tag'),
  onlyNews: document.getElementById('onlyNews'),
  sort: document.getElementById('sort'),
  rowsTbody: document.getElementById('rows'),
  empty: document.getElementById('empty'),
};

init();

async function init() {
  // 1) Load data (local JSON for now)
  state.rows = await fetch('./startups.json').then(r => r.json());

  // 2) Hydrate filters (years & tags)
  setYears(state.rows);
  setTags(state.rows);

  // 3) Attach listeners
  [els.search, els.year, els.tag, els.onlyNews, els.sort].forEach(el => {
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  // 4) First render
  render();
}

function setYears(rows) {
  const years = Array.from(
    new Set(rows.map(r => r.year).filter(Boolean))
  ).sort((a, b) => b - a);
  for (const y of years) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y);
    els.year.appendChild(opt);
  }
}

function setTags(rows) {
  const tags = Array.from(new Set(rows.flatMap(r => r.tags || []))).sort();
  for (const t of tags) {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    els.tag.appendChild(opt);
  }
}

function normalize(s) { return (s || '').toLowerCase(); }

function render() {
  const q = normalize(els.search.value);
  const year = els.year.value;
  const tag = els.tag.value;
  const onlyNews = els.onlyNews.checked;
  const sort = els.sort.value; // 'year' | 'name'

  let out = [...state.rows];

  if (q) {
    out = out.filter(r =>
      normalize(r.name).includes(q) ||
      (r.founders || []).some(f => normalize(f).includes(q)) ||
      (r.tags || []).some(t => normalize(t).includes(q))
    );
  }
  if (year !== 'all') {
    out = out.filter(r => String(r.year) === year);
  }
  if (tag !== 'all') {
    out = out.filter(r => (r.tags || []).includes(tag));
  }
  if (onlyNews) {
    out = out.filter(r => r.lastNews && r.lastNews.url);
  }
  out.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    const ay = a.year || 0, by = b.year || 0;
    return by - ay; // newest first
  });

  state.filtered = out;
  paint(out);
}

function paint(rows) {
  els.rowsTbody.innerHTML = '';
  els.empty.classList.toggle('hidden', rows.length !== 0);

  for (const row of rows) {
    const tr = document.createElement('tr');

    // Venture
    const tdV = document.createElement('td');
    const nameEl = document.createElement(row.website ? 'a' : 'span');
    if (row.website) { nameEl.href = row.website; nameEl.target = '_blank'; nameEl.rel = 'noreferrer'; }
    nameEl.textContent = row.name;
    nameEl.className = 'venture-link';
    tdV.appendChild(nameEl);

    const program = document.createElement('div');
    program.textContent = row.program || '';
    program.style.color = 'var(--muted)';
    program.style.fontSize = '12px';
    tdV.appendChild(program);

    // Founders
    const tdF = document.createElement('td');
    tdF.textContent = (row.founders || []).join(', ');

    // Year
    const tdY = document.createElement('td');
    tdY.textContent = row.year || '—';

    // Tags
    const tdT = document.createElement('td');
    const chips = document.createElement('div');
    chips.className = 'chips';
    (row.tags || []).forEach(t => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = t;
      chips.appendChild(chip);
    });
    tdT.appendChild(chips);

    // News
    const tdN = document.createElement('td');
    if (row.lastNews && row.lastNews.url) {
      const a = document.createElement('a');
      a.href = row.lastNews.url;
      a.textContent = row.lastNews.title || 'Recent coverage';
      a.target = '_blank'; a.rel = 'noreferrer';
      tdN.appendChild(a);
    } else {
      const dash = document.createElement('span');
      dash.style.color = 'var(--muted)';
      dash.textContent = '—';
      tdN.appendChild(dash);
    }

    tr.appendChild(tdV);
    tr.appendChild(tdF);
    tr.appendChild(tdY);
    tr.appendChild(tdT);
    tr.appendChild(tdN);

    els.rowsTbody.appendChild(tr);
  }
}

// --- If/when switch to a real API ---
// Replace the fetch in init() with your endpoint (must allow CORS if different origin):
// state.rows = await fetch('https://yourdomain.com/api/startups').then(r => r.json());
