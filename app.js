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


/*
  Offizieller regelmäßiger Wochenplan
  aus der Knight-Manager-API-Dokumentation.
*/

const WEEKLY_EVENTS = [

  {
    day: 1,
    key: 'hunting_monday',
    icon: '🏹',
    name: 'Jagd-Montag',
    desc: 'Garantiertes Jagdturnier jede Stunde + doppelter Preispool.'
  },

  {
    day: 2,
    key: 'funfair',
    icon: '🎪',
    name: 'Jahrmarkt',
    desc: 'Glücksrad mit Gegenstands-Preisen.'
  },

  {
    day: 3,
    key: 'combat_division',
    icon: '🛡️',
    name: 'Kampfklassen-Auswertung',
    desc: 'Mittwoch um 12:01 CET.'
  },

  {
    day: 3,
    key: 'combat_tournament_wednesday',
    icon: '⚔️',
    name: 'Kampfturnier-Mittwoch',
    desc: 'Garantiertes Kampfturnier jede Stunde + doppelter Preispool.'
  },

  {
    day: 4,
    key: 'double_thursday',
    icon: '🏆',
    name: 'Doppel-Ruhm',
    desc: 'Doppelter Ruhm aus Kämpfen.'
  },

  {
    day: 5,
    key: 'knight_games',
    icon: '🏰',
    name: 'Ritterspiele – Registrierung',
    desc: 'Freitag: Registrierung.'
  },

  {
    day: 6,
    key: 'knight_games',
    icon: '⚔️',
    name: 'Ritterspiele – Kämpfe',
    desc: 'Samstag: Kämpfe.'
  },

  {
    day: 0,
    key: 'knight_games',
    icon: '👑',
    name: 'Ritterspiele – Siegerehrung',
    desc: 'Sonntag: Siegerehrung und Belohnungen.'
  }

];


