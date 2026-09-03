const $ = (s) => document.querySelector(s);

const state = {
  data: {},
  busy: false,
  timer: null,
  countdownTimer: null,
  blockedUntil: 0,
  installPrompt: null
};

const AUTO_REFRESH_MS = 60000;
const BETWEEN_REQUESTS_MS = 300;
const MANUAL_COOLDOWN_MS = 8000;

let lastManualRefresh = 0;

const WEEKLY_EVENTS = [
  {
    day:1,
    icon:'🏹',
    name:'Jagd-Montag',
    desc:'Regelmäßiges Montags-Event rund um Jagd und Düsterwald.'
  },
  {
    day:2,
    icon:'🎪',
    name:'Jahrmarkt',
    desc:'Regelmäßiges Dienstags-Event.'
  },
  {
    day:3,
    icon:'⚔️',
    name:'Kampfklassen / Turnier',
    desc:'Regelmäßiges Mittwochs-Event.'
  },
  {
    day:4,
    icon:'🏆',
    name:'Doppel-Ruhm',
    desc:'Regelmäßiges Donnerstags-Event.'
  },
  {
    day:5,
    icon:'🏰',
    name:'Ritterspiele – Registrierung',
    desc:'Freitags startet die Registrierung.'
  },
  {
    day:6,
    icon:'⚔️',
    name:'Ritterspiele – Kämpfe',
    desc:'Samstags laufen die Kämpfe.'
  },
  {
    day:0,
    icon:'👑',
    name:'Ritterspiele – Siegerehrung',
    desc:'Sonntags folgt die Siegerehrung.'
  }
];

function esc(v){
  return String(v ?? '').replace(
    /[&<>"']/g,
    m=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m])
  );
}

function fmt(v){
  if(
    v === null ||
    v === undefined ||
    v === ''
  ){
    return '–';
  }

  if(typeof v === 'number'){
    return new Intl.NumberFormat(
      'de-DE'
    ).format(v);
  }

  return String(v);
}

function setText(sel,val){
  const el = $(sel);

  if(el){
    el.textContent =
      val ?? '–';
  }
}

function token(){
  return (
    localStorage.getItem(
      'rm_token'
    ) || ''
  ).trim();
}

function proxyUrl(){
  return (
    localStorage.getItem(
      'rm_proxy'
    ) || ''
  )
    .trim()
    .replace(/\/+$/,'');
}

function autoRefresh(){
  return (
    localStorage.getItem(
      'rm_auto'
    ) !== '0'
  );
}

function sleep(ms){
  return new Promise(
    resolve=>setTimeout(
      resolve,
      ms
    )
  );
}

function unwrap(body){
  if(
    body &&
    typeof body === 'object' &&
    body.success === true &&
    Object.prototype.hasOwnProperty.call(
      body,
      'data'
    )
  ){
    return body.data;
  }

  return body;
}

function showError(text){
  const box =
    $('#errorBox');

  if(!box){
    return;
  }

  box.textContent =
    text;

  box.classList.remove(
    'hidden'
  );
}

function hideError(){
  $('#errorBox')
    ?.classList
    .add('hidden');
}

function parseRetrySeconds(text){
  const m =
    String(text || '')
      .match(
        /try again in\s+(\d+)\s+seconds?/i
      );

  return m
    ? Number(m[1])
    : null;
}

async function api(path){

  if(
    Date.now() <
    state.blockedUntil
  ){
    const sec =
      Math.ceil(
        (
          state.blockedUntil -
          Date.now()
        ) / 1000
      );

    const err =
      new Error(
        `Rate-Limit-Pause: noch ${sec} Sekunden.`
      );

    err.rateLimited =
      true;

    throw err;
  }

  if(!token()){
    throw new Error(
      'Kein API-Token gespeichert.'
    );
  }

  if(!proxyUrl()){
    throw new Error(
      'Keine Cloudflare-Worker-Adresse gespeichert.'
    );
  }

  let response;

  try{
    response =
      await fetch(
        proxyUrl()+path,
        {
          method:'GET',

          headers:{
            'Authorization':
              `Bearer ${token()}`,

            'Accept':
              'application/json'
          },

          cache:'no-store'
        }
      );

  }catch(e){

    throw new Error(
      `Worker nicht erreichbar: ${e?.message || e}`
    );

  }

  const raw =
    await response.text();

  let body =
    null;

  try{
    body =
      raw
        ? JSON.parse(raw)
        : null;
  }catch{}

  if(!response.ok){

    const detail =
      body?.error ||
      body?.message ||
      raw ||
      'keine Servermeldung';

    if(
      response.status === 429
    ){
      const retry =
        parseRetrySeconds(
          detail
        ) ?? 60;

      state.blockedUntil =
        Date.now() +
        retry * 1000;

      const err =
        new Error(
          `HTTP 429 – ${detail}`
        );

      err.rateLimited =
        true;

      throw err;
    }

    throw new Error(
      `${path}: HTTP ${response.status} – ${detail}`
    );
  }

  if(
    !body ||
    typeof body !== 'object'
  ){
    throw new Error(
      `${path}: ungültige JSON-Antwort.`
    );
  }

  return unwrap(body);
}

