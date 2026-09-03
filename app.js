const $ = (s) => document.querySelector(s);

const state = {
  profile: null,
  buffs: null,
  busy: false,
  timer: null,
  countdownTimer: null,
  lastRequestAt: 0
};

const AUTO_REFRESH_MS = 60000;
const MANUAL_COOLDOWN_MS = 5000;

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
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
  if (el) el.textContent = value ?? '–';
}

function token() {
  return (localStorage.getItem('rm_token') || '').trim();
}

function proxyUrl() {
  return (localStorage.getItem('rm_proxy') || '')
    .trim()
    .replace(/\/+$/, '');
}

function autoRefresh() {
  return localStorage.getItem('rm_auto') !== '0';
}

function showError(message) {
  const box = $('#errorBox');
  if (!box) return;

  box.textContent = message;
  box.classList.remove('hidden');
}

function hideError() {
  $('#errorBox')?.classList.add('hidden');
}

async function api(path) {
  const t = token();
  const proxy = proxyUrl();

  if (!t) {
    throw new Error('Kein API-Token gespeichert.');
  }

  if (!proxy) {
    throw new Error('Keine Cloudflare-Worker-Adresse gespeichert.');
  }

  let response;

  try {
    response = await fetch(proxy + path, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${t}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
  } catch (err) {
    throw new Error(
      `Worker nicht erreichbar: ${err?.message || err}`
    );
  }

  const raw = await response.text();

  let body = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }

  if (!response.ok) {
    const detail =
      (
        body &&
        typeof body === 'object' &&
        (body.error || body.message)
      ) ||
      (
        typeof body === 'string' &&
        body
      ) ||
      'Keine weitere Servermeldung';

    throw new Error(
      `${path}: HTTP ${response.status} – ${detail}`
    );
  }

  if (!body || typeof body !== 'object') {
    throw new Error(
      `${path}: Antwort war kein gültiges JSON-Objekt.`
    );
  }

  return body;
}

