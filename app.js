const $ = (s) => document.querySelector(s);
const BUILD = 'PROFILTEST-2057';
let busy = false;

function token() {
  return (localStorage.getItem('rm_token') || '').trim();
}

function proxyUrl() {
  return (localStorage.getItem('rm_proxy') || '')
    .trim()
    .replace(/\/+$/, '');
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return '–';

  if (typeof v === 'number') {
    return new Intl.NumberFormat('de-DE').format(v);
  }

  return String(v);
}

function setText(selector, value) {
  const el = $(selector);

  if (el) {
    el.textContent = value ?? '–';
  }
}

function showBox(text) {
  const box = $('#errorBox');

  if (!box) return;

  box.textContent = text;
  box.classList.remove('hidden');
}

function openSettings() {
  const drawer = $('#drawer');

  if (!drawer) return;

  if ($('#tokenInput')) {
    $('#tokenInput').value = token();
  }

  if ($('#proxyInput')) {
    $('#proxyInput').value = proxyUrl();
  }

  if ($('#autoInput')) {
    $('#autoInput').checked = false;
  }

  drawer.classList.add('open');
}

function closeSettings() {
  $('#drawer')?.classList.remove('open');
}

function saveSettings() {
  const t = ($('#tokenInput')?.value || '').trim();

  const proxy = ($('#proxyInput')?.value || '')
    .trim()
    .replace(/\/+$/, '');

  if (t) {
    localStorage.setItem('rm_token', t);
  } else {
    localStorage.removeItem('rm_token');
  }

  if (proxy) {
    localStorage.setItem('rm_proxy', proxy);
  } else {
    localStorage.removeItem('rm_proxy');
  }

  localStorage.setItem('rm_auto', '0');

  closeSettings();

  loadProfile();
}

function forgetToken() {
  localStorage.removeItem('rm_token');

  if ($('#tokenInput')) {
    $('#tokenInput').value = '';
  }

  showBox('Token wurde auf diesem Gerät gelöscht.');
}

async function fetchProfile() {
  const t = token();
  const proxy = proxyUrl();

  if (!t) {
    throw new Error('Kein API-Token gespeichert.');
  }

  if (!proxy) {
    throw new Error('Keine Cloudflare-Worker-Adresse gespeichert.');
  }

  const response = await fetch(
    proxy + '/v1/me',
    {
      method: 'GET',

      headers: {
        'Authorization': `Bearer ${t}`,
        'Accept': 'application/json'
      },

      cache: 'no-store'
    }
  );

  const raw = await response.text();

  let body;

  try {
    body = raw
      ? JSON.parse(raw)
      : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail =
      body?.error ||
      body?.message ||
      raw ||
      'keine Servermeldung';

    throw new Error(
      `HTTP ${response.status}: ${detail}`
    );
  }

  if (!body || typeof body !== 'object') {
    throw new Error(
      'HTTP 200, aber keine gültigen JSON-Daten: ' +
      raw.slice(0, 500)
    );
  }

  return {
    body,
    raw
  };
}

function normalizeProfile(body) {
  if (
    body?.data &&
    typeof body.data === 'object'
  ) {
    return body.data;
  }

  if (
    body?.profile &&
    typeof body.profile === 'object'
  ) {
    return body.profile;
  }

  if (
    body?.player &&
    typeof body.player === 'object'
  ) {
    return body.player;
  }

  return body;
}

function renderProfile(p) {
  setText(
    '#knightName',
    p.name ?? 'Name fehlt'
  );

  setText(
    '#level',
    fmt(p.level)
  );

  setText(
    '#gold',
    fmt(
      p.currencies?.gold ??
      p.gold
    )
  );

  setText(
    '#diamonds',
    fmt(
      p.currencies?.diamonds ??
      p.diamonds
    )
  );

  setText(
    '#honor',
    fmt(
      p.ranking?.honor ??
      p.honor
    )
  );

  setText(
    '#rank',
    fmt(
      p.ranking?.position ??
      p.rank
    )
  );

  setText(
    '#sword',
    fmt(p.upgrades?.sword)
  );

  setText(
    '#armor',
    fmt(p.upgrades?.armor)
  );

  setText(
    '#shelter',
    fmt(p.upgrades?.shelter)
  );

  setText(
    '#huntLevel',
    fmt(p.hunting?.level)
  );

  setText(
    '#huntKills',
    fmt(p.hunting?.kills)
  );

  setText(
    '#huntPoints',
    fmt(p.hunting?.points)
  );

  setText(
    '#cooking',
    fmt(p.crafting?.cooking)
  );

  setText(
    '#engineering',
    fmt(p.crafting?.engineering)
  );

  setText(
    '#adventure',
    fmt(p.progress?.adventure)
  );

  setText(
    '#tower',
    fmt(p.progress?.tower)
  );

  setText(
    '#location',
    p.status?.location
      ? `📍 ${p.status.location}`
      : 'Standort nicht gemeldet'
  );

  const online = $('#online');

  if (online) {
    online.textContent =
      p.status?.online
        ? 'ONLINE'
        : 'OFFLINE';

    online.className =
      p.status?.online
        ? 'online'
        : 'online offline';
  }
}

async function loadProfile() {
  if (busy) return;

  busy = true;

  $('#app')?.classList.add('loading');

  setText(
    '#refreshState',
    'Teste /v1/me …'
  );

  try {
    const { body, raw } =
      await fetchProfile();

    const p =
      normalizeProfile(body);

    renderProfile(p);

    const keys =
      Object.keys(body).join(', ');

    showBox(
      `API TEST OK (${BUILD})\n` +
      `HTTP 200 von /v1/me\n` +
      `Name: ${p.name ?? 'FEHLT'} · ` +
      `Level: ${p.level ?? 'FEHLT'}\n` +
      `Antwort-Felder: ${keys || '(keine)'}\n` +
      `Rohantwort: ${raw.slice(0, 1200)}`
    );

    setText(
      '#refreshState',
      'Profil erfolgreich geladen'
    );

  } catch (err) {
    showBox(
      `API TEST FEHLER (${BUILD})\n` +
      (
        err?.message ||
        String(err)
      )
    );

    setText(
      '#refreshState',
      'Profiltest fehlgeschlagen'
    );

  } finally {
    $('#app')
      ?.classList
      .remove('loading');

    busy = false;
  }
}

window.openSettings = openSettings;

window.addEventListener(
  'load',
  () => {
    /*
      Wenn diese Anzeige erscheint,
      wissen wir sicher:
      Genau diese neue app.js läuft.
    */
    setText(
      '#season',
      BUILD
    );

    $('#settingsBtn')
      ?.addEventListener(
        'click',
        openSettings
      );

    $('#settingsFooter')
      ?.addEventListener(
        'click',
        openSettings
      );

    $('#closeBtn')
      ?.addEventListener(
        'click',
        closeSettings
      );

    $('#saveBtn')
      ?.addEventListener(
        'click',
        saveSettings
      );

    $('#forgetBtn')
      ?.addEventListener(
        'click',
        forgetToken
      );

    $('#refreshBtn')
      ?.addEventListener(
        'click',
        loadProfile
      );

    $('#drawer')
      ?.addEventListener(
        'click',
        e => {
          if (
            e.target?.id ===
            'drawer'
          ) {
            closeSettings();
          }
        }
      );

    if (
      token() &&
      proxyUrl()
    ) {
      loadProfile();
    } else {
      openSettings();
    }
  }
);