function countdownText(totalSeconds){

  const s =
    Math.max(
      0,
      Math.ceil(
        Number(totalSeconds) || 0
      )
    );

  const h =
    Math.floor(
      s / 3600
    );

  const m =
    Math.floor(
      (s % 3600) / 60
    );

  const r =
    s % 60;

  return h > 0

    ? (
      `${h}:` +
      `${String(m).padStart(2,'0')}:` +
      `${String(r).padStart(2,'0')}`
    )

    : (
      `${m}:` +
      `${String(r).padStart(2,'0')}`
    );
}

function expiresAtMs(obj){

  if(
    !obj ||
    typeof obj !== 'object'
  ){
    return null;
  }

  const absolute =
    obj.expires_at ??
    obj.finishes_at;

  if(
    absolute !== undefined &&
    absolute !== null
  ){

    const n =
      Number(absolute);

    if(
      Number.isFinite(n)
    ){
      return n > 2e12
        ? n
        : n * 1000;
    }

    const parsed =
      Date.parse(
        absolute
      );

    if(
      Number.isFinite(
        parsed
      )
    ){
      return parsed;
    }
  }

  if(
    obj.expires_datetime
  ){

    const parsed =
      Date.parse(
        obj.expires_datetime
      );

    if(
      Number.isFinite(
        parsed
      )
    ){
      return parsed;
    }
  }

  if(
    Number.isFinite(
      Number(
        obj.remaining_seconds
      )
    )
  ){
    return (
      Date.now() +
      Number(
        obj.remaining_seconds
      ) * 1000
    );
  }

  if(
    Number.isFinite(
      Number(
        obj.remaining_minutes
      )
    )
  ){
    return (
      Date.now() +
      Number(
        obj.remaining_minutes
      ) * 60000
    );
  }

  return null;
}

function effectIcon(
  type,
  debuff
){

  if(debuff){
    return '☠️';
  }

  const icons = {
    aim:'🎯',
    all_hunt:'🏹',
    breakthrough:'💥',
    fix_hp:'❤️',
    forest_xp:'🌲',
    hunting_skills:'🦌',
    ice:'❄️',
    loot_bonus:'🎁',
    marks:'🐾',
    max_hp:'💚',
    str:'💪',
    threat:'⚠️'
  };

  return (
    icons[type] ||
    '✨'
  );
}

function currencyIcon(
  currency
){

  const c =
    String(
      currency || ''
    ).toLowerCase();

  if(
    c.includes('diamond')
  ){
    return '💎';
  }

  if(
    c.includes('gold')
  ){
    return '🪙';
  }

  if(
    c.includes('arrow')
  ){
    return '🏹';
  }

  return '◈';
}

