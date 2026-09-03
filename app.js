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

function esc(v){
  return String(v ?? '').replace(/[&<>"']/g,m=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[m]));
}

function fmt(v){
  if(v === null || v === undefined || v === ''){
    return '–';
  }

  if(typeof v === 'number'){
    return new Intl.NumberFormat('de-DE').format(v);
  }

  return String(v);
}

function setText(sel,val){
  const el = $(sel);

  if(el){
    el.textContent = val ?? '–';
  }
}

function token(){
  return (localStorage.getItem('rm_token') || '').trim();
}

function proxyUrl(){
  return (localStorage.getItem('rm_proxy') || '')
    .trim()
    .replace(/\/+$/,'');
}

function autoRefresh(){
  return localStorage.getItem('rm_auto') !== '0';
}

function sleep(ms){
  return new Promise(
    resolve=>setTimeout(resolve,ms)
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
  const box = $('#errorBox');

  if(!box){
    return;
  }

  box.textContent = text;
  box.classList.remove('hidden');
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

    err.rateLimited = true;

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

      err.rateLimited = true;

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

function effectIcon(type,debuff){

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

function currencyIcon(currency){

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

function normalizeShopOffers(d){

  if(
    Array.isArray(d)
  ){
    return d;
  }

  if(
    Array.isArray(
      d?.offers
    )
  ){
    return d.offers;
  }

  if(
    Array.isArray(
      d?.items
    )
  ){
    return d.items;
  }

  if(
    Array.isArray(
      d?.shop?.offers
    )
  ){
    return d.shop.offers;
  }

  if(
    Array.isArray(
      d?.shop?.items
    )
  ){
    return d.shop.items;
  }

  if(
    d &&
    typeof d === 'object'
  ){

    const values =
      Object.values(d);

    const arrayCandidate =
      values.find(
        value=>
          Array.isArray(value)
      );

    if(
      arrayCandidate
    ){
      return arrayCandidate;
    }
  }

  return [];
}

function renderShop(){

  const d =
    state.data.shop;

  const el =
    $('#shop');

  if(!el){
    return;
  }

  const offers =
    normalizeShopOffers(d);

  setText(
    '#shopCount',
    offers.length
  );

  if(
    !offers.length
  ){

    const keys =
      d &&
      typeof d === 'object'

        ? Object.keys(d)

        : [];

    el.innerHTML = `
      <div class="empty">

        Shop-Antwort erhalten,
        aber kein Angebot erkannt.

        ${
          keys.length

            ? `<br>API-Felder: ${
                esc(
                  keys.join(', ')
                )
              }`

            : ''
        }

      </div>
    `;

    return;
  }

  el.innerHTML =
    offers

      .map(
        offer=>{

          const name =
            offer.item_name ??
            offer.name ??
            offer.title ??
            offer.item?.name ??
            `Item ${
              offer.item_id ??
              offer.id ??
              ''
            }`;

          const price =
            offer.price ??
            offer.cost ??
            offer.amount ??
            offer.value;

          const currency =
            offer.currency ??
            offer.currency_name ??
            offer.cost_currency ??
            '';

          return `
            <div class="shopItem">

              <b>
                ${esc(name)}
              </b>

              <div class="price">

                ${currencyIcon(
                  currency
                )}

                ${fmt(
                  price
                )}

                ${esc(
                  currency
                )}

              </div>

            </div>
          `;
        }
      )

      .join('');
}

function eventLabelFromKey(key){

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

function isTrulyActive(value){

  if(
    value === true
  ){
    return true;
  }

  if(
    !value ||
    typeof value !== 'object'
  ){
    return false;
  }

  if(
    value.active === true
  ){
    return true;
  }

  if(
    value.is_active === true
  ){
    return true;
  }

  if(
    String(
      value.status || ''
    ).toLowerCase() ===
    'active'
  ){
    return true;
  }

  if(
    String(
      value.state || ''
    ).toLowerCase() ===
    'active'
  ){
    return true;
  }

  if(
    String(
      value.state || ''
    ).toLowerCase() ===
    'running'
  ){
    return true;
  }

  return false;
}

function collectActiveEvents(d){

  const active = [];

  Object.entries(
    d.weekly_events || {}
  )
    .forEach(
      ([key,value])=>{

        if(
          !isTrulyActive(
            value
          )
        ){
          return;
        }

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
    );

  Object.entries(
    d.events || {}
  )
    .forEach(
      ([key,value])=>{

        if(
          !isTrulyActive(
            value
          )
        ){
          return;
        }

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
    );

  return active;
}

function germanWeekday(day){

  const map = {
    0:'Sonntag',
    1:'Montag',
    2:'Dienstag',
    3:'Mittwoch',
    4:'Donnerstag',
    5:'Freitag',
    6:'Samstag'
  };

  return map[day] || '';
}

function parseWeekday(
  value,
  key=''
){

  const candidates = [
    value?.day,
    value?.weekday,
    value?.day_of_week,
    value?.schedule?.day,
    value?.schedule?.weekday
  ];

  for(
    const candidate
    of candidates
  ){

    if(
      candidate === null ||
      candidate === undefined
    ){
      continue;
    }

    if(
      Number.isInteger(
        Number(candidate)
      )
    ){

      const n =
        Number(candidate);

      if(
        n >= 0 &&
        n <= 6
      ){
        return n;
      }

      if(
        n >= 1 &&
        n <= 7
      ){
        return n % 7;
      }
    }

    const t =
      String(candidate)
        .toLowerCase();

    const names = {
      sunday:0,
      sonntag:0,
      monday:1,
      montag:1,
      tuesday:2,
      dienstag:2,
      wednesday:3,
      mittwoch:3,
      thursday:4,
      donnerstag:4,
      friday:5,
      freitag:5,
      saturday:6,
      samstag:6
    };

    if(
      names[t] !== undefined
    ){
      return names[t];
    }
  }

  const k =
    String(key)
      .toLowerCase();

  if(
    k.includes('monday') ||
    k.includes('montag')
  ){
    return 1;
  }

  if(
    k.includes('tuesday') ||
    k.includes('dienstag')
  ){
    return 2;
  }

  if(
    k.includes('wednesday') ||
    k.includes('mittwoch')
  ){
    return 3;
  }

  if(
    k.includes('thursday') ||
    k.includes('donnerstag')
  ){
    return 4;
  }

  if(
    k.includes('friday') ||
    k.includes('freitag')
  ){
    return 5;
  }

  if(
    k.includes('saturday') ||
    k.includes('samstag')
  ){
    return 6;
  }

  if(
    k.includes('sunday') ||
    k.includes('sonntag')
  ){
    return 0;
  }

  return null;
}

function collectUpcomingEvents(
  d,
  limit=2
){

  const now =
    new Date();

  const today =
    now.getDay();

  const upcoming = [];

  const ingest =
    (
      source,
      kind
    )=>{

      Object.entries(
        source || {}
      )
        .forEach(
          ([key,value])=>{

            if(
              isTrulyActive(
                value
              )
            ){
              return;
            }

            if(
              value === false ||
              value === null ||
              value === undefined
            ){
              return;
            }

            const day =
              parseWeekday(
                value,
                key
              );

            if(
              day === null
            ){
              return;
            }

            let delta =
              (
                day -
                today +
                7
              ) % 7;

            if(
              delta === 0
            ){
              delta = 7;
            }

            upcoming.push({
              kind,
              delta,
              day,

              name:
                value?.name ||
                eventLabelFromKey(
                  key
                ),

              desc:
                value?.description ||
                (
                  kind === 'weekly'
                    ? 'Regelmäßiges Wochen-Event'
                    : 'Kommendes Event'
                )
            });
          }
        );
    };

  ingest(
    d.weekly_events,
    'weekly'
  );

  ingest(
    d.events,
    'event'
  );

  return upcoming

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

function dayText(event){

  if(
    event.delta === 1
  ){
    return 'Morgen';
  }

  return (
    `In ${event.delta} Tagen`
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
            event=>`
              <div class="eventCard now">

                <div class="eventTitle">

                  <span>
                    ${event.icon}
                    ${esc(
                      event.name
                    )}
                  </span>

                  <span class="eventWhen">
                    JETZT
                  </span>

                </div>

                <div class="eventMeta">
                  ${esc(
                    event.meta
                  )}
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
    collectUpcomingEvents(
      d,
      2
    );

  if(nextEl){

    nextEl.innerHTML =
      upcoming.length

        ? upcoming

          .map(
            event=>`
              <div class="eventCard next">

                <div class="eventTitle">

                  <span>
                    📅
                    ${esc(
                      event.name
                    )}
                  </span>

                  <span class="eventWhen">
                    ${dayText(event)}
                  </span>

                </div>

                <div class="eventMeta">

                  ${esc(
                    event.desc
                  )}

                  ·

                  ${germanWeekday(
                    event.day
                  )}

                </div>

              </div>
            `
          )

          .join('')

        : (
          '<div class="empty">' +
          'Die API meldet aktuell kein eindeutig planbares nächstes Event.' +
          '</div>'
        );
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
            skill=>`
              <span
                class="chip ${
                  skill.active
                    ? 'active'
                    : ''
                }"
              >

                ${esc(
                  skill.name
                )}

                ·

                ${fmt(
                  skill.level
                )}

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

    const item =
      d[key];

    if(!item){
      continue;
    }

    const expiry =
      item.timer
        ? expiresAtMs(
            item.timer
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
            Stufe ${fmt(
              item.level
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
              item.in_progress

                ? (
                  remaining !== null

                    ? countdownText(
                        remaining
                      )

                    : `${fmt(
                        item.timer
                          ?.remaining_minutes
                      )} Min`
                )

                : 'bereit'
            }

          </div>

        </div>

        ${
          item.next_upgrade

            ? `
              <div class="itemMeta">

                Nächste Stufe:
                ${fmt(
                  item.next_upgrade.level
                )}

                ·

                ${fmt(
                  item.next_upgrade.cost_gold
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
        Level ${fmt(
          d.level
        )}
      </div>

      <div class="timer">
        ${esc(
          d.status || ''
        )}
      </div>

    </div>

    <div class="itemMeta">

      XP
      ${fmt(
        d.xp
      )}

      /

      ${fmt(
        d.xp_needed
      )}

      ·

      Futter
      ${fmt(
        d.food
      )}

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

  const task =
    d.current_task;

  if(!task){

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
    task.target

      ? Math.min(
        100,
        (
          Number(
            task.progress
          ) /
          Number(
            task.target
          )
        ) * 100
      )

      : 0;

  el.innerHTML = `
    <div class="outpostItem">

      <div class="itemName">

        ${esc(
          task.description ||
          task.ident ||
          'Aufgabe'
        )}

      </div>

      <div class="itemMeta">

        ${fmt(
          task.progress
        )}

        /

        ${fmt(
          task.target
        )}

      </div>

      <div class="progress">
        <i style="width:${pct}%"></i>
      </div>

    </div>
  `;
}

function renderLive(){
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
          key === 'shop'
        ){

          const shop =
            $('#shop');

          if(shop){

            shop.innerHTML = `
              <div class="empty">

                Shop konnte nicht geladen werden.

                <br>

                ${esc(
                  e.message ||
                  e
                )}

              </div>
            `;
          }

          setText(
            '#shopCount',
            '!'
          );
        }

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
