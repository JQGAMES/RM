const API_ORIGIN_DEFAULT = '';

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];

const state = {
  data: {
    profile: null,
    skills: null,
    buffs: null,
    blacksmith: null,
    dragon: null,
    outpost: null,
    season: null,
    shop: null,
    live: null
  },
  busy: false
};

function token() {
  return (localStorage.getItem('rm_token') || '').trim();
}

function proxyUrl() {
  return (localStorage.getItem('rm_proxy') || '').trim().replace(/\/+$/, '');
}

function setText(sel, value) {
  const el = $(sel);
  if (el) el.textContent = value ?? '–';
}

function fmt(n) {
  if (n === null || n === undefined || n === '') return '–';
  if (typeof n === 'number') return new Intl.NumberFormat('de-DE').format(n);
  return String(n);
}

function safe(obj, ...paths) {
  for (const p of paths) {
    const parts = p.split('.');
    let cur = obj;
    let ok = true;

    for (const part of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, part)) {
        cur = cur[part];
      } else {
        ok = false;
        break;
      }
    }

    if (ok && cur !== undefined && cur !== null) return cur;
  }

  return null;
}

async function api(path) {
  const t = token();
  const proxy = proxyUrl();

  if (!t) {
    throw new Error(`${path}: Kein API-Token gespeichert.`);
  }

  if (!proxy) {
    throw new Error(`${path}: Keine Cloudflare-Worker-Adresse gespeichert.`);
  }

  let r;

  try {
    r = await fetch(proxy + path, {
      headers: {
        'Authorization': `Bearer ${t}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
  } catch (e) {
    throw new Error(`${path}: Worker nicht erreichbar (${e?.message || e})`);
  }

  const raw = await r.text();

  let body = {};

  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = { raw };
  }

  if (!r.ok) {
    const detail =
      body?.error ||
      body?.message ||
      body?.raw ||
      'keine Antwort';

    throw new Error(`${path}: HTTP ${r.status} – ${detail}`);
  }

  return body;
}

function renderProfile() {
  const p = state.data.profile || {};

  setText('#playerName',
    safe(p, 'name', 'username', 'player.name', 'character.name') || '–'
  );

  setText('#level',
    fmt(safe(p, 'level', 'player.level', 'character.level'))
  );

  setText('#gold',
    fmt(safe(p, 'gold', 'coins', 'currency.gold'))
  );

  setText('#silver',
    fmt(safe(p, 'silver', 'currency.silver'))
  );

  setText('#diamonds',
    fmt(safe(p, 'diamonds', 'gems', 'currency.diamonds'))
  );

  setText('#xp',
    fmt(safe(p, 'xp', 'experience', 'player.experience'))
  );
}

function renderSkills() {
  const data = state.data.skills;

  const box = $('#skillsList');

  if (!box) return;

  box.innerHTML = '';

  let list = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data?.skills)) {
    list = data.skills;
  }

  if (!list.length) {
    box.innerHTML = '<div class="muted">–</div>';
    return;
  }

  for (const item of list) {
    const div = document.createElement('div');
    div.className = 'list-row';

    const name =
      item?.name ||
      item?.title ||
      item?.skill?.name ||
      'Fähigkeit';

    const level =
      item?.level ??
      item?.rank ??
      item?.skill_level ??
      '';

    div.innerHTML = `
      <span>${name}</span>
      <strong>${level !== '' ? 'Stufe ' + level : ''}</strong>
    `;

    box.appendChild(div);
  }
}

function renderBuffs() {
  const data = state.data.buffs;
  const box = $('#buffsList');

  if (!box) return;

  box.innerHTML = '';

  let list = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data?.buffs)) {
    list = data.buffs;
  }

  if (!list.length) {
    box.innerHTML = '<div class="muted">–</div>';
    return;
  }

  for (const item of list) {
    const div = document.createElement('div');
    div.className = 'list-row';

    const name =
      item?.name ||
      item?.title ||
      item?.buff?.name ||
      'Buff';

    const value =
      item?.value ??
      item?.amount ??
      item?.remaining ??
      '';

    div.innerHTML = `
      <span>${name}</span>
      <strong>${fmt(value)}</strong>
    `;

    box.appendChild(div);
  }
}

function renderSimple() {
  const bs = state.data.blacksmith || {};
  const dragon = state.data.dragon || {};
  const outpost = state.data.outpost || {};
  const season = state.data.season || {};
  const shop = state.data.shop || {};
  const live = state.data.live || {};

  setText('#blacksmithValue',
    fmt(
      safe(
        bs,
        'level',
        'status',
        'blacksmith.level'
      )
    )
  );

  setText('#dragonValue',
    fmt(
      safe(
        dragon,
        'level',
        'status',
        'dragon.level'
      )
    )
  );

  setText('#outpostValue',
    fmt(
      safe(
        outpost,
        'level',
        'status',
        'outpost.level'
      )
    )
  );

  setText('#seasonValue',
    safe(
      season,
      'name',
      'season.name',
      'title',
      'id'
    ) || '–'
  );

  setText('#shopValue',
    fmt(
      safe(
        shop,
        'items.length',
        'count'
      )
    )
  );

  setText('#liveValue',
    safe(
      live,
      'status',
      'name',
      'event.name'
    ) || '–'
  );
}

function render() {
  renderProfile();
  renderSkills();
  renderBuffs();
  renderSimple();

  const online = !!state.data.profile;

  const pill = $('#statusPill');

  if (pill) {
    pill.textContent = online ? 'ONLINE' : 'OFFLINE';
    pill.classList.toggle('online', online);
    pill.classList.toggle('offline', !online);
  }
}

async function loadAll() {
  if (state.busy) return;

  state.busy = true;

  setText('#refreshState', 'Aktualisiere …');

  const btn = $('#refreshBtn');

  if (btn) btn.disabled = true;

  const endpoints = [
    ['profile', '/v1/me'],
    ['skills', '/v1/me/skills'],
    ['buffs', '/v1/me/buffs'],
    ['blacksmith', '/v1/me/blacksmith'],
    ['dragon', '/v1/me/dragon'],
    ['outpost', '/v1/me/outpost'],
    ['season', '/v1/game/season'],
    ['shop', '/v1/game/shop'],
    ['live', '/v1/game/live']
  ];

  try {
    const results = await Promise.allSettled(
      endpoints.map(x => api(x[1]))
    );

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        state.data[endpoints[i][0]] = r.value;
      }
    });

    const report = results.map((r, i) =>
      r.status === 'fulfilled'
        ? `${endpoints[i][1]}: OK`
        : `${endpoints[i][1]}: ${r.reason?.message || r.reason}`
    ).join('\n');

    const rejected = results.filter(
      r => r.status === 'rejected'
    );

    if (!state.data.profile && rejected.length) {
      alert(
        'RitterManager API-Diagnose:\n\n' + report
      );

      throw rejected[0].reason;
    }

    render();

    if (rejected.length) {
      const errorBox = $('#errorBox');

      if (errorBox) {
        errorBox.textContent = report;
        errorBox.classList.remove('hidden');
      }

      alert(
        'RitterManager API-Diagnose:\n\n' + report
      );
    } else {
      $('#errorBox')?.classList.add('hidden');
    }

    setText('#refreshState', 'Gerade aktualisiert');

    localStorage.setItem(
      'rm_last',
      String(Date.now())
    );
  } catch (e) {
    const msg = e?.message || String(e);

    const errorBox = $('#errorBox');

    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.remove('hidden');
    }

    setText(
      '#refreshState',
      'Fehler: ' + msg
    );
  } finally {
    state.busy = false;

    if (btn) btn.disabled = false;
  }
}

function openSettings() {
  const drawer = $('#settingsDrawer');

  if (!drawer) return;

  $('#proxyInput').value = proxyUrl();
  $('#tokenInput').value = token();

  drawer.classList.add('open');
}

function closeSettings() {
  $('#settingsDrawer')?.classList.remove('open');
}

function saveSettings() {
  const proxy =
    ($('#proxyInput')?.value || '')
      .trim()
      .replace(/\/+$/, '');

  const t =
    ($('#tokenInput')?.value || '')
      .trim();

  localStorage.setItem(
    'rm_proxy',
    proxy
  );

  localStorage.setItem(
    'rm_token',
    t
  );

  closeSettings();

  loadAll();
}

function bindUI() {
  $('#refreshBtn')?.addEventListener(
    'click',
    loadAll
  );

  $('#settingsBtn')?.addEventListener(
    'click',
    openSettings
  );

  $('#settingsClose')?.addEventListener(
    'click',
    closeSettings
  );

  $('#settingsSave')?.addEventListener(
    'click',
    saveSettings
  );

  $('#settingsDrawer')?.addEventListener(
    'click',
    e => {
      if (e.target.id === 'settingsDrawer') {
        closeSettings();
      }
    }
  );
}

function startAutoRefresh() {
  setInterval(() => {
    if (token() && proxyUrl()) {
      loadAll();
    }
  }, 30000);
}

document.addEventListener(
  'DOMContentLoaded',
  () => {
    bindUI();
    render();

    if (token() && proxyUrl()) {
      loadAll();
    }

    startAutoRefresh();
  }
);