function renderProfile(){

  const p =
    state.data.profile || {};

  setText(
    '#knightName',
    p.name ||
    'Mein Ritter'
  );

  setText(
    '#level',
    fmt(p.level)
  );

  setText(
    '#gold',
    fmt(
      p.currencies?.gold
    )
  );

  setText(
    '#diamonds',
    fmt(
      p.currencies?.diamonds
    )
  );

  setText(
    '#honor',
    fmt(
      p.ranking?.honor
    )
  );

  setText(
    '#rank',
    fmt(
      p.ranking?.position ??
      p.rank?.number
    )
  );

  setText(
    '#sword',
    fmt(
      p.upgrades?.sword
    )
  );

  setText(
    '#armor',
    fmt(
      p.upgrades?.armor
    )
  );

  setText(
    '#shelter',
    fmt(
      p.upgrades?.shelter
    )
  );

  setText(
    '#adventure',
    fmt(
      p.progress?.adventure
    )
  );

  setText(
    '#tower',
    fmt(
      p.progress?.tower
    )
  );

  setText(
    '#huntLevel',
    fmt(
      p.hunting?.level
    )
  );

  setText(
    '#huntKills',
    fmt(
      p.hunting?.kills
    )
  );

  setText(
    '#huntPoints',
    fmt(
      p.hunting?.points
    )
  );

  setText(
    '#cooking',
    fmt(
      p.crafting?.cooking
    )
  );

  setText(
    '#engineering',
    fmt(
      p.crafting?.engineering
    )
  );

  const parts = [];

  if(
    p.rank?.title
  ){
    parts.push(
      p.rank.title
    );
  }

  if(
    p.title
  ){
    parts.push(
      p.title
    );
  }

  if(
    p.ranking?.division !== undefined
  ){
    parts.push(
      `Division ${p.ranking.division}`
    );
  }

  setText(
    '#rankTitle',
    parts.join(' · ') ||
    'Ritterprofil'
  );

  setText(
    '#location',
    p.status?.location

      ? `📍 ${p.status.location}`

      : (
        p.status?.mode === 0
          ? '📍 Unterwegs'
          : 'Standort unbekannt'
      )
  );

  const online =
    $('#online');

  if(online){

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

function renderSeason(){

  const s =
    state.data.season || {};

  setText(
    '#season',
    s.season !== undefined

      ? (
        `Saison ${s.season}` +
        ` · Tag ${s.day}` +
        (
          s.paused
            ? ' · pausiert'
            : ''
        )
      )

      : 'Persönliche Übersicht'
  );
}

function renderBuffs(){

  const d =
    state.data.buffs || {};

  const el =
    $('#buffs');

  if(!el){
    return;
  }

  const all = [

    ...(
      Array.isArray(
        d.buffs
      )

        ? d.buffs.map(
          x=>({
            ...x,
            debuff:false
          })
        )

        : []
    ),

    ...(
      Array.isArray(
        d.debuffs
      )

        ? d.debuffs.map(
          x=>({
            ...x,
            debuff:true
          })
        )

        : []
    )
  ];

  setText(
    '#buffCount',
    all.length
  );

  if(
    !all.length
  ){
    el.innerHTML =
      '<div class="empty">' +
      'Keine aktiven Wirkungen oder Debuffs.' +
      '</div>';

    return;
  }

  el.innerHTML =
    all

      .sort(
        (a,b)=>
          (
            expiresAtMs(a) ||
            Infinity
          ) -
          (
            expiresAtMs(b) ||
            Infinity
          )
      )

      .map(
        effect=>{

          const expiry =
            expiresAtMs(
              effect
            );

          const remaining =
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
            effect
              .source_item
              ?.name

              ? (
                `Quelle: ` +
                esc(
                  effect
                    .source_item
                    .name
                )
              )

              : '';

          const value =
            effect.value !==
            undefined

              ? (
                `Wert: ` +
                fmt(
                  effect.value
                )
              )

              : '';

          return `
            <div class="effectItem">

              <div class="effectTop">

                <div class="effectName">

                  ${effectIcon(
                    effect.type,
                    effect.debuff
                  )}

                  ${esc(
                    effect.name ||
                    effect.type ||
                    'Wirkung'
                  )}

                </div>

                <div
                  class="timer"
                  ${
                    expiry
                      ? `data-expires-at="${expiry}"`
                      : ''
                  }
                >

                  ${
                    remaining !== null

                      ? countdownText(
                          remaining
                        )

                      : (
                        effect.remaining_minutes !== undefined

                          ? `${fmt(
                              effect.remaining_minutes
                            )} Min`

                          : '–'
                      )
                  }

                </div>

              </div>

              <div class="effectDesc">

                ${esc(
                  effect.description ||
                  ''
                )}

                ${
                  value ||
                  source

                    ? `<br>${
                        [
                          value,
                          source
                        ]
                        .filter(Boolean)
                        .join(' · ')
                      }`

                    : ''
                }

              </div>

            </div>
          `;
        }
      )

      .join('');
}

function renderShop(){

  const d =
    state.data.shop;

  const el =
    $('#shop');

  if(!el){
    return;
  }

  let offers = [];

  if(
    Array.isArray(d)
  ){
    offers = d;
  }

  else if(
    Array.isArray(
      d?.offers
    )
  ){
    offers =
      d.offers;
  }

  else if(
    Array.isArray(
      d?.items
    )
  ){
    offers =
      d.items;
  }

  setText(
    '#shopCount',
    offers.length
  );

  if(
    !offers.length
  ){
    el.innerHTML =
      '<div class="empty">' +
      'Aktuell wurden keine Shopangebote von der API gemeldet.' +
      '</div>';

    return;
  }

  el.innerHTML =
    offers

      .map(
        o=>`
          <div class="shopItem">

            <b>
              ${esc(
                o.item_name ??
                o.name ??
                `Item ${
                  o.item_id ??
                  o.id ??
                  ''
                }`
              )}
            </b>

            <div class="price">

              ${currencyIcon(
                o.currency
              )}

              ${fmt(
                o.price
              )}

              ${esc(
                o.currency ||
                ''
              )}

            </div>

          </div>
        `
      )

      .join('');
}

function eventLabelFromKey(
  key
){

  return String(
    key || ''
  )
    .replaceAll(
      '_',
      ' '
    )
    .replace(
      /\b\w/g,
      m=>m.toUpperCase()
    );
}

function collectActiveEvents(
  d
){

  const active = [];

  if(
    d.tower?.phase
  ){
    active.push({
      icon:'🗼',
      name:
        `Schwarzer Turm: ${d.tower.phase}`,
      meta:
        'Aktiver Turmstatus'
    });
  }

  if(
    d.outpost_status
  ){
    active.push({
      icon:'🏕️',
      name:
        `Außenposten: ${d.outpost_status}`,
      meta:
        'Aktueller Außenpostenstatus'
    });
  }

  Object.entries(
    d.weekly_events || {}
  )
    .forEach(
      ([key,value])=>{

        if(
          value === true ||
          value?.active
        ){
          active.push({
            icon:'📅',

            name:
              value?.name ||
              eventLabelFromKey(
                key
              ),

            meta:
              value?.description ||
              'Regelmäßiges Wochen-Event'
          });
        }
      }
    );

  Object.entries(
    d.events || {}
  )
    .forEach(
      ([key,value])=>{

        if(
          value === true ||
          value?.active
        ){
          active.push({
            icon:'✨',

            name:
              value?.name ||
              eventLabelFromKey(
                key
              ),

            meta:
              value?.description ||
              'Sonder-Event'
          });
        }
      }
    );

  return active;
}

function nextWeeklyEvents(
  limit = 2
){

  const now =
    new Date();

  const today =
    now.getDay();

  return WEEKLY_EVENTS

    .map(
      event=>{

        let delta =
          (
            event.day -
            today +
            7
          ) % 7;

        if(
          delta === 0
        ){
          delta = 7;
        }

        return {
          ...event,
          delta
        };
      }
    )

    .sort(
      (a,b)=>
        a.delta -
        b.delta
    )

    .slice(
      0,
      limit
    );
}

function dayText(
  delta
){

  if(
    delta === 1
  ){
    return 'Morgen';
  }

  return (
    `In ${delta} Tagen`
  );
}

function renderEvents(){

  const d =
    state.data.live || {};

  const nowEl =
    $('#eventsNow');

  const nextEl =
    $('#eventsNext');

  const active =
    collectActiveEvents(
      d
    );

  if(nowEl){

    nowEl.innerHTML =
      active.length

        ? active
          .map(
            e=>`
              <div class="eventCard now">

                <div class="eventTitle">

                  <span>
                    ${e.icon}
                    ${esc(e.name)}
                  </span>

                  <span class="eventWhen">
                    JETZT
                  </span>

                </div>

                <div class="eventMeta">
                  ${esc(e.meta)}
                </div>

              </div>
            `
          )
          .join('')

        : (
          '<div class="empty">' +
          'Laut API ist gerade kein besonderes Event aktiv.' +
          '</div>'
        );
  }

  const upcoming =
    nextWeeklyEvents(2);

  if(nextEl){

    nextEl.innerHTML =
      upcoming

        .map(
          e=>`
            <div class="eventCard next">

              <div class="eventTitle">

                <span>
                  ${e.icon}
                  ${esc(e.name)}
                </span>

                <span class="eventWhen">
                  ${dayText(e.delta)}
                </span>

              </div>

              <div class="eventMeta">

                ${esc(e.desc)}
                · aus dem regelmäßigen Wochenplan

              </div>

            </div>
          `
        )

        .join('');
  }
}

function renderSkills(){

  const d =
    state.data.skills || {};

  const fill =
    (
      el,
      items
    )=>{

      if(!el){
        return;
      }

      if(
        !Array.isArray(items) ||
        !items.length
      ){
        el.innerHTML =
          '<span class="empty">' +
          'Keine Daten' +
          '</span>';

        return;
      }

      el.innerHTML =
        [...items]

          .sort(
            (a,b)=>
              Number(
                b.active === true
              ) -
              Number(
                a.active === true
              )
          )

          .map(
            s=>`
              <span
                class="chip ${
                  s.active
                    ? 'active'
                    : ''
                }"
              >
                ${esc(s.name)}
                ·
                ${fmt(s.level)}
              </span>
            `
          )

          .join('');
    };

  fill(
    $('#combatSkills'),
    d.combat
  );

  fill(
    $('#huntSkills'),
    d.hunting
  );
}

function renderSmith(){

  const d =
    state.data.blacksmith || {};

  const el =
    $('#smith');

  if(!el){
    return;
  }

  const map = [
    ['sword','Schwert'],
    ['armor','Rüstung'],
    ['shelter','Unterkunft']
  ];

  const rows = [];

  for(
    const [key,label]
    of map
  ){

    const x =
      d[key];

    if(!x){
      continue;
    }

    const expiry =
      x.timer
        ? expiresAtMs(
            x.timer
          )
        : null;

    const remaining =
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

    rows.push(`
      <div class="smithItem">

        <div class="itemTop">

          <div class="itemName">
            ${label}
            ·
            Stufe ${fmt(x.level)}
          </div>

          <div
            class="timer"
            ${
              expiry
                ? `data-expires-at="${expiry}"`
                : ''
            }
          >

            ${
              x.in_progress

                ? (
                  remaining !== null

                    ? countdownText(
                        remaining
                      )

                    : `${fmt(
                        x.timer?.remaining_minutes
                      )} Min`
                )

                : 'bereit'
            }

          </div>

        </div>

        ${
          x.next_upgrade

            ? `
              <div class="itemMeta">
                Nächste Stufe:
                ${fmt(
                  x.next_upgrade.level
                )}
                ·
                ${fmt(
                  x.next_upgrade.cost_gold
                )}
                🪙
              </div>
            `

            : ''
        }

      </div>
    `);
  }

  el.innerHTML =
    rows.length

      ? rows.join('')

      : (
        '<div class="empty">' +
        'Keine Schmiededaten.' +
        '</div>'
      );
}

function renderDragon(){

  const d =
    state.data.dragon || {};

  const el =
    $('#dragon');

  if(!el){
    return;
  }

  if(
    d.has_dragon === false
  ){
    el.innerHTML =
      '<div class="empty">' +
      'Noch kein Drache.' +
      '</div>';

    return;
  }

  if(
    d.level === undefined
  ){
    el.innerHTML =
      '<div class="empty">' +
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
          d.xp_percent ||
          0
        )
      )
    );

  el.innerHTML = `
    <div class="itemTop">

      <div class="itemName">
        Level ${fmt(d.level)}
      </div>

      <div class="timer">
        ${esc(
          d.status || ''
        )}
      </div>

    </div>

    <div class="itemMeta">
      XP ${fmt(d.xp)}
      /
      ${fmt(d.xp_needed)}
      ·
      Futter ${fmt(d.food)}
    </div>

    <div class="progress">
      <i style="width:${pct}%"></i>
    </div>
  `;
}