function esc(v){

  return String(v ?? '')
    .replace(
      /[&<>"']/g,
      m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
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

  if(
    typeof v === 'number'
  ){
    return new Intl.NumberFormat(
      'de-DE'
    ).format(v);
  }

  return String(v);

}


function setText(
  selector,
  value
){

  const el =
    $(selector);

  if(el){
    el.textContent =
      value ?? '–';
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
    .replace(
      /\/+$/,
      ''
    );

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
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


/*
  Knight-Manager liefert echte Antworten
  teilweise als:

  {
    success: true,
    data: { ... }
  }
*/

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
    .add(
      'hidden'
    );

}


function parseRetrySeconds(text){

  const match =
    String(text || '')
      .match(
        /try again in\s+(\d+)\s+seconds?/i
      );

  return match
    ? Number(match[1])
    : null;

}


async function api(path){

  if(
    Date.now() <
    state.blockedUntil
  ){

    const seconds =
      Math.ceil(
        (
          state.blockedUntil -
          Date.now()
        ) / 1000
      );

    const error =
      new Error(
        `Rate-Limit-Pause: noch ${seconds} Sekunden.`
      );

    error.rateLimited =
      true;

    throw error;

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

        proxyUrl() + path,

        {
          method: 'GET',

          headers: {

            'Authorization':
              `Bearer ${token()}`,

            'Accept':
              'application/json'

          },

          cache:
            'no-store'

        }

      );

  }catch(error){

    throw new Error(
      `Worker nicht erreichbar: ${
        error?.message ||
        error
      }`
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


      const error =
        new Error(
          `HTTP 429 – ${detail}`
        );


      error.rateLimited =
        true;


      throw error;

    }


    throw new Error(
      `${path}: HTTP ${
        response.status
      } – ${
        detail
      }`
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


  return unwrap(
    body
  );

}


/* =========================
   COUNTDOWNS
========================= */

function countdownText(
  totalSeconds
){

  const seconds =
    Math.max(
      0,
      Math.ceil(
        Number(
          totalSeconds
        ) || 0
      )
    );


  const hours =
    Math.floor(
      seconds / 3600
    );


  const minutes =
    Math.floor(
      (
        seconds % 3600
      ) / 60
    );


  const rest =
    seconds % 60;


  if(
    hours > 0
  ){

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

    const number =
      Number(
        absolute
      );


    if(
      Number.isFinite(
        number
      )
    ){

      return (
        number > 2e12
          ? number
          : number * 1000
      );

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


/* =========================
   PROFIL
========================= */

function renderProfile(){

  const profile =
    state.data.profile || {};


  setText(
    '#knightName',
    profile.name ||
    'Mein Ritter'
  );


  setText(
    '#level',
    fmt(
      profile.level
    )
  );


  setText(
    '#gold',
    fmt(
      profile
        .currencies
        ?.gold
    )
  );


  setText(
    '#diamonds',
    fmt(
      profile
        .currencies
        ?.diamonds
    )
  );


  setText(
    '#honor',
    fmt(
      profile
        .ranking
        ?.honor
    )
  );


  setText(
    '#rank',
    fmt(
      profile
        .ranking
        ?.position
      ??
      profile
        .rank
        ?.number
    )
  );


  setText(
    '#sword',
    fmt(
      profile
        .upgrades
        ?.sword
    )
  );


  setText(
    '#armor',
    fmt(
      profile
        .upgrades
        ?.armor
    )
  );


  setText(
    '#shelter',
    fmt(
      profile
        .upgrades
        ?.shelter
    )
  );


  setText(
    '#adventure',
    fmt(
      profile
        .progress
        ?.adventure
    )
  );


  setText(
    '#tower',
    fmt(
      profile
        .progress
        ?.tower
    )
  );


  setText(
    '#huntLevel',
    fmt(
      profile
        .hunting
        ?.level
    )
  );


  setText(
    '#huntKills',
    fmt(
      profile
        .hunting
        ?.kills
    )
  );


  setText(
    '#huntPoints',
    fmt(
      profile
        .hunting
        ?.points
    )
  );


  setText(
    '#cooking',
    fmt(
      profile
        .crafting
        ?.cooking
    )
  );


  setText(
    '#engineering',
    fmt(
      profile
        .crafting
        ?.engineering
    )
  );


  const titleParts =
    [];


  if(
    profile.rank?.title
  ){

    titleParts.push(
      profile.rank.title
    );

  }


  if(
    profile.title
  ){

    titleParts.push(
      profile.title
    );

  }


  if(
    profile
      .ranking
      ?.division !==
      undefined
  ){

    titleParts.push(
      `Division ${
        profile
          .ranking
          .division
      }`
    );

  }


  setText(
    '#rankTitle',
    titleParts.join(
      ' · '
    ) ||
    'Ritterprofil'
  );


  setText(

    '#location',

    profile.status?.location

      ? (
        `📍 ${
          profile.status.location
        }`
      )

      : (
        profile.status?.mode === 0

          ? '📍 Unterwegs'

          : 'Standort unbekannt'
      )

  );


  const online =
    $('#online');


  if(online){

    online.textContent =
      profile.status?.online
        ? 'ONLINE'
        : 'OFFLINE';


    online.className =
      profile.status?.online
        ? 'online'
        : 'online offline';

  }

}


/* =========================
   SAISON
========================= */

function renderSeason(){

  const season =
    state.data.season || {};


  setText(

    '#season',

    season.season !==
    undefined

      ? (
        `Saison ${
          season.season
        } · Tag ${
          season.day
        }${
          season.paused
            ? ' · pausiert'
            : ''
        }`
      )

      : 'Persönliche Übersicht'

  );

}


/* =========================
   BUFFS
========================= */

function effectIcon(
  type,
  debuff
){

  if(debuff){
    return '☠️';
  }


  const icons = {

    aim:
      '🎯',

    all_hunt:
      '🏹',

    breakthrough:
      '💥',

    fix_hp:
      '❤️',

    forest_xp:
      '🌲',

    hunting_skills:
      '🦌',

    ice:
      '❄️',

    loot_bonus:
      '🎁',

    marks:
      '🐾',

    max_hp:
      '💚',

    str:
      '💪',

    threat:
      '⚠️',

    toxic:
      '☠️',

    forest_curse:
      '☠️'

  };


  return (
    icons[type] ||
    '✨'
  );

}


function renderBuffs(){

  const data =
    state.data.buffs || {};


  const container =
    $('#buffs');


  if(!container){
    return;
  }


  const effects = [

    ...(
      Array.isArray(
        data.buffs
      )

        ? data.buffs.map(
          effect => ({
            ...effect,
            debuff: false
          })
        )

        : []
    ),

    ...(
      Array.isArray(
        data.debuffs
      )

        ? data.debuffs.map(
          effect => ({
            ...effect,
            debuff: true
          })
        )

        : []
    )

  ];


  setText(
    '#buffCount',
    effects.length
  );


  if(
    effects.length === 0
  ){

    container.innerHTML =
      '<div class="empty">Keine aktiven Buffs oder Debuffs.</div>';

    return;

  }


  effects.sort(
    (
      a,
      b
    ) =>
      (
        expiresAtMs(a) ||
        Infinity
      )
      -
      (
        expiresAtMs(b) ||
        Infinity
      )
  );


  container.innerHTML =
    effects.map(

      effect => {

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
              `Quelle: ${
                esc(
                  effect
                    .source_item
                    .name
                )
              }`
            )

            : '';


        const value =
          effect.value !==
          undefined

            ? (
              `Wert: ${
                fmt(
                  effect.value
                )
              }`
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
                    : '–'
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
                      .filter(
                        Boolean
                      )
                      .join(
                        ' · '
                      )
                    }`

                  : ''
              }

            </div>

          </div>
        `;

      }

    ).join('');

}


/* =========================
   SHOP
========================= */

/*
  Die offizielle API dokumentiert:

  {
    offers: [
      {
        id,
        item_id,
        item_name,
        price,
        currency
      }
    ]
  }

  Zusätzlich suchen wir rekursiv nach Offers,
  damit auch leicht abweichende Wrapper funktionieren.
*/

function findOfferArray(
  node,
  depth = 0
){

  if(
    depth > 5 ||
    node === null ||
    node === undefined
  ){

    return [];

  }


  if(
    Array.isArray(
      node
    )
  ){

    const looksLikeOffers =
      node.some(
        item =>
          item &&
          typeof item === 'object' &&
          (
            'price' in item ||
            'item_name' in item ||
            'item_id' in item
          )
      );


    if(
      looksLikeOffers
    ){

      return node;

    }


    for(
      const child
      of node
    ){

      const found =
        findOfferArray(
          child,
          depth + 1
        );


      if(
        found.length
      ){

        return found;

      }

    }


    return [];

  }


  if(
    typeof node !== 'object'
  ){

    return [];

  }


  const directKeys = [

    'offers',

    'items',

    'shop_offers',

    'shopItems',

    'shop_items',

    'products'

  ];


  for(
    const key
    of directKeys
  ){

    if(
      Array.isArray(
        node[key]
      )
    ){

      return node[key];

    }

  }


  for(
    const value
    of Object.values(
      node
    )
  ){

    const found =
      findOfferArray(
        value,
        depth + 1
      );


    if(
      found.length
    ){

      return found;

    }

  }


  return [];

}


function currencyIcon(
  currency
){

  const text =
    String(
      currency ||
      ''
    ).toLowerCase();


  if(
    text.includes(
      'diamond'
    )
  ){
    return '💎';
  }


  if(
    text.includes(
      'gold'
    )
  ){
    return '🪙';
  }


  if(
    text.includes(
      'arrow'
    )
  ){
    return '🏹';
  }


  return '◈';

}


function renderShop(){

  const data =
    state.data.shop;


  const container =
    $('#shop');


  if(!container){
    return;
  }


  const offers =
    findOfferArray(
      data
    );


  setText(
    '#shopCount',
    offers.length
  );


  if(
    offers.length === 0
  ){

    container.innerHTML =
      '<div class="empty">Der Shop ist erreichbar, aber die API meldet aktuell keine Angebote.</div>';

    return;

  }


  container.innerHTML =
    offers.map(

      offer => {

        const item =
          (
            offer.item &&
            typeof offer.item ===
            'object'
          )

            ? offer.item

            : {};


        const name =

          offer.item_name
          ??
          offer.name
          ??
          offer.title
          ??
          item.name
          ??
          item.name_de
          ??
          `Item ${
            offer.item_id
            ??
            offer.id
            ??
            ''
          }`;


        const price =

          offer.price
          ??
          offer.cost
          ??
          offer.amount
          ??
          offer.value
          ??
          offer.gold
          ??
          offer.diamonds;


        let currency =

          offer.currency
          ??
          offer.currency_name
          ??
          offer.cost_currency
          ??
          '';


        if(!currency){

          if(
            offer.gold !==
            undefined
          ){

            currency =
              'gold';

          }

          else if(
            offer.diamonds !==
            undefined
          ){

            currency =
              'diamonds';

          }

        }


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

    ).join('');

}


/* =========================
   EVENTS
========================= */

function eventLabelFromKey(
  key
){

  const labels = {

    hunting_monday:
      'Jagd-Montag',

    funfair:
      'Jahrmarkt',

    combat_division:
      'Kampfklassen-Auswertung',

    combat_tournament_wednesday:
      'Kampfturnier-Mittwoch',

    double_thursday:
      'Doppel-Ruhm',

    knight_games:
      'Ritterspiele',

    castle_garden:
      'Schlossgarten',

    halloween:
      'Halloween',

    kings_tournament:
      'Königsturnier'

  };


  return (
    labels[key]
    ||
    String(
      key || ''
    )
      .replaceAll(
        '_',
        ' '
      )
      .replace(
        /\b\w/g,
        letter =>
          letter.toUpperCase()
      )
  );

}


/*
  Nur echte aktive Events.
  outpost_status wird absichtlich NICHT
  verwendet.
*/

function isTrulyActive(
  value
){

  if(
    value === true
  ){
    return true;
  }


  if(
    !value ||
    typeof value !==
    'object'
  ){

    return false;

  }


  if(
    value.active === true ||
    value.is_active === true
  ){

    return true;

  }


  const status =
    String(
      value.status
      ??
      value.state
      ??
      ''
    ).toLowerCase();


  return [

    'active',

    'running',

    'registration',

    'fighting',

    'ceremony'

  ].includes(
    status
  );

}


function collectActiveEvents(
  data
){

  const active =
    [];


  Object.entries(
    data.weekly_events ||
    {}
  )
    .forEach(

      (
        [
          key,
          value
        ]
      ) => {

        if(
          !isTrulyActive(
            value
          )
        ){

          return;

        }


        let name =
          value?.name ||
          eventLabelFromKey(
            key
          );


        let meta =
          value?.description ||
          'Regelmäßiges Wochen-Event';


        if(
          key ===
          'knight_games' &&
          value?.status
        ){

          const phases = {

            registration:
              'Registrierung',

            fighting:
              'Kämpfe',

            ceremony:
              'Siegerehrung'

          };


          name =
            `Ritterspiele – ${
              phases[
                value.status
              ]
              ||
              value.status
            }`;

        }


        if(
          key ===
          'castle_garden' &&
          value?.merchant
        ){

          meta =
            `Händler: ${
              value.merchant
            }`;

        }


        active.push({

          icon:
            '📅',

          name,

          meta

        });

      }

    );


  Object.entries(
    data.events ||
    {}
  )
    .forEach(

      (
        [
          key,
          value
        ]
      ) => {

        if(
          !isTrulyActive(
            value
          )
        ){

          return;

        }


        active.push({

          icon:
            '✨',

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


/*
  "Als Nächstes" basiert auf dem offiziellen
  regelmäßigen Wochenplan.

  Dadurch bleibt dieser Bereich sichtbar,
  auch wenn die Live-API nur active:false liefert.
*/

function nextWeeklyEvents(
  limit = 3
){

  const today =
    new Date()
      .getDay();


  return WEEKLY_EVENTS

    .map(

      event => {

        let delta =
          (
            event.day -
            today +
            7
          ) % 7;


        if(
          delta === 0
        ){

          delta =
            7;

        }


        return {

          ...event,

          delta

        };

      }

    )

    .sort(
      (
        a,
        b
      ) =>
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


  if(
    delta === 2
  ){
    return 'Übermorgen';
  }


  return (
    `In ${delta} Tagen`
  );

}


function renderEvents(){

  const data =
    state.data.live || {};


  const nowContainer =
    $('#eventsNow');


  const nextContainer =
    $('#eventsNext');


  const active =
    collectActiveEvents(
      data
    );


  if(
    nowContainer
  ){

    if(
      active.length
    ){

      nowContainer.innerHTML =
        active.map(

          event => `

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

        ).join('');

    }

    else{

      nowContainer.innerHTML =
        '<div class="empty">Gerade läuft kein besonderes Event.</div>';

    }

  }


  const upcoming =
    nextWeeklyEvents(
      3
    );


  if(
    nextContainer
  ){

    nextContainer.innerHTML =
      upcoming.map(

        event => `

          <div class="eventCard next">

            <div class="eventTitle">

              <span>

                ${event.icon}

                ${esc(
                  event.name
                )}

              </span>

              <span class="eventWhen">

                ${dayText(
                  event.delta
                )}

              </span>

            </div>


            <div class="eventMeta">

              ${esc(
                event.desc
              )}

            </div>

          </div>

        `

      ).join('');

  }

}


/* =========================
   SKILLS
========================= */

function renderSkills(){

  const data =
    state.data.skills || {};


  function fill(
    container,
    items
  ){

    if(!container){
      return;
    }


    if(
      !Array.isArray(
        items
      ) ||
      items.length === 0
    ){

      container.innerHTML =
        '<span class="empty">Keine Daten</span>';

      return;

    }


    container.innerHTML =
      [...items]

        .sort(
          (
            a,
            b
          ) =>
            Number(
              b.active ===
              true
            )
            -
            Number(
              a.active ===
              true
            )
        )

        .map(

          skill => `

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

        ).join('');

  }


  fill(
    $('#combatSkills'),
    data.combat
  );


  fill(
    $('#huntSkills'),
    data.hunting
  );

}


/* =========================
   SCHMIED
========================= */

function renderSmith(){

  const data =
    state.data.blacksmith || {};


  const container =
    $('#smith');


  if(!container){
    return;
  }


  const rows =
    [];


  const fields = [

    [
      'sword',
      'Schwert'
    ],

    [
      'armor',
      'Rüstung'
    ],

    [
      'shelter',
      'Unterkunft'
    ]

  ];


  for(
    const [
      key,
      label
    ]
    of fields
  ){

    const item =
      data[key];


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

            Stufe ${
              fmt(
                item.level
              )
            }

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

                    : `${
                        fmt(
                          item
                            .timer
                            ?.remaining_minutes
                        )
                      } Min`
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

                ${
                  fmt(
                    item
                      .next_upgrade
                      .level
                  )
                }

                ·

                ${
                  fmt(
                    item
                      .next_upgrade
                      .cost_gold
                  )
                }

                🪙

              </div>

            `

            : ''
        }

      </div>

    `);

  }


  container.innerHTML =
    rows.length

      ? rows.join('')

      : '<div class="empty">Keine Schmiededaten.</div>';

}


/* =========================
   DRACHE
========================= */

function renderDragon(){

  const data =
    state.data.dragon || {};


  const container =
    $('#dragon');


  if(!container){
    return;
  }


  if(
    data.has_dragon ===
    false
  ){

    container.innerHTML =
      '<div class="empty">Noch kein Drache.</div>';

    return;

  }


  if(
    data.level ===
    undefined
  ){

    container.innerHTML =
      '<div class="empty">Keine Drachendaten.</div>';

    return;

  }


  const percent =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          data.xp_percent ||
          0
        )
      )
    );


  container.innerHTML = `

    <div class="itemTop">

      <div class="itemName">

        Level ${
          fmt(
            data.level
          )
        }

      </div>

      <div class="timer">

        ${esc(
          data.status ||
          ''
        )}

      </div>

    </div>


    <div class="itemMeta">

      XP

      ${
        fmt(
          data.xp
        )
      }

      /

      ${
        fmt(
          data.xp_needed
        )
      }

      · Futter

      ${
        fmt(
          data.food
        )
      }

    </div>


    <div class="progress">

      <i
        style="width:${percent}%"
      ></i>

    </div>

  `;

}


/* =========================
   AUSSENPOSTEN
========================= */

function renderOutpost(){

  const data =
    state.data.outpost || {};


  const container =
    $('#outpost');


  if(!container){
    return;
  }


  const task =
    data.current_task;


  if(!task){

    container.innerHTML = `

      <div class="empty">

        Keine aktive Aufgabe.

      </div>

      <div class="itemMeta">

        Erledigt:

        ${
          fmt(
            data.tasks_completed
          )
        }

        ·

        Belohnungen offen:

        ${
          fmt(
            data.pending_rewards
          )
        }

      </div>

    `;

    return;

  }


  const percent =
    task.target

      ? Math.min(
        100,
        (
          Number(
            task.progress
          )
          /
          Number(
            task.target
          )
        ) * 100
      )

      : 0;


  container.innerHTML = `

    <div class="outpostItem">

      <div class="itemName">

        ${esc(
          task.description ||
          task.ident ||
          'Aufgabe'
        )}

      </div>


      <div class="itemMeta">

        ${
          fmt(
            task.progress
          )
        }

        /

        ${
          fmt(
            task.target
          )
        }

      </div>


      <div class="progress">

        <i
          style="width:${percent}%"
        ></i>

      </div>

    </div>

  `;

}


/* =========================
   LIVE
========================= */

function renderLive(){

  renderEvents();

}


/* =========================
   COUNTDOWN AKTUALISIERUNG
========================= */

function updateCountdowns(){

  document
    .querySelectorAll(
      '[data-expires-at]'
    )
    .forEach(

      element => {

        const expiry =
          Number(
            element
              .dataset
              .expiresAt
          );


        if(
          !Number.isFinite(
            expiry
          )
        ){
          return;
        }


        element.textContent =
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


/* =========================
   API LADEN
========================= */

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


  const errors =
    [];


  try{

    for(
      let index = 0;
      index < endpoints.length;
      index++
    ){

      const [
        key,
        path,
        renderer
      ] =
        endpoints[index];


      try{

        state.data[key] =
          await api(
            path
          );


        renderer();

      }catch(error){

        errors.push(
          `${path}: ${
            error.message ||
            error
          }`
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
                  error.message ||
                  error
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
          error.rateLimited
        ){

          break;

        }

      }


      if(
        index <
        endpoints.length - 1
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
        errors.join(
          '\n'
        )
      );


      setText(

        '#refreshState',

        state.data.profile
          ? 'Teilweise aktualisiert'
          : 'Fehler'

      );

    }

    else{

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
                hour:
                  '2-digit',

                minute:
                  '2-digit',

                second:
                  '2-digit'
              }
            )
        }`

      );

    }

  }

  finally{

    state.busy =
      false;

  }

}


/* =========================
   EINSTELLUNGEN
========================= */

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
    .remove(
      'open'
    );

}


function saveSettings(){

  const newToken =
    (
      $('#tokenInput')
        ?.value ||
      ''
    ).trim();


  const proxy =
    (
      $('#proxyInput')
        ?.value ||
      ''
    )
      .trim()
      .replace(
        /\/+$/,
        ''
      );


  if(
    newToken
  ){

    localStorage.setItem(
      'rm_token',
      newToken
    );

  }

  else{

    localStorage.removeItem(
      'rm_token'
    );

  }


  if(
    proxy
  ){

    localStorage.setItem(
      'rm_proxy',
      proxy
    );

  }

  else{

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
    newToken &&
    proxy
  ){

    loadAll(
      true
    );

  }

  else{

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


/* =========================
   AUTO REFRESH
========================= */

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

        () => {

          if(
            document.visibilityState ===
            'visible'
          ){

            loadAll(
              false
            );

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


/* =========================
   PWA INSTALLATION
========================= */

function setupInstall(){

  const standalone =

    window
      .matchMedia(
        '(display-mode: standalone)'
      )
      .matches

    ||

    window.navigator
      .standalone ===
      true;


  if(
    standalone
  ){

    document.body
      .classList
      .add(
        'standalone'
      );

  }


  window.addEventListener(

    'beforeinstallprompt',

    event => {

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

      async () => {

        if(
          !state.installPrompt
        ){
          return;
        }


        state.installPrompt
          .prompt();


        await state
          .installPrompt
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

    () => {

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


/* =========================
   START
========================= */

window.addEventListener(

  'load',

  () => {

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

        () =>
          loadAll(
            true
          )

      );


    $('#drawer')
      ?.addEventListener(

        'click',

        event => {

          if(
            event.target?.id ===
            'drawer'
          ){

            closeSettings();

          }

        }

      );


    document.addEventListener(

      'visibilitychange',

      () => {

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

            loadAll(
              false
            );

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
          './service-worker.js?v=5'
        )
        .catch(
          () => {}
        );

    }


    if(
      token() &&
      proxyUrl()
    ){

      loadAll(
        false
      );

    }

    else{

      openSettings();

    }

  }

);
