const $ =
  s =>
    document.querySelector(s);

const $$ =
  s =>
    [
      ...document.querySelectorAll(s)
    ];


const S = {

  data: {},

  busy: false,

  page: 0,

  blockedUntil: 0,

  autoTimer: null,

  countTimer: null,

  installPrompt: null

};


const AUTO =
  60000;

const WAIT =
  220;

const MANUAL =
  7000;

let lastManual =
  0;


/*
  API-Bereiche
*/

const ENDPOINTS = [

  [
    'profile',
    '/v1/me'
  ],

  [
    'stats',
    '/v1/me/stats'
  ],

  [
    'buffs',
    '/v1/me/buffs'
  ],

  [
    'shop',
    '/v1/game/shop'
  ],

  [
    'season',
    '/v1/game/season'
  ],

  [
    'live',
    '/v1/game/live'
  ],

  [
    'blacksmith',
    '/v1/me/blacksmith'
  ],

  [
    'dragon',
    '/v1/me/dragon'
  ],

  [
    'outpost',
    '/v1/me/outpost'
  ],

  [
    'skills',
    '/v1/me/skills?desc=1'
  ],

  [
    'tournaments',
    '/v1/me/tournaments'
  ],

  [
    'backpack',
    '/v1/me/backpack?desc=1'
  ],

  [
    'forest',
    '/v1/game/forest'
  ],

  [
    'province',
    '/v1/game/province'
  ],

  [
    'party',
    '/v1/me/party'
  ],

  [
    'dungeons',
    '/v1/me/dungeons'
  ],

  [
    'order',
    '/v1/me/order'
  ],

  [
    'lifetime',
    '/v1/me/lifetime'
  ],

  [
    'bestiary',
    '/v1/me/bestiary'
  ]

];


/*
  Deutscher Wochenplan
*/

const WEEK = [

  {
    day: 1,
    key: 'hunting_monday',
    icon: '🏹',
    name: 'Jagd-Montag',
    desc:
      'Garantierte Jagdturniere jede Stunde und doppelter Preispool.'
  },

  {
    day: 2,
    key: 'funfair',
    icon: '🎪',
    name: 'Jahrmarkt',
    desc:
      'Glücksrad mit Gegenstands-Preisen.'
  },

  {
    day: 3,
    key: 'combat_division',
    icon: '🛡️',
    name:
      'Kampfklassen-Auswertung',
    desc:
      'Mittwoch um 12:01 Uhr.'
  },

  {
    day: 3,
    key:
      'combat_tournament_wednesday',
    icon: '⚔️',
    name:
      'Kampfturnier-Mittwoch',
    desc:
      'Garantierte Kampfturniere jede Stunde und doppelter Preispool.'
  },

  {
    day: 4,
    key:
      'double_thursday',
    icon: '🏆',
    name:
      'Doppelter Ruhm',
    desc:
      'Doppelter Ruhm aus Kämpfen.'
  },

  {
    day: 5,
    key:
      'knight_games',
    icon: '🏰',
    name:
      'Ritterspiele – Registrierung',
    desc:
      'Freitag: Anmeldung zu den Ritterspielen.'
  },

  {
    day: 6,
    key:
      'knight_games',
    icon: '⚔️',
    name:
      'Ritterspiele – Kämpfe',
    desc:
      'Samstag: Kämpfe für den Orden.'
  },

  {
    day: 0,
    key:
      'knight_games',
    icon: '👑',
    name:
      'Ritterspiele – Siegerehrung',
    desc:
      'Sonntag: Auswertung und Belohnungen.'
  }

];


/*
  Deutsche Begriffe
*/

const TR = {

  active:
    'aktiv',

  inactive:
    'inaktiv',

  running:
    'läuft',

  closed:
    'geschlossen',

  open:
    'offen',

  rewards:
    'Belohnungen',

  registration:
    'Registrierung',

  fighting:
    'Kämpfe',

  ceremony:
    'Siegerehrung',

  away:
    'nicht anwesend',

  attack:
    'Angriff',

  hurt:
    'besiegt',

  egg:
    'Ei',

  baby:
    'Babydrache',

  kid:
    'Jungdrache',

  adult:
    'Erwachsener Drache',

  idle:
    'wartet',

  normal:
    'Normal',

  heroic:
    'Heroisch',

  legendary:
    'Legendär',

  most_kills:
    'Meiste Abschüsse',

  most_variety:
    'Größte Vielfalt',

  most_orc_types:
    'Meiste Ork-Arten',

  most_wins:
    'Meiste Siege',

  most_damage:
    'Meister Schaden'

};


const EFFECT = {

  aim:
    'Zielgenauigkeit',

  all_hunt:
    'Jagdmeister',

  breakthrough:
    'Durchschlagskraft',

  fix_hp:
    'Lebenskraft',

  forest_xp:
    'Walderfahrung',

  hunting_skills:
    'Jagdinstinkt',

  ice:
    'Frostschutz',

  loot_bonus:
    'Beutebonus',

  marks:
    'Spurenleser',

  max_hp:
    'Lebensboost',

  str:
    'Stärkeboost',

  threat:
    'Bedrohung',

  forest_curse:
    'Fluch des Orkkönigs',

  toxic:
    'Vergiftet'

};


const EVENT_NAMES = {

  hunting_monday:
    'Jagd-Montag',

  funfair:
    'Jahrmarkt',

  combat_division:
    'Kampfklassen-Auswertung',

  combat_tournament_wednesday:
    'Kampfturnier-Mittwoch',

  double_thursday:
    'Doppelter Ruhm',

  knight_games:
    'Ritterspiele',

  castle_garden:
    'Schlossgarten',

  halloween:
    'Halloween',

  kings_tournament:
    'Königsturnier',

  joust_tournament:
    'Lanzenturnier',

  trading_event:
    'Handels-Event',

  cookie:
    'Keks-Event'

};


const CATEGORY_DE = {

  Potions:
    'Tränke',

  Equipment:
    'Ausrüstung',

  Food:
    'Nahrung',

  Consumables:
    'Verbrauchbar',

  Crafting:
    'Handwerkswaren',

  Misc:
    'Sonstiges'

};


/*
  Häufige Gegenstände:
  englische API-Bezeichnungen
  werden deutsch dargestellt.
*/

const ITEM_DE = {

  'health potion':
    'Heiltrank',

  'strength potion':
    'Stärketrank',

  'silver arrows':
    'Silberpfeile',

  'silver arrow':
    'Silberpfeil',

  'healing herbs':
    'Heilkräuter',

  'healing herb':
    'Heilkraut',

  'throwing axes':
    'Wurfäxte',

  'throwing axe':
    'Wurfaxt',

  'wolf bait':
    'Wolfsköder',

  'apple':
    'Apfel',

  'blackberries':
    'Brombeeren',

  'raspberries':
    'Himbeeren',

  'honeycomb':
    'Honigwabe',

  'carrots':
    'Möhren',

  'orc meat':
    'Ork-Fleisch',

  'wild boar meat':
    'Wildschwein-Fleisch',

  'forest mushrooms':
    'Waldpilze',

  'small meals':
    'Kleine Mahlzeiten',

  'shadow dust':
    'Schattenstaub',

  'silver bars':
    'Silberbarren',

  'silver bar':
    'Silberbarren',

  'thorium shard':
    'Thorium-Splitter',

  'thorium shards':
    'Thorium-Splitter',

  'royal medal':
    'Königliche Medaille',

  'province coins':
    'Provinzmünzen',

  'free tickets':
    'Freilose',

  'slime bags':
    'Schleimbeutel',

  'slime bag':
    'Schleimbeutel'

};