function renderOutpost(){

  const d =
    state.data.outpost || {};

  const el =
    $('#outpost');

  if(!el){
    return;
  }

  const t =
    d.current_task;

  if(!t){

    el.innerHTML = `
      <div class="empty">
        Keine aktive Aufgabe.
      </div>

      <div class="itemMeta">
        Erledigt:
        ${fmt(
          d.tasks_completed
        )}
        ·
        Belohnungen offen:
        ${fmt(
          d.pending_rewards
        )}
      </div>
    `;

    return;
  }

  const pct =
    t.target

      ? Math.min(
        100,
        (
          Number(t.progress) /
          Number(t.target)
        ) * 100
      )

      : 0;

  el.innerHTML = `
    <div class="outpostItem">

      <div class="itemName">
        ${esc(
          t.description ||
          t.ident ||
          'Aufgabe'
        )}
      </div>

      <div class="itemMeta">
        ${fmt(t.progress)}
        /
        ${fmt(t.target)}
      </div>

      <div class="progress">
        <i style="width:${pct}%"></i>
      </div>

    </div>
  `;
}

function renderLive(){

  const d =
    state.data.live || {};

  const el =
    $('#live');

  if(!el){
    return;
  }

  const active = [];

  if(
    d.tower?.phase
  ){
    active.push(
      `Turm: ${d.tower.phase}`
    );
  }

  if(
    d.outpost_status
  ){
    active.push(
      `Außenposten: ${d.outpost_status}`
    );
  }

  Object.entries(
    d.weekly_events || {}
  )
    .forEach(
      ([k,v])=>{

        if(
          v === true ||
          v?.active
        ){
          active.push(
            k.replaceAll(
              '_',
              ' '
            )
          );
        }
      }
    );

  Object.entries(
    d.events || {}
  )
    .forEach(
      ([k,v])=>{

        if(
          v === true ||
          v?.active
        ){
          active.push(
            k.replaceAll(
              '_',
              ' '
            )
          );
        }
      }
    );

  el.innerHTML =
    active.length

      ? active
        .map(
          x=>`
            <span class="chip active">
              ${esc(x)}
            </span>
          `
        )
        .join('')

      : (
        '<span class="empty">' +
        'Keine besonderen Ereignisse aktiv.' +
        '</span>'
      );

  renderEvents();
}

