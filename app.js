const $ = (s) => document.querySelector(s);

const state = {
  data: {},
  busy: false,
  timer: null,
  countdownTimer: null,
  blockedUntil: 0
};

const AUTO_REFRESH_MS = 60000;
const BETWEEN_REQUESTS_MS = 350;
const MANUAL_COOLDOWN_MS = 8000;
let lastManualRefresh = 0;

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[m]));
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return '–';

  if (typeof v === 'number') {
    return new Intl.NumberFormat('de-DE').format(v);
  }

  return String(v);
}

function setText(sel, value) {
  const el = $(sel);

  if (el) {
    el.textContent = value ?? '–';
  }
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showError(text) {
  const box = $('#errorBox');

  if (!box) return;

  box.textContent = text;
  box.classList.remove('hidden');
}

function hideError() {
  $('#errorBox')?.classList.add('hidden');
}

/*
  WICHTIG:
  Die echte RitterManager-API liefert:
  {
    "success": true,
    "data": {...}
  }

  Deshalb entpacken wir "data" hier zentral.
*/
function unwrap(body) {
  if (
    body &&
    typeof body === 'object' &&
    body.success === true &&
    Object.prototype.hasOwnProperty.call(body, 'data')
  ) {
    return body.data;
  }

  return body;
}

function parseRetrySeconds(text) {
  const match = String(text || '')
    .match(/try again in\s+(\d+)\s+seconds?/i);

  return match
    ? Number(match[1])
    : null;
}

async function api(path) {
  if (Date.now() < state.blockedUntil) {
    const seconds = Math.ceil(
      (state.blockedUntil - Date.now()) / 1000
    );

    const err = new Error(
      `Rate-Limit-Pause: noch ${seconds} Sekunden.`
    );

    err.rateLimited = true;

    throw err;
  }

  const t = token();
  const proxy = proxyUrl();

  if (!t) {
    throw new Error('Kein API-Token gespeichert.');
  }

  if (!proxy) {
    throw new Error(
      'Keine Cloudflare-Worker-Adresse gespeichert.'
    );
  }

  let response;

  try {
    response = await fetch(
      proxy + path,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${t}`,
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }
    );
  } catch (e) {
    throw new Error(
      `Worker nicht erreichbar: ${e?.message || e}`
    );
  }

  const raw = await response.text();

  let body = null;

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

    if (response.status === 429) {
      const retry =
        parseRetrySeconds(detail) ?? 60;

      state.blockedUntil =
        Date.now() + retry * 1000;

      const err = new Error(
        `HTTP 429 – ${detail}`
      );

      err.rateLimited = true;

      throw err;
    }

    throw new Error(
      `${path}: HTTP ${response.status} – ${detail}`
    );
  }

  if (!body || typeof body !== 'object') {
    throw new Error(
      `${path}: ungültige JSON-Antwort.`
    );
  }

  return unwrap(body);
}

function countdownText(totalSeconds) {
  const seconds = Math.max(
    0,
    Math.ceil(Number(totalSeconds) || 0)
  );

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor((seconds % 3600) / 60);

  const rest =
    seconds % 60;

  if (hours > 0) {
    return (
      `${hours}:` +
      `${String(minutes).padStart(2,'0')}:` +
      `${String(rest).padStart(2,'0')}`
    );
  }

  return (
    `${minutes}:` +
    `${String(rest).padStart(2,'0')}`
  );
}

function expiresAtMs(obj) {
  if (
    !obj ||
    typeof obj !== 'object'
  ) {
    return null;
  }

  const absolute =
    obj.expires_at ??
    obj.finishes_at;

  if (
    absolute !== undefined &&
    absolute !== null
  ) {
    const number =
      Number(absolute);

    if (Number.isFinite(number)) {
      return number > 2000000000000
        ? number
        : number * 1000;
    }

    const parsed =
      Date.parse(absolute);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (obj.expires_datetime) {
    const parsed =
      Date.parse(obj.expires_datetime);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (
    Number.isFinite(
      Number(obj.remaining_seconds)
    )
  ) {
    return (
      Date.now() +
      Number(obj.remaining_seconds) * 1000
    );
  }

  if (
    Number.isFinite(
      Number(obj.remaining_minutes)
    )
  ) {
    return (
      Date.now() +
      Number(obj.remaining_minutes) * 60000
    );
  }

  return null;
}

function renderProfile() {
  const p =
    state.data.profile || {};

  setText(
    '#knightName',
    p.name || 'Mein Ritter'
  );

  setText(
    '#level',
    fmt(p.level)
  );

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
      : (
          p.status?.mode === 0
            ? 'Kein besonderer Standort'
            : 'Standort nicht gemeldet'
        )
  );

  const online =
    $('#online');

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

function renderSeason() {
  const s =
    state.data.season || {};

  if (
    s.season !== undefined
  ) {
    setText(
      '#season',
      `Saison ${s.season} · Tag ${s.day}` +
      (
        s.paused
          ? ' · pausiert'
          : ''
      )
    );
  } else {
    setText(
      '#season',
      'Persönliche Übersicht'
    );
  }
}

function renderSkills() {
  const d =
    state.data.skills || {};

  const renderList =
    (items, el) => {
      if (!el) return;

      el.innerHTML = '';

      if (
        !Array.isArray(items) ||
        !items.length
      ) {
        el.innerHTML =
          '<div class="small">' +
          'Keine Fähigkeiten gemeldet.' +
          '</div>';

        return;
      }

      [...items]
        .sort(
          (a,b) =>
            Number(b.active === true) -
            Number(a.active === true)
        )
        .forEach(skill => {
          el.insertAdjacentHTML(
            'beforeend',
            `<div class="skill ${
              skill.active
                ? 'active'
                : ''
            }">

              <div>

                <div class="skillName">
                  ${esc(skill.name)}
                </div>

                <div class="skillMeta">
                  Stufe ${fmt(skill.level)}
                </div>

              </div>

              ${
                skill.active
                  ? '<span class="badge">AKTIV</span>'
                  : ''
              }

            </div>`
          );
        });
    };

  renderList(
    d.combat,
    $('#combatSkills')
  );

  renderList(
    d.hunting,
    $('#huntSkills')
  );
}

function renderBuffs() {
  const d =
    state.data.buffs || {};

  const el =
    $('#buffs');

  if (!el) return;

  const all = [
    ...(
      Array.isArray(d.buffs)
        ? d.buffs.map(
            x => ({
              ...x,
              debuff:false
            })
          )
        : []
    ),

    ...(
      Array.isArray(d.debuffs)
        ? d.debuffs.map(
            x => ({
              ...x,
              debuff:true
            })
          )
        : []
    )
  ];

  if (!all.length) {
    el.innerHTML =
      '<div class="small">' +
      'Keine aktiven Wirkungen, Tränke oder Debuffs.' +
      '</div>';

    return;
  }

  el.innerHTML =
    all.map(effect => {
      const expiry =
        expiresAtMs(effect);

      const seconds =
        expiry
          ? Math.max(
              0,
              Math.ceil(
                (
                  expiry -
                  Date.now()
                ) / 1000
              )
            )
          : null;

      const source =
        effect.source_item?.name
          ? ` · Quelle: ${esc(
              effect.source_item.name
            )}`
          : '';

      const value =
        effect.value !== undefined
          ? ` · Wert ${fmt(effect.value)}`
          : '';

      return `
        <div class="buff">

          <div class="buffTop">

            <span>
              ${
                effect.debuff
                  ? '⚠ '
                  : ''
              }
              ${esc(
                effect.name ||
                effect.type ||
                'Wirkung'
              )}
            </span>

            <span
              ${
                expiry
                  ? `data-expires-at="${expiry}"`
                  : ''
              }
            >
              ${
                seconds !== null
                  ? countdownText(seconds)
                  : (
                      effect.remaining_minutes !== undefined
                        ? `${fmt(
                            effect.remaining_minutes
                          )} Min`
                        : '–'
                    )
              }
            </span>

          </div>

          <div class="buffDesc">

            ${esc(
              effect.description || ''
            )}

            ${value}
            ${source}

          </div>

        </div>
      `;
    }).join('');
}

function renderSmith() {
  const d =
    state.data.blacksmith || {};

  const el =
    $('#smith');

  if (!el) return;

  el.innerHTML = '';

  [
    ['sword','Schwert'],
    ['armor','Rüstung'],
    ['shelter','Unterkunft']
  ].forEach(
    ([key,label]) => {
      const item =
        d[key];

      if (!item) return;

      const expiry =
        item.timer
          ? expiresAtMs(
              item.timer
            )
          : null;

      let status =
        'bereit';

      if (item.in_progress) {
        status =
          expiry
            ? `⏳ <span data-expires-at="${expiry}">
                ${countdownText(
                  (
                    expiry -
                    Date.now()
                  ) / 1000
                )}
               </span>`
            : `⏳ ${fmt(
                item.timer?.remaining_minutes
              )} Min`;
      }

      const next =
        item.next_upgrade
          ? (
              `Nächste Stufe: ` +
              `${fmt(
                item.next_upgrade.level
              )} · ` +
              `${fmt(
                item.next_upgrade.cost_gold
              )} Gold`
            )
          : '';

      el.insertAdjacentHTML(
        'beforeend',
        `<div class="row">

          <span>
            ${label} · Stufe ${fmt(item.level)}
          </span>

          <strong>
            ${status}
          </strong>

        </div>

        ${
          next
            ? `<div
                class="small"
                style="margin:-4px 0 8px"
               >
                ${next}
               </div>`
            : ''
        }`
      );
    }
  );

  if (!el.innerHTML) {
    el.innerHTML =
      '<div class="small">' +
      'Keine Schmiededaten.' +
      '</div>';
  }
}

function renderDragon() {
  const d =
    state.data.dragon || {};

  const el =
    $('#dragon');

  if (!el) return;

  if (
    d.has_dragon === false
  ) {
    el.innerHTML =
      '<div class="small">' +
      'Noch kein Drache.' +
      '</div>';

    return;
  }

  if (
    d.level === undefined
  ) {
    el.innerHTML =
      '<div class="small">' +
      'Keine Drachendaten.' +
      '</div>';

    return;
  }

  const pct =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          d.xp_percent || 0
        )
      )
    );

  el.innerHTML = `
    <div class="row">
      <span>Status</span>
      <strong>${esc(d.status || '–')}</strong>
    </div>

    <div class="row">
      <span>Level</span>
      <strong>${fmt(d.level)}</strong>
    </div>

    <div class="row">
      <span>Futter</span>
      <strong>${fmt(d.food)}</strong>
    </div>

    <div
      class="small"
      style="margin-top:9px"
    >
      XP ${fmt(d.xp)}
      /
      ${fmt(d.xp_needed)}
      · ${fmt(d.xp_percent)}%
    </div>

    <div class="progress">
      <i style="width:${pct}%"></i>
    </div>
  `;
}

function renderOutpost() {
  const d =
    state.data.outpost || {};

  const task =
    d.current_task;

  const el =
    $('#outpost');

  if (!el) return;

  if (!task) {
    el.innerHTML = `
      <div class="small">
        Keine aktive Außenposten-Aufgabe.
      </div>

      <div class="row">
        <span>Erledigt</span>
        <strong>
          ${fmt(d.tasks_completed)}
        </strong>
      </div>

      <div class="row">
        <span>Offene Belohnungen</span>
        <strong>
          ${fmt(d.pending_rewards)}
        </strong>
      </div>
    `;

    return;
  }

  const pct =
    task.target
      ? Math.min(
          100,
          (
            Number(task.progress) /
            Number(task.target)
          ) * 100
        )
      : 0;

  el.innerHTML = `
    <div
      style="
        font-size:13px;
        font-weight:700
      "
    >
      ${esc(
        task.description ||
        task.ident ||
        'Aufgabe'
      )}
    </div>

    <div
      class="small"
      style="margin-top:8px"
    >
      ${fmt(task.progress)}
      /
      ${fmt(task.target)}
    </div>

    <div class="progress">
      <i style="width:${pct}%"></i>
    </div>

    <div
      class="small"
      style="margin-top:8px"
    >
      Erledigt:
      ${fmt(d.tasks_completed)}

      · Übersprungen:
      ${fmt(d.tasks_skipped)}

      · Belohnungen offen:
      ${fmt(d.pending_rewards)}
    </div>
  `;
}

function renderShop() {
  const d =
    state.data.shop || {};

  const el =
    $('#shop');

  if (!el) return;

  el.innerHTML = '';

  (d.offers || [])
    .forEach(offer => {
      el.insertAdjacentHTML(
        'beforeend',
        `<div class="shopItem">

          <b>
            ${esc(offer.item_name)}
          </b>

          <span>
            ${fmt(offer.price)}
            ${esc(offer.currency)}
          </span>

        </div>`
      );
    });

  if (!el.innerHTML) {
    el.innerHTML =
      '<div class="small">' +
      'Keine Shopangebote gemeldet.' +
      '</div>';
  }
}

function renderLive() {
  const d =
    state.data.live || {};

  const el =
    $('#live');

  if (!el) return;

  const active = [];

  if (
    d.tower?.phase
  ) {
    active.push(
      `Schwarzer Turm: ${d.tower.phase}`
    );
  }

  Object.entries(
    d.weekly_events || {}
  ).forEach(
    ([key,value]) => {
      if (
        value === true ||
        value?.active
      ) {
        active.push(
          key.replaceAll('_',' ')
        );
      }
    }
  );

  Object.entries(
    d.events || {}
  ).forEach(
    ([key,value]) => {
      if (
        value === true ||
        value?.active
      ) {
        active.push(
          key.replaceAll('_',' ')
        );
      }
    }
  );

  if (
    d.outpost_status
  ) {
    active.push(
      `Außenposten: ${d.outpost_status}`
    );
  }

  el.innerHTML =
    active.length
      ? active
          .map(
            value =>
              `<span
                class="pill"
                style="margin:3px"
               >
                ${esc(value)}
               </span>`
          )
          .join('')
      : '<div class="small">' +
        'Keine besonderen Live-Ereignisse aktiv.' +
        '</div>';
}

function updateCountdowns() {
  document
    .querySelectorAll(
      '[data-expires-at]'
    )
    .forEach(el => {
      const expiry =
        Number(
          el.dataset.expiresAt
        );

      if (
        !Number.isFinite(expiry)
      ) {
        return;
      }

      const seconds =
        Math.max(
          0,
          Math.ceil(
            (
              expiry -
              Date.now()
            ) / 1000
          )
        );

      el.textContent =
        countdownText(seconds);
    });
}

async function loadAll(force = false) {
  if (state.busy) {
    return;
  }

  if (force) {
    const now =
      Date.now();

    if (
      now -
      lastManualRefresh <
      MANUAL_COOLDOWN_MS
    ) {
      setText(
        '#refreshState',
        'Bitte kurz warten…'
      );

      return;
    }

    lastManualRefresh =
      now;
  }

  if (
    Date.now() <
    state.blockedUntil
  ) {
    const seconds =
      Math.ceil(
        (
          state.blockedUntil -
          Date.now()
        ) / 1000
      );

    setText(
      '#refreshState',
      `Rate-Limit-Pause · ${seconds}s`
    );

    return;
  }

  state.busy =
    true;

  $('#app')
    ?.classList
    .add('loading');

  setText(
    '#refreshState',
    'Aktualisiere…'
  );

  const endpoints = [
    ['profile','/v1/me'],
    ['season','/v1/game/season'],
    ['buffs','/v1/me/buffs'],
    ['skills','/v1/me/skills'],
    ['blacksmith','/v1/me/blacksmith'],
    ['dragon','/v1/me/dragon'],
    ['outpost','/v1/me/outpost'],
    ['shop','/v1/game/shop'],
    ['live','/v1/game/live']
  ];

  const errors = [];

  try {
    for (
      let i = 0;
      i < endpoints.length;
      i++
    ) {
      const [key,path] =
        endpoints[i];

      try {
        state.data[key] =
          await api(path);

        /*
          Jeder Bereich wird sofort angezeigt,
          sobald genau dieser API-Aufruf fertig ist.
        */
        if (key === 'profile') {
          renderProfile();
        }

        if (key === 'season') {
          renderSeason();
        }

        if (key === 'buffs') {
          renderBuffs();
        }

        if (key === 'skills') {
          renderSkills();
        }

        if (key === 'blacksmith') {
          renderSmith();
        }

        if (key === 'dragon') {
          renderDragon();
        }

        if (key === 'outpost') {
          renderOutpost();
        }

        if (key === 'shop') {
          renderShop();
        }

        if (key === 'live') {
          renderLive();
        }

      } catch (e) {
        errors.push(
          `${path}: ${e.message || e}`
        );

        /*
          Bei Rate Limit nicht noch acht weitere
          Requests hinterherschicken.
        */
        if (e.rateLimited) {
          break;
        }
      }

      if (
        i <
        endpoints.length - 1
      ) {
        await sleep(
          BETWEEN_REQUESTS_MS
        );
      }
    }

    updateCountdowns();

    if (errors.length) {
      showError(
        errors.join('\n')
      );

      setText(
        '#refreshState',
        state.data.profile
          ? 'Teilweise aktualisiert'
          : 'Aktualisierung fehlgeschlagen'
      );
    } else {
      hideError();

      setText(
        '#refreshState',
        `Aktuell · ${
          new Date()
            .toLocaleTimeString(
              'de-DE',
              {
                hour:'2-digit',
                minute:'2-digit',
                second:'2-digit'
              }
            )
        }`
      );
    }

  } finally {
    $('#app')
      ?.classList
      .remove('loading');

    state.busy =
      false;
  }
}

function openSettings() {
  const drawer =
    $('#drawer');

  if (!drawer) {
    return;
  }

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

  drawer.classList.add(
    'open'
  );
}

function closeSettings() {
  $('#drawer')
    ?.classList
    .remove('open');
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

  setupAutoRefresh();

  if (
    t &&
    proxy
  ) {
    loadAll(true);
  } else {
    openSettings();
  }
}

function forgetToken() {
  localStorage.removeItem(
    'rm_token'
  );

  if ($('#tokenInput')) {
    $('#tokenInput').value =
      '';
  }

  showError(
    'Token wurde auf diesem Gerät gelöscht.'
  );
}

function setupAutoRefresh() {
  if (state.timer) {
    clearInterval(
      state.timer
    );
  }

  state.timer =
    null;

  if (
    autoRefresh() &&
    token() &&
    proxyUrl()
  ) {
    state.timer =
      setInterval(
        () => loadAll(false),
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
      updateCountdowns,
      1000
    );
}

window.addEventListener(
  'load',
  () => {
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
        () => loadAll(true)
      );

    $('#drawer')
      ?.addEventListener(
        'click',
        event => {
          if (
            event.target?.id ===
            'drawer'
          ) {
            closeSettings();
          }
        }
      );

    setupCountdownTimer();

    setupAutoRefresh();

    if (
      token() &&
      proxyUrl()
    ) {
      loadAll(false);
    } else {
      openSettings();
    }
  }
);