const SKILL_DE = {

  Fireball:
    'Feuerball',

  'Shield Wall':
    'Schildwall',

  'Quick Shot':
    'Schnellschuss',

  Bandage:
    'Verband',

  'Mirror Image':
    'Spiegelbild',

  'Magic Shield':
    'Magisches Schild',

  'Multiple Shot':
    'Mehrfachschuss'

};


function itemName(x){

  const raw =
    x?.name_de ||
    x?.name ||
    x?.ident ||
    '';

  return (
    ITEM_DE[
      String(raw)
        .toLowerCase()
    ]
    ||
    raw
  );

}


function skillName(x){

  return (
    x?.name_de
    ||
    SKILL_DE[
      x?.name
    ]
    ||
    x?.name
    ||
    x?.ident
    ||
    ''
  );

}


/*
  Hilfsfunktionen
*/

function esc(v){

  return String(
    v ?? ''
  )
  .replace(
    /[&<>"']/g,
    m => ({
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

  return (
    typeof v ===
    'number'

      ? new Intl
          .NumberFormat(
            'de-DE'
          )
          .format(v)

      : String(v)
  );

}


function de(v){

  return (
    TR[
      String(
        v ?? ''
      )
      .toLowerCase()
    ]
    ||
    String(
      v ?? ''
    )
  );

}


function val(...values){

  return values.find(
    value =>
      value !== undefined &&
      value !== null
  );

}


function token(){

  return (
    localStorage
      .getItem(
        'rm_token'
      )
    ||
    ''
  ).trim();

}


function proxy(){

  return (
    localStorage
      .getItem(
        'rm_proxy'
      )
    ||
    ''
  )
  .trim()
  .replace(
    /\/+$/,
    ''
  );

}


function auto(){

  return (
    localStorage
      .getItem(
        'rm_auto'
      )
    !== '0'
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


function unwrap(body){

  if(
    body &&
    typeof body ===
      'object' &&
    body.success === true &&
    Object.prototype
      .hasOwnProperty
      .call(
        body,
        'data'
      )
  ){
    return body.data;
  }

  return body;

}


/*
  API
*/

async function api(path){

  if(
    Date.now() <
    S.blockedUntil
  ){

    throw Object.assign(
      new Error(
        'API-Pause aktiv.'
      ),
      {
        rate:true
      }
    );

  }


  if(
    !token() ||
    !proxy()
  ){

    throw new Error(
      'API-Zugang fehlt.'
    );

  }


  const response =
    await fetch(
      proxy() + path,
      {
        headers:{
          Authorization:
            `Bearer ${token()}`,

          Accept:
            'application/json'
        },

        cache:
          'no-store'
      }
    );


  const raw =
    await response.text();


  let body;


  try{

    body =
      raw
        ? JSON.parse(raw)
        : null;

  }catch{

    body =
      null;

  }


  if(
    !response.ok
  ){

    if(
      response.status ===
      429
    ){

      const match =
        raw.match(
          /(\d+)\s*seconds?/i
        );


      S.blockedUntil =
        Date.now()
        +
        Number(
          match?.[1] ||
          60
        )
        * 1000;


      throw Object.assign(
        new Error(
          'API-Limit erreicht.'
        ),
        {
          rate:true
        }
      );

    }


    throw new Error(
      `${path}: HTTP ${
        response.status
      }`
    );

  }


  return unwrap(
    body
  );

}


/*
  Countdown
*/

function t(seconds){

  seconds =
    Math.max(
      0,
      Math.ceil(
        Number(
          seconds
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


  if(hours){

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


function expiry(obj){

  const absolute =
    obj?.expires_at
    ??
    obj?.finishes_at;


  if(
    absolute != null
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


  const date =
    Date.parse(
      obj?.expires_datetime
      ||
      ''
    );


  if(
    Number.isFinite(
      date
    )
  ){
    return date;
  }


  if(
    Number.isFinite(
      Number(
        obj?.remaining_seconds
      )
    )
  ){

    return (
      Date.now()
      +
      Number(
        obj.remaining_seconds
      )
      * 1000
    );

  }


  if(
    Number.isFinite(
      Number(
        obj?.remaining_minutes
      )
    )
  ){

    return (
      Date.now()
      +
      Number(
        obj.remaining_minutes
      )
      * 60000
    );

  }


  return null;

}


/*
  HTML-Helfer
*/

function progress(value){

  value =
    Math.max(
      0,
      Math.min(
        100,
        Number(value) || 0
      )
    );


  return `
    <div class="progress">
      <i
        style="width:${value}%"
      ></i>
    </div>
  `;

}


function row(
  title,
  value,
  meta = '',
  icon = ''
){

  return `
    <div class="row">

      <div class="rowMain">

        <div class="rowTitle">

          ${
            icon
              ? icon + ' '
              : ''
          }

          ${esc(title)}

        </div>

        ${
          meta
            ? `
              <div class="rowMeta">
                ${esc(meta)}
              </div>
            `
            : ''
        }

      </div>

      <div class="value">
        ${esc(fmt(value))}
      </div>

    </div>
  `;

}


/*
  PROFIL / START
*/

function hero(){

  const p =
    S.data.profile || {};

  const ranking =
    p.ranking || {};

  const rank =
    p.rank || {};

  const currencies =
    p.currencies || {};

  const combat =
    p.combat || {};


  const energy =
    val(
      p.energy?.current,
      p.energy,
      p.resources?.energy
    );


  const servants =
    val(
      currencies.servants,
      p.servants,
      p.resources?.servants
    );


  const arrows =
    val(
      currencies.arrow_makers,
      p.arrow_makers,
      p.resources?.arrow_makers
    );


  return `
    <div class="card hero">

      <div class="heroTop">

        <div>

          <div class="name">
            ${esc(
              p.name ||
              'Mein Ritter'
            )}
          </div>

          <div class="rankline">

            ${esc(
              [
                rank.title,
                p.title,
                ranking.division != null
                  ? `Division ${ranking.division}`
                  : ''
              ]
              .filter(Boolean)
              .join(' · ')
            )}

          </div>

          <div class="muted tiny">

            📍 ${
              esc(
                p.status?.location ||
                'Unterwegs'
              )
            }

          </div>

        </div>

        <span
          class="online ${
            p.status?.online
              ? ''
              : 'offline'
          }"
        >

          ${
            p.status?.online
              ? 'ONLINE'
              : 'OFFLINE'
          }

        </span>

      </div>


      <div class="stats4">

        <div class="tile">
          <span class="emoji">⚔️</span>
          <b>${fmt(p.level)}</b>
          <span>Level</span>
        </div>

        <div class="tile">
          <span class="emoji">🪙</span>
          <b>${fmt(currencies.gold)}</b>
          <span>Gold</span>
        </div>

        <div class="tile">
          <span class="emoji">💎</span>
          <b>${fmt(currencies.diamonds)}</b>
          <span>Diamanten</span>
        </div>

        <div class="tile">
          <span class="emoji">🏆</span>
          <b>${fmt(ranking.honor)}</b>
          <span>Ruhm</span>
        </div>

        ${
          energy != null
            ? `
              <div class="tile">
                <span class="emoji">⚡</span>
                <b>${fmt(energy)}</b>
                <span>Energie</span>
              </div>
            `
            : ''
        }

        ${
          servants != null
            ? `
              <div class="tile">
                <span class="emoji">🧑‍🌾</span>
                <b>${fmt(servants)}</b>
                <span>Leibeigene</span>
              </div>
            `
            : ''
        }

        ${
          arrows != null
            ? `
              <div class="tile">
                <span class="emoji">🎯</span>
                <b>${fmt(arrows)}</b>
                <span>Pfeilmacher</span>
              </div>
            `
            : ''
        }

        ${
          combat.hp?.total != null
            ? `
              <div class="tile">
                <span class="emoji">❤️</span>
                <b>${fmt(combat.hp.total)}</b>
                <span>Lebenspunkte</span>
              </div>
            `
            : ''
        }

      </div>

    </div>
  `;

}


/*
  BUFFS
*/

function buffs(){

  const data =
    S.data.buffs || {};


  const all = [

    ...(
      data.buffs ||
      []
    )
    .map(
      item => ({
        ...item,
        bad:false
      })
    ),

    ...(
      data.debuffs ||
      []
    )
    .map(
      item => ({
        ...item,
        bad:true
      })
    )

  ];


  return `
    <div class="panel priority">

      <div class="panelHead">

        <div>

          <div class="eyebrow">
            AKTUELLER BUFF
          </div>

          <h2>
            ⏱️ Aktive Wirkungen
          </h2>

        </div>

        <span class="badge">
          ${all.length}
        </span>

      </div>

      ${
        all.length

          ? `
            <div class="list">

              ${
                all
                .sort(
                  (a,b) =>
                    (
                      expiry(a) ||
                      Infinity
                    )
                    -
                    (
                      expiry(b) ||
                      Infinity
                    )
                )
                .map(
                  item => {

                    const end =
                      expiry(item);

                    return `
                      <div class="row">

                        <div class="rowMain">

                          <div class="rowTitle">

                            ${
                              item.bad
                                ? '☠️'
                                : '✨'
                            }

                            ${
                              esc(
                                EFFECT[
                                  item.type
                                ]
                                ||
                                item.name
                                ||
                                item.type
                              )
                            }

                          </div>

                          <div class="rowMeta">

                            ${
                              esc(
                                item.bad
                                  ? 'Negative Wirkung'
                                  : (
                                    item.description
                                    ||
                                    item.source_item?.name
                                    ||
                                    'Aktiver Bonus'
                                  )
                              )
                            }

                          </div>

                        </div>

                        <div
                          class="timer"

                          ${
                            end
                              ? `data-expires="${end}"`
                              : ''
                          }
                        >

                          ${
                            end
                              ? t(
                                  (
                                    end -
                                    Date.now()
                                  )
                                  /
                                  1000
                                )
                              : (
                                  fmt(
                                    item.remaining_minutes
                                  )
                                  +
                                  ' Min'
                                )
                          }

                        </div>

                      </div>
                    `;

                  }
                )
                .join('')
              }

            </div>
          `

          : `
            <div class="empty">
              Keine aktiven Buffs oder Debuffs.
            </div>
          `
      }

    </div>
  `;

}


/*
  SHOP

  Durchsucht auch verschachtelte
  API-Antworten nach Angeboten.
*/

function findOffers(
  node,
  depth = 0
){

  if(
    depth > 6 ||
    node == null
  ){
    return [];
  }


  if(
    Array.isArray(
      node
    )
  ){

    if(
      node.some(
        item =>
          item &&
          typeof item ===
            'object'
          &&
          (
            'price' in item
            ||
            'item_name' in item
            ||
            'item_id' in item
            ||
            'currency' in item
          )
      )
    ){
      return node;
    }


    for(
      const item
      of node
    ){

      const found =
        findOffers(
          item,
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
    typeof node !==
    'object'
  ){
    return [];
  }


  for(
    const key
    of [
      'offers',
      'items',
      'shop',
      'products',
      'current_offers',
      'currentOffers'
    ]
  ){

    if(
      node[key] != null
    ){

      const found =
        findOffers(
          node[key],
          depth + 1
        );


      if(
        found.length
      ){
        return found;
      }

    }

  }


  for(
    const value
    of Object.values(
      node
    )
  ){

    const found =
      findOffers(
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


function shop(){

  const offers =
    findOffers(
      S.data.shop
    );


  return `
    <div class="panel priority">

      <div class="panelHead">

        <div>

          <div class="eyebrow">
            AKTUELL
          </div>

          <h2>
            🛒 Shop
          </h2>

        </div>

        <span class="badge">
          ${offers.length}
        </span>

      </div>


      ${
        offers.length

          ? `
            <div class="itemGrid">

              ${
                offers
                .map(
                  offer => {

                    const item =
                      offer.item ||
                      {};


                    const rawName =
                      val(
                        offer.item_name,
                        offer.name,
                        offer.title,
                        item.name_de,
                        item.name,
                        `Gegenstand ${
                          offer.item_id
                          ??
                          offer.id
                          ??
                          ''
                        }`
                      );


                    const name =
                      ITEM_DE[
                        String(
                          rawName
                        )
                        .toLowerCase()
                      ]
                      ||
                      rawName;


                    const price =
                      val(
                        offer.price,
                        offer.cost,
                        offer.amount,
                        offer.gold,
                        offer.diamonds
                      );


                    const currency =
                      val(
                        offer.currency,
                        offer.currency_name,
                        offer.cost_currency,
                        offer.gold != null
                          ? 'gold'
                          : (
                            offer.diamonds != null
                              ? 'diamonds'
                              : ''
                          )
                      );


                    const lower =
                      String(
                        currency
                      )
                      .toLowerCase();


                    return `
                      <div class="item">

                        <b>
                          ${esc(name)}
                        </b>

                        <small>

                          ${
                            lower.includes(
                              'diamond'
                            )
                              ? '💎'
                              : '🪙'
                          }

                          ${fmt(price)}

                          ${
                            lower.includes(
                              'diamond'
                            )
                              ? 'Diamanten'
                              : (
                                lower.includes(
                                  'gold'
                                )
                                  ? 'Gold'
                                  : esc(currency)
                              )
                          }

                        </small>

                      </div>
                    `;

                  }
                )
                .join('')
              }

            </div>
          `

          : `
            <div class="empty">
              Die Shop-API liefert im Moment keine Angebote.
              Der Bereich aktualisiert sich automatisch,
              sobald Angebote gemeldet werden.
            </div>
          `
      }

    </div>
  `;

}


/*
  EVENTS
*/

function activeEvents(){

  const live =
    S.data.live || {};

  const result =
    [];


  for(
    const [
      key,
      value
    ]
    of Object.entries(
      live.weekly_events ||
      {}
    )
  ){

    if(
      value === true
      ||
      value?.active ===
      true
    ){

      let name =
        EVENT_NAMES[key]
        ||
        key;


      let meta =
        'Aktives Wochen-Event';


      if(
        key ===
        'knight_games'
      ){

        name =
          `Ritterspiele – ${
            de(
              value.status
            )
          }`;

      }


      if(
        key ===
        'castle_garden'
        &&
        value.merchant
      ){

        meta =
          `Händler: ${
            value.merchant
          }`;

      }


      result.push({
        name,
        meta
      });

    }

  }


  for(
    const [
      key,
      value
    ]
    of Object.entries(
      live.events ||
      {}
    )
  ){

    if(
      value === true
      ||
      value?.active ===
      true
    ){

      result.push({

        name:
          value?.name_de
          ||
          EVENT_NAMES[key]
          ||
          key,

        meta:
          value?.description_de
          ||
          'Aktives Sonder-Event'

      });

    }

  }


  return result;

}


function upcoming(){

  const today =
    new Date()
      .getDay();


  return WEEK

    .map(
      event => ({
        ...event,

        delta:
          (
            event.day -
            today +
            7
          )
          %
          7
          ||
          7
      })
    )

    .sort(
      (a,b) =>
        a.delta -
        b.delta
    )

    .slice(
      0,
      3
    );

}


function when(days){

  if(
    days === 1
  ){
    return 'Morgen';
  }


  if(
    days === 2
  ){
    return 'Übermorgen';
  }


  return (
    `In ${days} Tagen`
  );

}


function events(){

  const now =
    activeEvents();


  const next =
    upcoming();


  return `
    <div class="panel events">

      <div class="panelHead">

        <div>

          <div class="eyebrow">
            EVENTS
          </div>

          <h2>
            📅 Jetzt & als Nächstes
          </h2>

        </div>

      </div>


      <div class="grid2">


        <div>

          <div class="sectionTitle">
            Läuft gerade
          </div>

          ${
            now.length

              ? now
                .map(
                  event => `
                    <div class="eventCard">

                      <div class="eventTop">

                        <span>
                          ✨ ${esc(event.name)}
                        </span>

                        <span class="eventWhen">
                          JETZT
                        </span>

                      </div>

                      <div class="rowMeta">
                        ${esc(event.meta)}
                      </div>

                    </div>
                  `
                )
                .join('')

              : `
                <div class="empty">
                  Gerade läuft kein besonderes Event.
                </div>
              `
          }

        </div>


        <div>

          <div class="sectionTitle">
            Als Nächstes
          </div>

          ${
            next
            .map(
              event => `
                <div class="eventCard eventNext">

                  <div class="eventTop">

                    <span>

                      ${event.icon}

                      ${esc(event.name)}

                    </span>

                    <span class="eventWhen">
                      ${when(event.delta)}
                    </span>

                  </div>

                  <div class="rowMeta">
                    ${esc(event.desc)}
                  </div>

                </div>
              `
            )
            .join('')
          }

        </div>

      </div>

    </div>
  `;

}


/*
  SCHNELLÜBERSICHT
*/

function quickStatus(){

  const p =
    S.data.profile || {};

  const ranking =
    p.ranking || {};

  const activity =
    ranking.activity_rank ||
    {};

  const hunt =
    p.hunting || {};

  const upgrades =
    p.upgrades || {};

  const stats =
    S.data.stats || {};


  return `
    <div class="panel">

      <div class="panelHead">

        <h2>
          📊 Schnellübersicht
        </h2>

        <span class="tiny muted">

          ${
            new Date()
              .toLocaleTimeString(
                'de-DE',
                {
                  hour:'2-digit',
                  minute:'2-digit'
                }
              )
          }

        </span>

      </div>


      <div class="grid3">

        <div class="tile">
          <b>
            ${
              fmt(
                ranking.position
                ??
                p.rank?.number
              )
            }
          </b>
          <span>Rang</span>
        </div>


        <div class="tile">
          <b>
            ${fmt(activity.rank)}
            /
            ${fmt(activity.max_rank)}
          </b>
          <span>Aktivität</span>
        </div>


        <div class="tile">
          <b>${fmt(hunt.level)}</b>
          <span>Jagdlevel</span>
        </div>


        <div class="tile">
          <b>${fmt(p.progress?.tower)}</b>
          <span>Turm-Ebene</span>
        </div>


        <div class="tile">

          <b>
            ${fmt(upgrades.sword)}
            /
            ${fmt(upgrades.armor)}
            /
            ${fmt(upgrades.shelter)}
          </b>

          <span>
            Schwert/Rüstung/Unterkunft
          </span>

        </div>


        <div class="tile">

          <b>
            ${fmt(stats.pvp?.winrate)}%
          </b>

          <span>
            PvP-Siegquote
          </span>

        </div>

      </div>

    </div>
  `;

}


/*
  SEITE 1
*/

function overview(){

  return `

    <div class="pageHeader">

      <h2>
        Übersicht
      </h2>

      <small>
        Wischen für weitere Bereiche →
      </small>

    </div>

    ${hero()}

    ${buffs()}

    ${shop()}

    ${events()}

    ${quickStatus()}

  `;

}


/*
  KAMPFWERTE
*/

function combatValues(){

  const p =
    S.data.profile || {};

  const combat =
    p.combat || {};

  const ranking =
    p.ranking || {};

  const activity =
    ranking.activity_rank ||
    {};


  const values = [

    [
      'Lebenspunkte',
      val(
        combat.hp?.total,
        combat.hp
      ),
      '❤️'
    ],

    [
      'Stärke',
      val(
        combat.strength?.total,
        combat.strength
      ),
      '💣'
    ],

    [
      'Verteidigung',
      val(
        combat.defense?.total,
        combat.defense
      ),
      '🛡️'
    ],

    [
      'Geschwindigkeit',
      val(
        combat.speed?.total,
        combat.speed
      ),
      '🥕'
    ],

    [
      'Glück',
      val(
        combat.luck?.total,
        combat.luck
      ),
      '🧲'
    ],

    [
      'Kritisch',
      val(
        combat.critical?.total,
        combat.critical,
        combat.crit
      ),
      '💀'
    ]

  ]
  .filter(
    item =>
      item[1] != null
  );


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          ⚔️ Kampfwerte
        </h2>
      </div>

      ${
        values.length

          ? values
            .map(
              item =>
                row(
                  item[0],
                  item[1],
                  '',
                  item[2]
                )
            )
            .join('')

          : `
            <div class="empty">
              Die API liefert für dieses Profil
              keine detaillierten Kampfwerte.
            </div>
          `
      }

      ${
        activity.rank != null

          ? row(
              'Aktivitätsrang',

              `${activity.rank} / ${activity.max_rank}`,

              `${fmt(activity.better_than_percent)} % besser als Vergleichsgruppe`,

              '📈'
            )

          : ''
      }

    </div>
  `;

}


/*
  JAGD
*/

function hunting(){

  const p =
    S.data.profile || {};

  const hunt =
    p.hunting || {};


  const values = [

    [
      'Jagdlevel',
      hunt.level,
      '🌲'
    ],

    [
      'Jagdpunkte',
      hunt.points,
      '🦌'
    ],

    [
      'Abschüsse',
      hunt.kills,
      '💀'
    ],

    [
      'Durchschlagskraft',

      val(
        hunt.breakthrough,
        hunt.breakthrough_power
      ),

      '💣'
    ],

    [
      'Genauigkeit',

      val(
        hunt.aim,
        hunt.accuracy
      ),

      '🎯'
    ],

    [
      'Spuren lesen',

      val(
        hunt.marks,
        hunt.tracking
      ),

      '🐾'
    ]

  ]
  .filter(
    item =>
      item[1] != null
  );


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🏹 Jagd
        </h2>
      </div>

      ${
        values
        .map(
          item =>
            row(
              item[0],
              item[1],
              '',
              item[2]
            )
        )
        .join('')
      }

    </div>
  `;

}


/*
  SCHMIED
*/

function blacksmith(){

  const data =
    S.data.blacksmith || {};


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🔨 Schmied
        </h2>
      </div>

      ${
        [
          'sword',
          'armor',
          'shelter'
        ]
        .map(
          (
            key,
            index
          ) => {

            const item =
              data[key];


            if(!item){
              return '';
            }


            const end =
              expiry(
                item.timer
              );


            return row(

              [
                'Schwert',
                'Rüstung',
                'Unterkunft'
              ][index],

              `Stufe ${
                fmt(
                  item.level
                )
              }`,

              item.in_progress

                ? (
                  end
                    ? `Fertig in ${
                        t(
                          (
                            end -
                            Date.now()
                          )
                          /
                          1000
                        )
                      }`
                    : 'Ausbau läuft'
                )

                : `Nächste Stufe: ${
                    fmt(
                      item.next_upgrade
                        ?.cost_gold
                    )
                  } Gold`,

              [
                '⚔️',
                '🛡️',
                '🏠'
              ][index]

            );

          }
        )
        .join('')
      }

    </div>
  `;

}


/*
  SKILLS
*/

function skills(){

  const data =
    S.data.skills || {};


  const block =
    (
      title,
      items
    ) => `

      <div class="sectionTitle">
        ${title}
      </div>

      <div class="chips">

        ${
          (
            items ||
            []
          ).length

            ? (
                items ||
                []
              )
              .map(
                item => `
                  <span
                    class="chip ${
                      item.active
                        ? 'active'
                        : ''
                    }"
                  >

                    ${
                      esc(
                        skillName(
                          item
                        )
                      )
                    }

                    ·

                    ${
                      fmt(
                        item.level
                      )
                    }

                  </span>
                `
              )
              .join('')

            : `
              <span class="empty">
                Keine Daten
              </span>
            `
        }

      </div>
    `;


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          ✨ Fähigkeiten
        </h2>
      </div>

      ${
        block(
          'Kampf',
          data.combat
        )
      }

      ${
        block(
          'Düsterwald',
          data.hunting
        )
      }

    </div>
  `;

}


/*
  TURNIERE
*/

function tournaments(){

  const data =
    S.data.tournaments ||
    {};


  const one =
    (
      title,
      item
    ) => {

      if(!item){

        return row(
          title,
          'Keine Teilnahme',
          '',
          title.includes(
            'Jagd'
          )
            ? '🏹'
            : '⚔️'
        );

      }


      return row(

        title,

        `Platz ${
          fmt(
            item.position
          )
        }`,

        `${
          de(
            item.tournament?.type
          )
        } · Punkte ${
          fmt(
            item.score
          )
        }${
          item.credits != null
            ? ` · Kämpfe übrig ${fmt(item.credits)}`
            : ''
        }`,

        title.includes(
          'Jagd'
        )
          ? '🏹'
          : '⚔️'

      );

    };


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🏆 Turniere
        </h2>
      </div>

      ${
        one(
          'Jagdturnier',
          data.hunting
        )
      }

      ${
        one(
          'Kampfturnier',
          data.combat
        )
      }

    </div>
  `;

}


/*
  SEITE RITTER
*/

function knight(){

  const p =
    S.data.profile || {};

  const stats =
    S.data.stats || {};

  const order =
    S.data.order || {};


  return `

    <div class="pageHeader">

      <h2>
        Mein Ritter
      </h2>

      <small>
        ${esc(p.name || '')}
      </small>

    </div>


    ${combatValues()}

    ${hunting()}

    ${blacksmith()}

    ${skills()}

    ${tournaments()}


    <div class="panel">

      <div class="panelHead">
        <h2>
          📈 Statistik
        </h2>
      </div>


      ${
        row(
          'PvP-Siege',

          stats.pvp?.wins,

          `Niederlagen ${
            fmt(
              stats.pvp?.losses
            )
          } · Siegquote ${
            fmt(
              stats.pvp?.winrate
            )
          } %`,

          '⚔️'
        )
      }


      ${
        row(
          'Jagdturniere',

          stats.hunting_tournament
            ?.participations,

          `Siege ${
            fmt(
              stats.hunting_tournament
                ?.wins
            )
          } · Podest ${
            fmt(
              stats.hunting_tournament
                ?.podiums
            )
          }`,

          '🏹'
        )
      }


      ${
        row(
          'Kampfturniere',

          stats.combat_tournament
            ?.participations,

          `Siege ${
            fmt(
              stats.combat_tournament
                ?.wins
            )
          } · Podest ${
            fmt(
              stats.combat_tournament
                ?.podiums
            )
          }`,

          '🏆'
        )
      }


      ${
        row(
          'Dungeon-Bosse',

          stats.dungeon
            ?.total_kills,

          `Vollständig abgeschlossen: ${
            fmt(
              stats.dungeon
                ?.fully_cleared
            )
          }`,

          '🏰'
        )
      }

    </div>


    ${
      order.order

        ? `
          <div class="panel">

            <div class="panelHead">
              <h2>
                🛡️ Orden
              </h2>
            </div>

            ${
              row(
                'Orden',

                order.order.name,

                `Rang ${
                  fmt(
                    order.order.rank
                  )
                } · ${
                  fmt(
                    order.order.members
                  )
                } Mitglieder`,

                '🛡️'
              )
            }

            ${
              row(
                'Ordenspunkte',

                order.order.points,

                '',

                '🏆'
              )
            }

            ${
              row(
                'Gespendetes Gold',

                order.donations?.gold,

                '',

                '🪙'
              )
            }

          </div>
        `

        : ''
    }

  `;

}


/*
  RUCKSACK
*/

function backpack(){

  const data =
    S.data.backpack || {};

  const items =
    data.items || [];

  const groups =
    {};


  for(
    const item
    of items
  ){

    const category =
      CATEGORY_DE[
        item.category
      ]
      ||
      item.category
      ||
      'Sonstiges';


    if(
      !groups[
        category
      ]
    ){

      groups[
        category
      ] = [];

    }


    groups[
      category
    ]
    .push(
      item
    );

  }


  return `

    <div class="pageHeader">

      <h2>
        Rucksack
      </h2>

      <small>
        ${
          fmt(
            data.total_items
            ??
            items.length
          )
        }
        Gegenstände
      </small>

    </div>


    ${
      Object.entries(
        groups
      ).length

        ? Object.entries(
            groups
          )
          .map(
            (
              [
                category,
                list
              ]
            ) => `

              <div class="panel category">

                <h3>

                  ${esc(category)}

                  <span class="tiny muted">
                    ${list.length}
                  </span>

                </h3>


                <div class="itemGrid">

                  ${
                    list
                    .map(
                      item => `

                        <div class="item">

                          <b>

                            ${
                              fmt(
                                item.amount
                              )
                            }

                            ×

                            ${
                              esc(
                                itemName(
                                  item
                                )
                              )
                            }

                          </b>

                          <small>

                            ${
                              item.level
                                ? `Stufe ${fmt(item.level)} · `
                                : ''
                            }

                            ${
                              item.is_equipped
                                ? 'Ausgerüstet'
                                : ''
                            }

                            ${
                              item.description_de
                              ||
                              item.description

                                ? `<br>${
                                    esc(
                                      item.description_de
                                      ||
                                      item.description
                                    )
                                  }`

                                : ''
                            }

                          </small>

                        </div>

                      `
                    )
                    .join('')
                  }

                </div>

              </div>

            `
          )
          .join('')

        : `
          <div class="panel empty">
            Rucksackdaten sind derzeit nicht verfügbar.
          </div>
        `
    }

  `;

}


/*
  WALD
*/

function forest(){

  const data =
    S.data.forest || {};

  const king =
    data.orc_king || {};

  const dragon =
    data.dragon || {};

  const plagues =
    data.plagues || {};


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🌲 Düsterwald live
        </h2>
      </div>


      ${
        row(
          'Orkkönig',

          king.alive
            ? 'Lebt'
            : 'Besiegt',

          king.alive

            ? `${
                fmt(
                  king.hp_percent
                )
              } % Leben · Belohnung ${
                fmt(
                  king.reward
                )
              } · seit ${
                fmt(
                  king.days_alive
                )
              } Tagen`

            : '',

          '👑'
        )
      }


      ${
        row(
          'Reichsdrache',

          de(
            dragon.phase
          ),

          dragon.attack_count != null
            ? `${fmt(dragon.attack_count)}. Angriff`
            : '',

          '🐉'
        )
      }


      ${
        Object.entries(
          plagues
        )
        .map(
          (
            [
              key,
              item
            ]
          ) => {

            if(
              !item?.active
            ){
              return '';
            }


            const color =

              key === 'green'

                ? 'Grüne'

                : (
                  key === 'yellow'
                    ? 'Gelbe'
                    : 'Rote'
                );


            return row(

              `${color} Seuche`,

              item.orc_name_de
              ||
              'Aktiv',

              `${fmt(item.remaining)} verbleibend`,

              '☣️'

            );

          }
        )
        .join('')
      }

    </div>
  `;

}


/*
  PROVINZ
*/

function province(){

  const data =
    S.data.province || {};


  if(
    data.number == null
  ){
    return '';
  }


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🏳️ Provinzkampf
        </h2>
      </div>


      ${
        row(
          'Provinz',

          data.name_de
          ||
          data.name_en,

          `Nr. ${
            fmt(
              data.number
            )
          } · ${
            de(
              data.status
            )
          }`,

          '🏳️'
        )
      }


      ${
        row(
          'Bonus',

          data.reward_de
          ||
          data.reward_en,

          '',

          '🎁'
        )
      }


      ${
        (
          data.orders ||
          []
        )
        .slice(
          0,
          3
        )
        .map(
          order =>

            row(

              `Platz ${
                order.rank
              }`,

              order.name_de
              ||
              order.name_en,

              `${
                fmt(
                  order.points
                )
              } Punkte · ${
                fmt(
                  order.tokens
                )
              } Marken`,

              '🛡️'

            )
        )
        .join('')
      }

    </div>
  `;

}


/*
  STRATEGIEKAMMER
*/

function party(){

  const party =
    S.data.party
      ?.party;


  if(!party){

    return `
      <div class="panel">

        <div class="panelHead">
          <h2>
            👥 Strategiekammer
          </h2>
        </div>

        <div class="empty">
          Du bist derzeit keiner Strategiekammer-Gruppe beigetreten.
        </div>

      </div>
    `;

  }


  return `
    <div class="panel">

      <div class="panelHead">

        <h2>
          👥 Strategiekammer
        </h2>

        <span class="pill">
          ${de(party.status)}
        </span>

      </div>


      ${
        row(
          'Dungeon',

          party.dungeon,

          '',

          '🏰'
        )
      }


      <div class="sectionTitle">
        Mitglieder
      </div>


      ${
        (
          party.members ||
          []
        )
        .map(
          member =>

            row(

              member.name,

              member.is_you
                ? 'Du'
                : (
                  member.is_leader
                    ? 'Leitung'
                    : 'Mitglied'
                ),

              '',

              member.is_leader
                ? '👑'
                : '⚔️'

            )
        )
        .join('')
      }

    </div>
  `;

}


/*
  DUNGEONS
*/

function dungeons(){

  const data =
    S.data.dungeons || {};

  const list =
    data.dungeons || [];


  return `
    <div class="panel">

      <div class="panelHead">

        <h2>
          🏰 Dungeons
        </h2>

        <span class="badge">
          ${fmt(data.total_kills || 0)}
        </span>

      </div>


      ${
        list.length

          ? list
            .map(
              dungeon => `

                <div class="eventCard">

                  <div class="eventTop">

                    <span>

                      ${
                        esc(
                          dungeon.name_de
                          ||
                          dungeon.name
                        )
                      }

                    </span>

                    <span>

                      ${
                        Object.values(
                          dungeon.difficulties ||
                          {}
                        )
                        .filter(
                          value =>
                            value.completed
                        )
                        .length
                      }

                      /

                      ${
                        Object.keys(
                          dungeon.difficulties ||
                          {}
                        )
                        .length
                      }

                    </span>

                  </div>


                  ${
                    Object.entries(
                      dungeon.difficulties ||
                      {}
                    )
                    .map(
                      (
                        [
                          key,
                          value
                        ]
                      ) => `

                        <div class="rowMeta">

                          ${de(key)}:

                          ${
                            fmt(
                              value.kills
                            )
                          }

                          /

                          ${
                            fmt(
                              value.max_kills
                            )
                          }

                          ${
                            value.completed
                              ? '✓'
                              : ''
                          }

                        </div>

                      `
                    )
                    .join('')
                  }

                </div>

              `
            )
            .join('')

          : `
            <div class="empty">
              Keine Dungeon-Daten.
            </div>
          `
      }

    </div>
  `;

}


/*
  EIGENER DRACHE
*/

function dragonCard(){

  const data =
    S.data.dragon || {};


  if(
    data.has_dragon ===
    false
  ){
    return '';
  }


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🐉 Eigener Drache
        </h2>
      </div>


      ${
        row(
          'Status',
          de(data.status),
          '',
          '🐉'
        )
      }


      ${
        row(
          'Level',

          data.level,

          `XP ${
            fmt(
              data.xp
            )
          } / ${
            fmt(
              data.xp_needed
            )
          }`,

          '⭐'
        )
      }


      ${
        row(
          'Futter',

          data.food,

          '',

          '🍖'
        )
      }


      ${
        progress(
          data.xp_percent
        )
      }

    </div>
  `;

}


/*
  AUSSENPOSTEN
*/

function outpostCard(){

  const data =
    S.data.outpost || {};

  const task =
    data.current_task;


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🏕️ Außenposten
        </h2>
      </div>


      ${
        task

          ? `
            ${
              row(
                'Aktuelle Aufgabe',

                task.description_de
                ||
                task.description
                ||
                task.ident,

                `${
                  fmt(
                    task.progress
                  )
                } / ${
                  fmt(
                    task.target
                  )
                }`,

                '📜'
              )
            }

            ${
              progress(
                (
                  Number(
                    task.progress
                  )
                  /
                  Number(
                    task.target
                  )
                )
                * 100
              )
            }
          `

          : `
            <div class="empty">
              Keine aktive Aufgabe.
            </div>
          `
      }


      <div
        class="grid3"
        style="margin-top:7px"
      >

        <div class="tile">
          <b>
            ${
              fmt(
                data.tasks_completed
              )
            }
          </b>
          <span>
            Erledigt
          </span>
        </div>


        <div class="tile">
          <b>
            ${
              fmt(
                data.tasks_skipped
              )
            }
          </b>
          <span>
            Übersprungen
          </span>
        </div>


        <div class="tile">
          <b>
            ${
              fmt(
                data.pending_rewards
              )
            }
          </b>
          <span>
            Belohnungen
          </span>
        </div>

      </div>

    </div>
  `;

}


/*
  SEITE WELT
*/

function world(){

  return `

    <div class="pageHeader">

      <h2>
        Welt & Aktivitäten
      </h2>

      <small>
        Live-Daten
      </small>

    </div>


    ${forest()}

    ${province()}

    ${party()}

    ${dungeons()}

    ${dragonCard()}

    ${outpostCard()}

  `;

}


/*
  LIFETIME
*/

function lifetime(){

  const data =
    S.data.lifetime || {};

  const combat =
    data.combat || {};

  const hunt =
    data.hunting || {};

  const economy =
    data.economy || {};

  const progression =
    data.progression || {};


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          📚 Langzeitstatistik
        </h2>
      </div>


      ${
        row(
          'Kämpfe gewonnen',

          combat.battles_won,

          `Verloren ${
            fmt(
              combat.battles_lost
            )
          } · Ruhm verdient ${
            fmt(
              combat.honor_earned
            )
          }`,

          '⚔️'
        )
      }


      ${
        row(
          'Orks besiegt',

          hunt.orcs_killed,

          `Wölfe ${
            fmt(
              hunt.wolves_killed
            )
          } · Pfeile ${
            fmt(
              hunt.arrows_shot
            )
          }`,

          '🏹'
        )
      }


      ${
        row(
          'Gold verdient',

          economy.gold_earned,

          `Leibeigene verdient ${
            fmt(
              economy.servants_earned
            )
          }`,

          '🪙'
        )
      }


      ${
        row(
          'Abenteuer abgeschlossen',

          progression.adventures_completed,

          `Saisons ${
            fmt(
              progression.seasons_played
            )
          } · gewonnen ${
            fmt(
              progression.seasons_won
            )
          }`,

          '📜'
        )
      }

    </div>
  `;

}


/*
  BESTIARIUM
*/

function bestiary(){

  const data =
    S.data.bestiary || {};

  const pets =
    data.pets || [];


  return `
    <div class="panel">

      <div class="panelHead">

        <h2>
          🐺 Hidas Bestiarium
        </h2>

        <span class="badge">
          ${
            fmt(
              data.pet_count
              ??
              pets.length
            )
          }
        </span>

      </div>


      ${
        pets.length

          ? pets
            .map(
              pet =>

                row(

                  pet.name
                  ||
                  pet.type?.name_de
                  ||
                  'Begleiter',

                  `Bindung ${
                    fmt(
                      pet.bond_level
                    )
                  }`,

                  `${
                    pet.type?.name_de
                    ||
                    ''
                  } · Leben ${
                    fmt(
                      pet.health
                    )
                  } · Hunger ${
                    fmt(
                      pet.hunger
                    )
                  } · Stimmung ${
                    fmt(
                      pet.mood
                    )
                  }`,

                  '🐾'

                )
            )
            .join('')

          : `
            <div class="empty">
              Keine Begleiter vorhanden.
            </div>
          `
      }

    </div>
  `;

}


/*
  MEHR
*/

function more(){

  return `

    <div class="pageHeader">

      <h2>
        Mehr
      </h2>

      <small>
        Statistik & Sammlung
      </small>

    </div>


    ${lifetime()}

    ${bestiary()}


    <div class="panel">

      <div class="panelHead">
        <h2>
          ℹ️ Datenquelle
        </h2>
      </div>

      <div class="empty">

        Die Übersicht verwendet ausschließlich
        Daten, die die RitterManager Premium-API
        bereitstellt. Nicht vorhandene Werte
        werden nicht erfunden.

      </div>

    </div>

  `;

}


/*
  ALLES RENDERN
*/

function render(){

  $('#overviewPage')
    .innerHTML =
      overview();


  $('#knightPage')
    .innerHTML =
      knight();


  $('#backpackPage')
    .innerHTML =
      backpack();


  $('#worldPage')
    .innerHTML =
      world();


  $('#morePage')
    .innerHTML =
      more();


  const season =
    S.data.season ||
    {};


  $('#season')
    .textContent =

      season.season != null

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

        : 'Persönliche Übersicht';


  updateCountdowns();

}


/*
  COUNTDOWNS
*/

function updateCountdowns(){

  $$(
    '[data-expires]'
  )
  .forEach(
    element => {

      const end =
        Number(
          element
            .dataset
            .expires
        );


      if(
        Number.isFinite(
          end
        )
      ){

        element.textContent =
          t(
            (
              end -
              Date.now()
            )
            /
            1000
          );

      }

    }
  );

}


/*
  ALLE DATEN LADEN
*/

async function loadAll(
  force = false
){

  if(
    S.busy
  ){
    return;
  }


  if(
    force
    &&
    Date.now() -
    lastManual <
    MANUAL
  ){
    return;
  }


  if(force){

    lastManual =
      Date.now();

  }


  S.busy =
    true;


  $('#refreshBtn')
    .textContent =
      '…';


  const errors =
    [];


  for(
    const [
      key,
      path
    ]
    of ENDPOINTS
  ){

    try{

      S.data[key] =
        await api(
          path
        );

    }catch(error){

      errors.push(
        `${path}: ${error.message}`
      );


      if(
        error.rate
      ){
        break;
      }

    }


    await sleep(
      WAIT
    );

  }


  S.busy =
    false;


  $('#refreshBtn')
    .textContent =
      '↻';


  render();


  if(
    errors.length
  ){

    $('#errorBox')
      .textContent =
        errors.join(
          '\n'
        );


    $('#errorBox')
      .classList
      .remove(
        'hidden'
      );

  }

  else{

    $('#errorBox')
      .classList
      .add(
        'hidden'
      );

  }


  localStorage
    .setItem(
      'rm_last_sync',
      Date.now()
    );

}


/*
  SEITENWECHSEL
*/

function gotoPage(
  page
){

  S.page =
    Math.max(
      0,
      Math.min(
        4,
        page
      )
    );


  $$('.page')
    .forEach(
      (
        element,
        index
      ) =>

        element
          .classList
          .toggle(
            'active',
            index ===
            S.page
          )
    );


  $$('.tab')
    .forEach(
      (
        element,
        index
      ) =>

        element
          .classList
          .toggle(
            'active',
            index ===
            S.page
          )
    );


  $('#pageDots')
    .innerHTML =

      Array
        .from(
          {
            length:5
          },
          (
            _,
            index
          ) =>

            `<i class="${
              index === S.page
                ? 'active'
                : ''
            }"></i>`

        )
        .join('');


  window.scrollTo({
    top:0,
    behavior:'smooth'
  });

}


/*
  WISCHEN
*/

function setupSwipe(){

  let startX =
    0;

  let startY =
    0;


  $('#pager')
    .addEventListener(
      'touchstart',
      event => {

        startX =
          event
            .changedTouches[0]
            .clientX;


        startY =
          event
            .changedTouches[0]
            .clientY;

      },
      {
        passive:true
      }
    );


  $('#pager')
    .addEventListener(
      'touchend',
      event => {

        const dx =
          event
            .changedTouches[0]
            .clientX
          -
          startX;


        const dy =
          event
            .changedTouches[0]
            .clientY
          -
          startY;


        /*
          Nur deutliche horizontale
          Gesten zählen.

          Normales vertikales Scrollen
          löst keinen Seitenwechsel aus.
        */

        if(
          Math.abs(dx) >
            65
          &&
          Math.abs(dx) >
            Math.abs(dy)
            *
            1.35
        ){

          gotoPage(
            S.page
            +
            (
              dx < 0
                ? 1
                : -1
            )
          );

        }

      },
      {
        passive:true
      }
    );

}


/*
  EINSTELLUNGEN
*/

function openSettings(){

  $('#proxyInput')
    .value =
      proxy();


  $('#tokenInput')
    .value =
      token();


  $('#autoInput')
    .checked =
      auto();


  $('#drawer')
    .classList
    .add(
      'open'
    );

}


function closeSettings(){

  $('#drawer')
    .classList
    .remove(
      'open'
    );

}


function setupAuto(){

  clearInterval(
    S.autoTimer
  );


  if(
    auto()
    &&
    token()
    &&
    proxy()
  ){

    S.autoTimer =
      setInterval(
        () => {

          if(
            document
              .visibilityState ===
              'visible'
          ){

            loadAll(
              false
            );

          }

        },
        AUTO
      );

  }

}


function save(){

  const proxyValue =
    $('#proxyInput')
      .value
      .trim()
      .replace(
        /\/+$/,
        ''
      );


  const tokenValue =
    $('#tokenInput')
      .value
      .trim();


  if(
    proxyValue
  ){

    localStorage
      .setItem(
        'rm_proxy',
        proxyValue
      );

  }

  else{

    localStorage
      .removeItem(
        'rm_proxy'
      );

  }


  if(
    tokenValue
  ){

    localStorage
      .setItem(
        'rm_token',
        tokenValue
      );

  }

  else{

    localStorage
      .removeItem(
        'rm_token'
      );

  }


  localStorage
    .setItem(
      'rm_auto',

      $('#autoInput')
        .checked
        ? '1'
        : '0'
    );


  closeSettings();


  setupAuto();


  loadAll(
    true
  );

}


/*
  APP INSTALLIEREN
*/

function setupInstall(){

  if(
    matchMedia(
      '(display-mode: standalone)'
    )
    .matches

    ||

    navigator
      .standalone ===
      true
  ){

    document.body
      .classList
      .add(
        'standalone'
      );

  }


  addEventListener(
    'beforeinstallprompt',
    event => {

      event.preventDefault();


      S.installPrompt =
        event;


      $('#installBtn')
        .classList
        .remove(
          'hidden'
        );

    }
  );


  $('#installBtn')
    .onclick =
      async () => {

        if(
          !S.installPrompt
        ){
          return;
        }


        S.installPrompt
          .prompt();


        await S
          .installPrompt
          .userChoice;


        S.installPrompt =
          null;


        $('#installBtn')
          .classList
          .add(
            'hidden'
          );

      };

}


/*
  START
*/

addEventListener(
  'load',
  () => {

    $$('.tab')
      .forEach(
        button => {

          button.onclick =
            () =>
              gotoPage(
                Number(
                  button.dataset.tab
                )
              );

        }
      );


    gotoPage(
      0
    );


    setupSwipe();


    setupInstall();


    $('#settingsBtn')
      .onclick =
        openSettings;


    $('#closeBtn')
      .onclick =
        closeSettings;


    $('#saveBtn')
      .onclick =
        save;


    $('#forgetBtn')
      .onclick =
        () => {

          localStorage
            .removeItem(
              'rm_token'
            );


          $('#tokenInput')
            .value =
              '';

        };


    $('#refreshBtn')
      .onclick =
        () =>
          loadAll(
            true
          );


    $('#drawer')
      .onclick =
        event => {

          if(
            event.target.id ===
            'drawer'
          ){

            closeSettings();

          }

        };


    S.countTimer =
      setInterval(
        updateCountdowns,
        1000
      );


    setupAuto();


    if(
      'serviceWorker'
      in navigator
    ){

      navigator
        .serviceWorker
        .register(
          './service-worker.js?v=6'
        )
        .catch(
          () => {}
        );

    }


    if(
      token()
      &&
      proxy()
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