function updateCountdowns(){

  document
    .querySelectorAll(
      '[data-expires-at]'
    )
    .forEach(
      el=>{

        const expiry =
          Number(
            el.dataset.expiresAt
          );

        if(
          !Number.isFinite(
            expiry
          )
        ){
          return;
        }

        el.textContent =
          countdownText(
            Math.max(
              0,
              Math.ceil(
                (
                  expiry -
                  Date.now()
                ) / 1000
              )
            )
          );
      }
    );
}

async function loadAll(
  force = false
){

  if(
    state.busy
  ){
    return;
  }

  if(force){

    const now =
      Date.now();

    if(
      now -
      lastManualRefresh <
      MANUAL_COOLDOWN_MS
    ){
      setText(
        '#refreshState',
        'Bitte kurz warten…'
      );

      return;
    }

    lastManualRefresh =
      now;
  }

  if(
    Date.now() <
    state.blockedUntil
  ){

    const sec =
      Math.ceil(
        (
          state.blockedUntil -
          Date.now()
        ) / 1000
      );

    setText(
      '#refreshState',
      `Rate-Limit-Pause · ${sec}s`
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

    [
      'profile',
      '/v1/me',
      renderProfile
    ],

    [
      'buffs',
      '/v1/me/buffs',
      renderBuffs
    ],

    [
      'shop',
      '/v1/game/shop',
      renderShop
    ],

    [
      'season',
      '/v1/game/season',
      renderSeason
    ],

    [
      'skills',
      '/v1/me/skills',
      renderSkills
    ],

    [
      'blacksmith',
      '/v1/me/blacksmith',
      renderSmith
    ],

    [
      'dragon',
      '/v1/me/dragon',
      renderDragon
    ],

    [
      'outpost',
      '/v1/me/outpost',
      renderOutpost
    ],

    [
      'live',
      '/v1/game/live',
      renderLive
    ]
  ];

  const errors = [];

  try{

    for(
      let i=0;
      i<endpoints.length;
      i++
    ){

      const [
        key,
        path,
        renderer
      ] =
        endpoints[i];

      try{

        state.data[key] =
          await api(path);

        renderer();

      }catch(e){

        errors.push(
          `${path}: ${e.message || e}`
        );

        if(
          e.rateLimited
        ){
          break;
        }
      }

      if(
        i <
        endpoints.length-1
      ){
        await sleep(
          BETWEEN_REQUESTS_MS
        );
      }
    }

    updateCountdowns();

    if(
      errors.length
    ){

      showError(
        errors.join('\n')
      );

      setText(
        '#refreshState',
        state.data.profile
          ? 'Teilweise aktualisiert'
          : 'Fehler'
      );

    }else{

      hideError();

      localStorage.setItem(
        'rm_last_sync',
        String(
          Date.now()
        )
      );

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

  }finally{

    $('#app')
      ?.classList
      .remove('loading');

    state.busy =
      false;
  }
}

function openSettings(){

  const drawer =
    $('#drawer');

  if(!drawer){
    return;
  }

  $('#tokenInput').value =
    token();

  $('#proxyInput').value =
    proxyUrl();

  $('#autoInput').checked =
    autoRefresh();

  drawer.classList.add(
    'open'
  );
}

function closeSettings(){

  $('#drawer')
    ?.classList
    .remove('open');
}

function saveSettings(){

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
      .replace(
        /\/+$/,
        ''
      );

  if(t){

    localStorage.setItem(
      'rm_token',
      t
    );

  }else{

    localStorage.removeItem(
      'rm_token'
    );
  }

  if(proxy){

    localStorage.setItem(
      'rm_proxy',
      proxy
    );

  }else{

    localStorage.removeItem(
      'rm_proxy'
    );
  }

  localStorage.setItem(
    'rm_auto',
    $('#autoInput')
      ?.checked

      ? '1'

      : '0'
  );

  closeSettings();

  setupAutoRefresh();

  if(
    t &&
    proxy
  ){
    loadAll(true);
  }else{
    openSettings();
  }
}

function forgetToken(){

  localStorage.removeItem(
    'rm_token'
  );

  if(
    $('#tokenInput')
  ){
    $('#tokenInput').value =
      '';
  }

  showError(
    'Token wurde auf diesem Gerät gelöscht.'
  );
}

function setupAutoRefresh(){

  if(
    state.timer
  ){
    clearInterval(
      state.timer
    );
  }

  state.timer =
    null;

  if(
    autoRefresh() &&
    token() &&
    proxyUrl()
  ){

    state.timer =
      setInterval(
        ()=>{

          if(
            document.visibilityState ===
            'visible'
          ){
            loadAll(false);
          }

        },
        AUTO_REFRESH_MS
      );
  }
}

function setupCountdownTimer(){

  if(
    state.countdownTimer
  ){
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

function setupInstall(){

  const standalone =
    window
      .matchMedia(
        '(display-mode: standalone)'
      )
      .matches
    ||
    window.navigator.standalone ===
      true;

  if(standalone){

    document.body
      .classList
      .add(
        'standalone'
      );
  }

  window.addEventListener(
    'beforeinstallprompt',
    event=>{

      event.preventDefault();

      state.installPrompt =
        event;

      $('#installBtn')
        ?.classList
        .remove(
          'hidden'
        );
    }
  );

  $('#installBtn')
    ?.addEventListener(
      'click',
      async()=>{

        if(
          !state.installPrompt
        ){
          return;
        }

        state.installPrompt
          .prompt();

        await state.installPrompt
          .userChoice;

        state.installPrompt =
          null;

        $('#installBtn')
          ?.classList
          .add(
            'hidden'
          );
      }
    );

  window.addEventListener(
    'appinstalled',
    ()=>{

      state.installPrompt =
        null;

      $('#installBtn')
        ?.classList
        .add(
          'hidden'
        );
    }
  );
}

window.addEventListener(
  'load',
  ()=>{

    setupInstall();

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
        ()=>loadAll(true)
      );

    $('#drawer')
      ?.addEventListener(
        'click',
        e=>{

          if(
            e.target?.id ===
            'drawer'
          ){
            closeSettings();
          }
        }
      );

    document.addEventListener(
      'visibilitychange',
      ()=>{

        if(
          document.visibilityState ===
            'visible'
          &&
          token()
          &&
          proxyUrl()
        ){

          const last =
            Number(
              localStorage.getItem(
                'rm_last_sync'
              ) || 0
            );

          if(
            Date.now() -
            last >
            45000
          ){
            loadAll(false);
          }
        }
      }
    );

    setupCountdownTimer();

    setupAutoRefresh();

    if(
      'serviceWorker'
      in navigator
    ){

      navigator
        .serviceWorker
        .register(
          './service-worker.js?v=4'
        )
        .catch(()=>{});
    }

    if(
      token() &&
      proxyUrl()
    ){
      loadAll(false);
    }else{
      openSettings();
    }
  }
);