function renderProfile() {
  const p = state.profile;

  if (!p) return;

  setText('#knightName', p.name ?? 'Unbekannter Ritter');
  setText('#level', fmt(p.level));

  setText(
    '#gold',
    fmt(p.currencies?.gold)
  );

  setText(
    '#diamonds',
    fmt(p.currencies?.diamonds)
  );

  setText(
    '#honor',
    fmt(p.ranking?.honor)
  );

  setText(
    '#rank',
    fmt(p.ranking?.position)
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

  setText(
    '#season',
    'Persönliche Übersicht'
  );
}

function buffExpiryMs(buff) {
  if (
    Number.isFinite(
      Number(buff?.expires_at)
    )
  ) {
    return Number(buff.expires_at) * 1000;
  }

  if (
    Number.isFinite(
      Number(buff?.remaining_seconds)
    )
  ) {
    return (
      Date.now() +
      Number(buff.remaining_seconds) * 1000
    );
  }

  return null;
}

function formatCountdown(ms) {
  const total = Math.max(
    0,
    Math.ceil(ms / 1000)
  );

  const h = Math.floor(total / 3600);
  const m = Math.floor(
    (total % 3600) / 60
  );
  const s = total % 60;

  if (h > 0) {
    return (
      `${h}:` +
      `${String(m).padStart(2, '0')}:` +
      `${String(s).padStart(2, '0')}`
    );
  }

  return (
    `${m}:` +
    `${String(s).padStart(2, '0')}`
  );
}

function renderBuffs() {
  const el = $('#buffs');

  if (!el) return;

  const data = state.buffs || {};

  const all = [
    ...(
      Array.isArray(data.buffs)
        ? data.buffs.map(
            x => ({
              ...x,
              debuff: false
            })
          )
        : []
    ),

    ...(
      Array.isArray(data.debuffs)
        ? data.debuffs.map(
            x => ({
              ...x,
              debuff: true
            })
          )
        : []
    )
  ];

  if (!all.length) {
    el.innerHTML =
      '<div class="small">' +
      'Keine aktiven Buffs oder Debuffs.' +
      '</div>';

    return;
  }

  el.innerHTML = all.map((b, i) => {
    const expiry =
      buffExpiryMs(b);

    const countdown =
      expiry
        ? formatCountdown(
            expiry - Date.now()
          )
        : (
            fmt(b.remaining_minutes) +
            ' Min'
          );

    return `
      <div class="buff">

        <div class="buffTop">

          <span>
            ${esc(
              b.name ||
              b.type ||
              'Wirkung'
            )}
          </span>

          <span
            id="buffTimer${i}"
            data-expires="${expiry || ''}"
          >
            ${b.debuff ? '⚠ ' : ''}
            ${countdown}
          </span>

        </div>

        <div class="buffDesc">

          ${esc(
            b.description || ''
          )}

          ${
            b.value !== undefined
              ? ` · Wert ${esc(b.value)}`
              : ''
          }

        </div>

      </div>
    `;
  }).join('');
}

function updateBuffCountdowns() {
  document
    .querySelectorAll(
      '[data-expires]'
    )
    .forEach(el => {
      const expiry =
        Number(el.dataset.expires);

      if (
        !Number.isFinite(expiry) ||
        expiry <= 0
      ) {
        return;
      }

      const prefix =
        el.textContent
          .trim()
          .startsWith('⚠')
          ? '⚠ '
          : '';

      el.textContent =
        prefix +
        formatCountdown(
          expiry - Date.now()
        );
    });
}

async function loadCore(force = false) {
  if (state.busy) return;

  const now = Date.now();

  if (
    force &&
    now - state.lastRequestAt <
      MANUAL_COOLDOWN_MS
  ) {
    setText(
      '#refreshState',
      'Bitte kurz warten…'
    );

    return;
  }

  state.busy = true;
  state.lastRequestAt = now;

  $('#app')
    ?.classList
    .add('loading');

  setText(
    '#refreshState',
    'Verbinde…'
  );

  try {
    /*
      ERSTER UND ENTSCHEIDENDER TEST:
      Nur /v1/me.

      Sobald diese Anfrage erfolgreich ist,
      werden die Profildaten sofort angezeigt.
    */

    state.profile =
      await api('/v1/me');

    renderProfile();

    /*
      Erst DANACH Buffs laden.
      Selbst wenn Buffs scheitern,
      bleiben Profildaten sichtbar.
    */

    try {
      state.buffs =
        await api('/v1/me/buffs');

      renderBuffs();

    } catch (buffErr) {
      showError(
        'Profil geladen. ' +
        'Buffs noch nicht geladen: ' +
        (
          buffErr.message ||
          buffErr
        )
      );

      setText(
        '#refreshState',
        'Profil geladen'
      );

      return;
    }

    hideError();

    setText(
      '#refreshState',
      `Aktuell · ${
        new Date().toLocaleTimeString(
          'de-DE',
          {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }
        )
      }`
    );

  } catch (err) {
    showError(
      err?.message ||
      String(err)
    );

    setText(
      '#refreshState',
      'Verbindung fehlgeschlagen'
    );

  } finally {
    $('#app')
      ?.classList
      .remove('loading');

    state.busy = false;
  }
}

function openSettings() {
  const drawer = $('#drawer');

  if (!drawer) return;

  if ($('#tokenInput')) {
    $('#tokenInput').value =
      token();
  }

  if ($('#proxyInput')) {
    $('#proxyInput').value =
      proxyUrl();
  }

  if ($('#autoInput')) {
    $('#autoInput').checked =
      autoRefresh();
  }

  drawer.classList.add('open');
}

function closeSettings() {
  $('#drawer')
    ?.classList
    .remove('open');
}

function setupTimer() {
  if (state.timer) {
    clearInterval(
      state.timer
    );
  }

  state.timer = null;

  if (
    autoRefresh() &&
    token() &&
    proxyUrl()
  ) {
    state.timer =
      setInterval(
        () => loadCore(false),
        AUTO_REFRESH_MS
      );
  }
}

function setupCountdownTimer() {
  if (state.countdownTimer) {
    clearInterval(
      state.countdownTimer
    );
  }

  state.countdownTimer =
    setInterval(
      updateBuffCountdowns,
      1000
    );
}

function saveSettings() {
  const t =
    (
      $('#tokenInput')
        ?.value || ''
    ).trim();

  const proxy =
    (
      $('#proxyInput')
        ?.value || ''
    )
      .trim()
      .replace(/\/+$/, '');

  if (t) {
    localStorage.setItem(
      'rm_token',
      t
    );
  } else {
    localStorage.removeItem(
      'rm_token'
    );
  }

  if (proxy) {
    localStorage.setItem(
      'rm_proxy',
      proxy
    );
  } else {
    localStorage.removeItem(
      'rm_proxy'
    );
  }

  localStorage.setItem(
    'rm_auto',
    $('#autoInput')?.checked
      ? '1'
      : '0'
  );

  closeSettings();

  setupTimer();

  if (t && proxy) {
    loadCore(true);
  } else {
    openSettings();
  }
}

function forgetToken() {
  localStorage.removeItem(
    'rm_token'
  );

  if ($('#tokenInput')) {
    $('#tokenInput').value = '';
  }

  showError(
    'Token wurde nur auf diesem Gerät gelöscht.'
  );
}

window.addEventListener(
  'load',
  () => {
    /*
      Diese IDs habe ich gegen Ihre
      vorhandene index.html geprüft.
    */

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
        () => loadCore(true)
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

    setupCountdownTimer();

    setupTimer();

    if (
      token() &&
      proxyUrl()
    ) {
      loadCore(false);
    } else {
      openSettings();
    }
  }
);
