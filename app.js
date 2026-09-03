const $ =
  s =>
    document.querySelector(s);

const $$ =
  s =>
    [
      ...document.querySelectorAll(s)
    ];


const S = {

  data:{},

  busy:false,

  page:0,

  blockedUntil:0,

  autoTimer:null,

  countTimer:null,

  installPrompt:null

};


const AUTO =
  60000;

const WAIT =
  220;

const MANUAL =
  8000;

let lastManual =
  0;


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
    'potions',
    '/v1/me/potions'
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


const WEEK = [

  {
    day:1,
    icon:'🏹',
    name:'Jagd-Montag',
    desc:
      'Garantierte Jagdturniere jede Stunde und doppelter Preispool.'
  },

  {
    day:2,
    icon:'🎪',
    name:'Jahrmarkt',
    desc:
      'Glücksrad mit Gegenstands-Preisen.'
  },

  {
    day:3,
    icon:'🛡️',
    name:'Kampfklassen-Auswertung',
    desc:
      'Mittwoch um 12:01 Uhr.'
  },

  {
    day:3,
    icon:'⚔️',
    name:'Kampfturnier-Mittwoch',
    desc:
      'Garantierte Kampfturniere jede Stunde und doppelter Preispool.'
  },

  {
    day:4,
    icon:'🏆',
    name:'Doppelter Ruhm',
    desc:
      'Doppelter Ruhm aus Kämpfen.'
  },

  {
    day:5,
    icon:'🏰',
    name:
      'Ritterspiele – Registrierung',
    desc:
      'Freitag: Anmeldung zu den Ritterspielen.'
  },

  {
    day:6,
    icon:'⚔️',
    name:
      'Ritterspiele – Kämpfe',
    desc:
      'Samstag: Kämpfe für den Orden.'
  },

  {
    day:0,
    icon:'👑',
    name:
      'Ritterspiele – Siegerehrung',
    desc:
      'Sonntag: Auswertung und Belohnungen.'
  }

];


const TR = {

  active:'aktiv',

  inactive:'inaktiv',

  running:'läuft',

  closed:'geschlossen',

  open:'offen',

  rewards:'Belohnungen',

  registration:'Registrierung',

  fighting:'Kämpfe',

  ceremony:'Siegerehrung',

  away:'nicht anwesend',

  attack:'Angriff',

  hurt:'besiegt',

  egg:'Ei',

  baby:'Babydrache',

  kid:'Jungdrache',

  adult:
    'Erwachsener Drache',

  idle:'wartet',

  normal:'Normal',

  heroic:'Heroisch',

  legendary:'Legendär',

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

  aim:{
    name:'Zielgenauigkeit',
    desc:
      'Erhöht die Zielgenauigkeit im Düsterwald.'
  },

  all_hunt:{
    name:'Jagdmeister',
    desc:
      'Erhöht mehrere Jagdwerte gleichzeitig.'
  },

  breakthrough:{
    name:'Durchschlagskraft',
    desc:
      'Erhöht die Durchschlagskraft im Düsterwald.'
  },

  fix_hp:{
    name:'Lebenskraft',
    desc:
      'Erhöht die maximalen Lebenspunkte.'
  },

  forest_xp:{
    name:'Walderfahrung',
    desc:
      'Erhöht die Erfahrung im Düsterwald.'
  },

  hunting_skills:{
    name:'Jagdinstinkt',
    desc:
      'Erhöht die Chance auf Jagdfähigkeiten.'
  },

  ice:{
    name:'Frostschutz',
    desc:
      'Gewährt Schutz gegen Feuer.'
  },

  loot_bonus:{
    name:'Beutebonus',
    desc:
      'Erhöht die Chance auf Beute.'
  },

  marks:{
    name:'Spurenleser',
    desc:
      'Erhöht die Fähigkeit, Spuren zu lesen.'
  },

  max_hp:{
    name:'Lebensboost',
    desc:
      'Erhöht die maximalen Lebenspunkte prozentual.'
  },

  str:{
    name:'Stärkeboost',
    desc:
      'Erhöht die Stärke prozentual.'
  },

  threat:{
    name:'Bedrohung',
    desc:
      'Erhöht die Bedrohung im Dungeon.'
  },

  forest_curse:{
    name:
      'Fluch des Ork-Hauptmanns',

    desc:
      'Negative Wirkung durch den Ork-Hauptmann.'
  },

  toxic:{
    name:'Vergiftet',
    desc:
      'Verringert mehrere Werte.'
  }

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


const ITEM_DE = {

  health_potion:
    'Heiltrank',

  strength_potion:
    'Stärketrank',

  silver_arrows:
    'Silberpfeile',

  healing_herbs:
    'Heilkräuter',

  throwing_axes:
    'Wurfäxte',

  wolf_bait:
    'Wolfsköder',

  apple:
    'Apfel',

  blackberries:
    'Brombeeren',

  raspberries:
    'Himbeeren',

  honeycomb:
    'Honigwabe',

  carrots:
    'Möhren',

  orc_meat:
    'Ork-Fleisch',

  wild_boar_meat:
    'Wildschwein-Fleisch',

  forest_mushrooms:
    'Waldpilze',

  small_meals:
    'Kleine Mahlzeiten',

  shadow_dust:
    'Schattenstaub',

  silver_bars:
    'Silberbarren',

  thorium_shard:
    'Thorium-Splitter',

  royal_medal:
    'Königliche Medaille',

  province_coins:
    'Provinzmünzen',

  free_tickets:
    'Freilose',

  slime_bags:
    'Schleimbeutel'

};


const ITEM_NAME_DE = {

  'health potion':
    'Heiltrank',

  'strength potion':
    'Stärketrank',

  'silver arrows':
    'Silberpfeile',

  'healing herbs':
    'Heilkräuter',

  'throwing axes':
    'Wurfäxte',

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


const OUTPOST_DE = {

  skill_variety:
    'Nutze verschiedene Jagdfähigkeiten.',

  all_orc_types:
    'Besiege verschiedene Ork-Arten.'

};


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
    v === null
    ||
    v === undefined
    ||
    v === ''
  ){
    return '–';
  }

  return (
    typeof v === 'number'

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
    v =>
      v !== undefined
      &&
      v !== null
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
    r =>
      setTimeout(
        r,
        ms
      )
  );
}


function unwrap(body){

  return (
    body
    &&
    typeof body === 'object'
    &&
    body.success === true
    &&
    Object.prototype
      .hasOwnProperty
      .call(
        body,
        'data'
      )
  )

    ? body.data

    : body;
}


/*
  Zentraler Zahlenleser.

  Wichtig für Werte wie:
  Stärke, Verteidigung, Glück,
  Energie, Genauigkeit,
  Spuren lesen usw.

  Bevorzugt TOTAL.
*/

function metricNumber(x){

  if(
    x === null
    ||
    x === undefined
  ){
    return null;
  }


  if(
    typeof x === 'number'
    &&
    Number.isFinite(x)
  ){
    return x;
  }


  if(
    typeof x === 'string'
    &&
    x.trim() !== ''
    &&
    Number.isFinite(
      Number(x)
    )
  ){
    return Number(x);
  }


  if(
    typeof x !== 'object'
  ){
    return null;
  }


  for(
    const key
    of [
      'total',
      'current',
      'value',
      'amount',
      'score',
      'level'
    ]
  ){

    if(
      Number.isFinite(
        Number(
          x[key]
        )
      )
    ){

      return Number(
        x[key]
      );
    }
  }


  if(
    Number.isFinite(
      Number(x.base)
    )
    &&
    Number.isFinite(
      Number(x.bonus)
    )
  ){

    return (
      Number(x.base)
      +
      Number(x.bonus)
    );
  }


  if(
    Number.isFinite(
      Number(x.base)
    )
  ){

    return Number(
      x.base
    );
  }


  return null;
}


function itemName(x){

  if(
    x?.name_de
  ){
    return x.name_de;
  }


  const ident =
    String(
      x?.ident || ''
    )
    .toLowerCase();


  if(
    ITEM_DE[
      ident
    ]
  ){

    return ITEM_DE[
      ident
    ];
  }


  const raw =
    String(
      x?.name
      ||
      x?.ident
      ||
      ''
    );


  return (
    ITEM_NAME_DE[
      raw.toLowerCase()
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


/* API */

async function api(path){

  if(
    Date.now()
    <
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
    !token()
    ||
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
        headers: {

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


  let body =
    null;


  try{

    body =
      raw
        ? JSON.parse(raw)
        : null;

  }catch{}


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
          match?.[1]
          ||
          60
        )
        *
        1000;


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


/* TIMER */

function t(seconds){

  seconds =
    Math.max(
      0,
      Math.ceil(
        Number(seconds)
        ||
        0
      )
    );


  const h =
    Math.floor(
      seconds / 3600
    );


  const m =
    Math.floor(
      (
        seconds % 3600
      )
      /
      60
    );


  const r =
    seconds % 60;


  return h

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


function expiry(obj){

  if(
    !obj
    ||
    typeof obj !==
    'object'
  ){
    return null;
  }


  const absolute =
    obj.expires_at
    ??
    obj.finishes_at;


  if(
    absolute != null
  ){

    const n =
      Number(
        absolute
      );


    if(
      Number.isFinite(n)
    ){

      return (
        n > 2e12
          ? n
          : n * 1000
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
      obj.expires_datetime
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
        obj.remaining_seconds
      )
    )
  ){

    return (
      Date.now()
      +
      Number(
        obj.remaining_seconds
      )
      *
      1000
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
      Date.now()
      +
      Number(
        obj.remaining_minutes
      )
      *
      60000
    );
  }


  return null;
}


/* HTML-HILFEN */

function progress(value){

  value =
    Math.max(
      0,
      Math.min(
        100,
        Number(value)
        ||
        0
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
  meta='',
  icon=''
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
        ${esc(
          fmt(value)
        )}
      </div>

    </div>
  `;
}


/* PROFIL */

function hero(){

  const p =
    S.data.profile
    ||
    {};


  const ranking =
    p.ranking
    ||
    {};


  const rank =
    p.rank
    ||
    {};


  const currencies =
    p.currencies
    ||
    {};


  const combat =
    p.combat
    ||
    {};


  const energy =
    metricNumber(
      val(
        p.energy,
        p.resources?.energy
      )
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


  const hp =
    metricNumber(
      combat.hp
    );


  return `
    <div class="card hero">

      <div class="heroTop">

        <div>

          <div class="name">

            ${esc(
              p.name
              ||
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

            📍

            ${esc(
              p.status?.location
              ||
              'Unterwegs'
            )}

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
                <b>
                  ${
                    fmt(
                      metricNumber(servants)
                      ??
                      servants
                    )
                  }
                </b>
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
                <b>
                  ${
                    fmt(
                      metricNumber(arrows)
                      ??
                      arrows
                    )
                  }
                </b>
                <span>Pfeilmacher</span>
              </div>
            `
            : ''
        }


        ${
          hp != null
            ? `
              <div class="tile">
                <span class="emoji">❤️</span>
                <b>${fmt(hp)}</b>
                <span>Lebenspunkte</span>
              </div>
            `
            : ''
        }

      </div>

    </div>
  `;
}


/* BUFFS + TRÄNKE */

function mergedEffects(){

  const buffs =
    S.data.buffs
    ||
    {};


  const potions =
    S.data.potions
    ||
    {};


  const result =
    [];


  for(
    const item
    of (
      buffs.buffs
      ||
      []
    )
  ){

    result.push({
      ...item,
      bad:false,
      kind:'buff'
    });
  }


  for(
    const item
    of (
      buffs.debuffs
      ||
      []
    )
  ){

    result.push({
      ...item,
      bad:true,
      kind:'debuff'
    });
  }


  for(
    const item
    of (
      potions.potions
      ||
      []
    )
  ){

    const duplicate =
      result.some(
        effect =>
          effect.id ===
          item.id

          ||

          String(
            effect.source_item?.name
            ||
            ''
          )
          .toLowerCase()
          ===
          String(
            item.name
            ||
            ''
          )
          .toLowerCase()
      );


    if(
      !duplicate
    ){

      result.push({
        ...item,
        bad:false,
        kind:'potion',
        type:'potion'
      });
    }
  }


  return result;
}


function buffs(){

  const all =
    mergedEffects();


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
                      expiry(a)
                      ||
                      Infinity
                    )
                    -
                    (
                      expiry(b)
                      ||
                      Infinity
                    )
                )

                .map(
                  item => {

                    const end =
                      expiry(
                        item
                      );


                    const meta =
                      EFFECT[
                        item.type
                      ]
                      ||
                      {};


                    const name =
                      item.kind ===
                      'potion'

                        ? (
                          ITEM_NAME_DE[
                            String(
                              item.name
                              ||
                              ''
                            )
                            .toLowerCase()
                          ]
                          ||
                          item.name
                          ||
                          'Trank'
                        )

                        : (
                          meta.name
                          ||
                          item.name
                          ||
                          item.type
                          ||
                          'Wirkung'
                        );


                    const description =
                      item.kind ===
                      'potion'

                        ? 'Aktiver Trank'

                        : (
                          meta.desc
                          ||
                          'Aktiver Effekt'
                        );


                    return `
                      <div class="row">

                        <div class="rowMain">

                          <div class="rowTitle">

                            ${
                              item.bad
                                ? '☠️'
                                : '✨'
                            }

                            ${esc(name)}

                          </div>

                          <div class="rowMeta">
                            ${esc(description)}
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
                                    end
                                    -
                                    Date.now()
                                  )
                                  /
                                  1000
                                )

                              : (
                                item.remaining_minutes
                                != null

                                  ? (
                                    `${fmt(
                                      item.remaining_minutes
                                    )} Min`
                                  )

                                  : '–'
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
              Keine aktiven Buffs, Debuffs oder Tränke.
            </div>
          `
      }

    </div>
  `;
}


/* SHOP */

function extractShopOffers(data){

  if(
    Array.isArray(
      data
    )
  ){
    return data;
  }


  if(
    !data
    ||
    typeof data !==
    'object'
  ){
    return [];
  }


  const candidates = [

    data.offers,

    data.items,

    data.current_offers,

    data.currentOffers,

    data.shop?.offers,

    data.shop?.items,

    data.data?.offers,

    data.data?.items

  ];


  for(
    const candidate
    of candidates
  ){

    if(
      Array.isArray(
        candidate
      )
    ){
      return candidate;
    }
  }


  return [];
}


function shop(){

  const offers =
    extractShopOffers(
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

                    const rawName =
                      offer.item_name
                      ??
                      offer.name
                      ??
                      offer.title
                      ??
                      offer.item?.name_de
                      ??
                      offer.item?.name
                      ??
                      `Gegenstand ${
                        offer.item_id
                        ??
                        offer.id
                        ??
                        ''
                      }`;


                    const name =
                      ITEM_NAME_DE[
                        String(
                          rawName
                        )
                        .toLowerCase()
                      ]
                      ||
                      rawName;


                    const price =
                      offer.price
                      ??
                      offer.cost
                      ??
                      offer.amount
                      ??
                      offer.value;


                    const currency =
                      String(
                        offer.currency
                        ??
                        offer.currency_name
                        ??
                        offer.cost_currency
                        ??
                        ''
                      )
                      .toLowerCase();


                    const currencyText =
                      currency.includes(
                        'diamond'
                      )

                        ? '💎 Diamanten'

                        : (
                          currency.includes(
                            'gold'
                          )

                            ? '🪙 Gold'

                            : currency
                        );


                    return `
                      <div class="item">

                        <b>
                          ${esc(name)}
                        </b>

                        <small>

                          ${fmt(price)}

                          ${esc(currencyText)}

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
              Die Shop-API meldet derzeit keine Angebote.
            </div>
          `
      }

    </div>
  `;
}


/* EVENTS */

function isActiveEvent(
  value
){

  if(
    value === true
  ){
    return true;
  }


  if(
    !value
    ||
    typeof value !==
    'object'
  ){
    return false;
  }


  if(
    value.active === true
    ||
    value.is_active === true
  ){
    return true;
  }


  return [
    'active',
    'running',
    'registration',
    'fighting',
    'ceremony'
  ]
  .includes(
    String(
      value.status
      ??
      value.state
      ??
      ''
    )
    .toLowerCase()
  );
}


function activeEvents(){

  const live =
    S.data.live
    ||
    {};


  const result =
    [];


  for(
    const [
      key,
      value
    ]
    of Object.entries(
      live.weekly_events
      ||
      {}
    )
  ){

    if(
      !isActiveEvent(
        value
      )
    ){
      continue;
    }


    let name =
      EVENT_NAMES[
        key
      ]
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


  for(
    const [
      key,
      value
    ]
    of Object.entries(
      live.events
      ||
      {}
    )
  ){

    if(
      !isActiveEvent(
        value
      )
    ){
      continue;
    }


    result.push({

      name:
        value?.name_de
        ||
        EVENT_NAMES[
          key
        ]
        ||
        key,

      meta:
        value?.description_de
        ||
        'Aktives Sonder-Event'
    });
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
            event.day
            -
            today
            +
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
        a.delta
        -
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

                          ✨

                          ${esc(
                            event.name
                          )}

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

                      ${esc(
                        event.name
                      )}

                    </span>

                    <span class="eventWhen">

                      ${when(
                        event.delta
                      )}

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


/* SCHNELLÜBERSICHT */

function quickStatus(){

  const profile =
    S.data.profile
    ||
    {};


  const ranking =
    profile.ranking
    ||
    {};


  const activity =
    ranking.activity_rank
    ||
    {};


  const hunting =
    profile.hunting
    ||
    {};


  const upgrades =
    profile.upgrades
    ||
    {};


  const stats =
    S.data.stats
    ||
    {};


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
                profile.rank?.number
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

          <b>
            ${fmt(hunting.level)}
          </b>

          <span>Jagdlevel</span>

        </div>


        <div class="tile">

          <b>
            ${fmt(profile.progress?.tower)}
          </b>

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

          <span>PvP-Siegquote</span>

        </div>

      </div>

    </div>
  `;
}


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


/* KAMPFWERTE */

function combatValues(){

  const profile =
    S.data.profile
    ||
    {};


  const combat =
    profile.combat
    ||
    {};


  const activity =
    profile.ranking
      ?.activity_rank
    ||
    {};


  const values = [

    [
      'Lebenspunkte',

      metricNumber(
        combat.hp
      ),

      '❤️'
    ],

    [
      'Stärke',

      metricNumber(
        combat.strength
      ),

      '💣'
    ],

    [
      'Verteidigung',

      metricNumber(
        combat.defense
      ),

      '🛡️'
    ],

    [
      'Geschwindigkeit',

      metricNumber(
        combat.speed
      ),

      '🥕'
    ],

    [
      'Glück',

      metricNumber(
        combat.luck
      ),

      '🧲'
    ],

    [
      'Kritisch',

      metricNumber(
        combat.critical
        ??
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
              Keine detaillierten Kampfwerte verfügbar.
            </div>
          `
      }


      ${
        activity.rank != null

          ? row(

              'Aktivitätsrang',

              `${
                activity.rank
              } / ${
                activity.max_rank
              }`,

              `${
                fmt(
                  activity
                  .better_than_percent
                )
              } % besser als Vergleichsgruppe`,

              '📈'
            )

          : ''
      }

    </div>
  `;
}


/* JAGD */

function hunting(){

  const hunting =
    S.data.profile
      ?.hunting
    ||
    {};


  const values = [

    [
      'Jagdlevel',

      metricNumber(
        hunting.level
      ),

      '🌲'
    ],

    [
      'Jagdpunkte',

      metricNumber(
        hunting.points
      ),

      '🦌'
    ],

    [
      'Abschüsse',

      metricNumber(
        hunting.kills
      ),

      '💀'
    ],

    [
      'Durchschlagskraft',

      metricNumber(
        hunting.breakthrough
        ??
        hunting.breakthrough_power
      ),

      '💣'
    ],

    [
      'Genauigkeit',

      metricNumber(
        hunting.aim
        ??
        hunting.accuracy
      ),

      '🎯'
    ],

    [
      'Spuren lesen',

      metricNumber(
        hunting.marks
        ??
        hunting.tracking
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
              Keine Jagdwerte verfügbar.
            </div>
          `
      }

    </div>
  `;
}


/* SCHMIED */

function blacksmith(){

  const data =
    S.data.blacksmith
    ||
    {};


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🔨 Schmied
        </h2>
      </div>


      ${
        [
          [
            'sword',
            'Schwert',
            '⚔️'
          ],

          [
            'armor',
            'Rüstung',
            '🛡️'
          ],

          [
            'shelter',
            'Unterkunft',
            '🏠'
          ]
        ]

        .map(
          (
            [
              key,
              label,
              icon
            ]
          ) => {

            const item =
              data[key];


            if(
              !item
            ){
              return '';
            }


            const end =
              expiry(
                item.timer
              );


            const meta =
              item.in_progress

                ? (
                  end
                    ? (
                      `Fertig in ${
                        t(
                          (
                            end
                            -
                            Date.now()
                          )
                          /
                          1000
                        )
                      }`
                    )

                    : 'Ausbau läuft'
                )

                : (
                  `Nächste Stufe: ${
                    fmt(
                      item
                      .next_upgrade
                      ?.cost_gold
                    )
                  } Gold`
                );


            return row(
              label,
              `Stufe ${
                fmt(
                  item.level
                )
              }`,
              meta,
              icon
            );
          }
        )

        .join('')
      }

    </div>
  `;
}


/* FÄHIGKEITEN */

function skills(){

  const data =
    S.data.skills
    ||
    {};


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
            items
            ||
            []
          ).length

            ? (
              items
              ||
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

                  ${esc(
                    skillName(
                      item
                    )
                  )}

                  ·

                  ${fmt(
                    item.level
                  )}

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


/* TURNIERE */

function tournaments(){

  const data =
    S.data.tournaments
    ||
    {};


  const one =
    (
      title,
      item
    ) => {

      if(
        !item
      ){

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
            item.tournament
              ?.type
          )
        } · Punkte ${
          fmt(
            item.score
          )
        }${
          item.credits != null
            ? (
              ` · Kämpfe übrig ${
                fmt(
                  item.credits
                )
              }`
            )
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


/* RITTER-SEITE */

function knight(){

  const profile =
    S.data.profile
    ||
    {};


  const stats =
    S.data.stats
    ||
    {};


  const order =
    S.data.order
    ||
    {};


  return `

    <div class="pageHeader">

      <h2>
        Mein Ritter
      </h2>

      <small>
        ${esc(
          profile.name
          ||
          ''
        )}
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
              stats.pvp
                ?.losses
            )
          } · Siegquote ${
            fmt(
              stats.pvp
                ?.winrate
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
              stats
              .hunting_tournament
              ?.wins
            )
          } · Podest ${
            fmt(
              stats
              .hunting_tournament
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
              stats
              .combat_tournament
              ?.wins
            )
          } · Podest ${
            fmt(
              stats
              .combat_tournament
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

                order.donations
                  ?.gold,

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


/* RUCKSACK */

function backpack(){

  const data =
    S.data.backpack
    ||
    {};


  const items =
    data.items
    ||
    [];


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
      ] =
        [];
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
      Object.keys(
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
                      item => {

                        const description =
                          item.description_de
                          ||
                          item.description
                          ||
                          '';


                        const meta =
                          [
                            item.level
                              ? `Stufe ${
                                  fmt(
                                    item.level
                                  )
                                }`
                              : '',

                            item.is_equipped
                              ? 'Ausgerüstet'
                              : ''
                          ]

                          .filter(Boolean)

                          .join(' · ');


                        return `
                          <details class="item">

                            <summary>

                              <span>

                                ${fmt(
                                  item.amount
                                )}

                                ×

                                ${esc(
                                  itemName(
                                    item
                                  )
                                )}

                              </span>

                            </summary>


                            <div class="itemDescription">

                              ${
                                description
                                  ? esc(
                                      description
                                    )
                                  : (
                                    'Keine zusätzliche Beschreibung verfügbar.'
                                  )
                              }

                              ${
                                meta
                                  ? `
                                    <span class="itemMeta">
                                      ${esc(meta)}
                                    </span>
                                  `
                                  : ''
                              }

                            </div>

                          </details>
                        `;
                      }
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


/* DÜSTERWALD */

function forest(){

  const data =
    S.data.forest
    ||
    {};


  const captain =
    data.orc_king
    ||
    {};


  const dragon =
    data.dragon
    ||
    {};


  const plagues =
    data.plagues
    ||
    {};


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🌲 Düsterwald live
        </h2>
      </div>


      ${
        row(

          'Ork-Hauptmann',

          captain.alive
            ? 'Lebt'
            : 'Besiegt',

          captain.alive

            ? (
              `${
                fmt(
                  captain.hp_percent
                )
              } % Leben · Belohnung ${
                fmt(
                  captain.reward
                )
              } · seit ${
                fmt(
                  captain.days_alive
                )
              } Tagen`
            )

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

            ? (
              `${
                fmt(
                  dragon.attack_count
                )
              }. Angriff`
            )

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

              `${
                fmt(
                  item.remaining
                )
              } verbleibend`,

              '☣️'
            );
          }
        )

        .join('')
      }

    </div>
  `;
}


/* PROVINZ */

function province(){

  const data =
    S.data.province
    ||
    {};


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
          data.orders
          ||
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


/* STRATEGIEKAMMER */

function party(){

  const party =
    S.data.party
      ?.party;


  if(
    !party
  ){

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
          party.members
          ||
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


/* DUNGEONS */

function dungeons(){

  const data =
    S.data.dungeons
    ||
    {};


  const list =
    data.dungeons
    ||
    [];


  return `
    <div class="panel">

      <div class="panelHead">

        <h2>
          🏰 Dungeons
        </h2>

        <span class="badge">
          ${
            fmt(
              data.total_kills
              ||
              0
            )
          }
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

                      ${esc(
                        dungeon.name_de
                        ||
                        dungeon.name
                        ||
                        'Dungeon'
                      )}

                    </span>

                    <span>

                      ${
                        Object.values(
                          dungeon.difficulties
                          ||
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
                          dungeon.difficulties
                          ||
                          {}
                        )
                        .length
                      }

                    </span>

                  </div>


                  ${
                    Object.entries(
                      dungeon.difficulties
                      ||
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


/* EIGENER DRACHE */

function dragonCard(){

  const data =
    S.data.dragon
    ||
    {};


  if(
    data.has_dragon === false
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


/* AUSSENPOSTEN */

function outpostCard(){

  const data =
    S.data.outpost
    ||
    {};


  const task =
    data.current_task;


  const description =
    task

      ? (
        task.description_de
        ||
        OUTPOST_DE[
          task.ident
        ]
        ||
        'Aktuelle Aufgabe im Außenposten'
      )

      : 'Keine aktive Aufgabe.';


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

                description,

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
                Number(
                  task.target
                )

                  ? (
                    Number(
                      task.progress
                    )
                    /
                    Number(
                      task.target
                    )
                    *
                    100
                  )

                  : 0
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
            ${fmt(data.tasks_completed)}
          </b>

          <span>
            Erledigt
          </span>

        </div>


        <div class="tile">

          <b>
            ${fmt(data.tasks_skipped)}
          </b>

          <span>
            Übersprungen
          </span>

        </div>


        <div class="tile">

          <b>
            ${fmt(data.pending_rewards)}
          </b>

          <span>
            Belohnungen
          </span>

        </div>

      </div>

    </div>
  `;
}


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


/* LANGZEIT */

function lifetime(){

  const data =
    S.data.lifetime
    ||
    {};


  const combat =
    data.combat
    ||
    {};


  const hunting =
    data.hunting
    ||
    {};


  const economy =
    data.economy
    ||
    {};


  const progression =
    data.progression
    ||
    {};


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

          hunting.orcs_killed,

          `Wölfe ${
            fmt(
              hunting.wolves_killed
            )
          } · Pfeile ${
            fmt(
              hunting.arrows_shot
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


/* HAUSTIER */

function petCard(){

  const data =
    S.data.bestiary
    ||
    {};


  const pets =
    data.pets
    ||
    [];


  return `
    <div class="panel">

      <div class="panelHead">

        <h2>
          🐾 Haustier
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
                  'Haustier',

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
              Kein Haustier vorhanden.
            </div>
          `
      }

    </div>
  `;
}


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

    ${petCard()}

  `;
}


/* RENDER */

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
    S.data.season
    ||
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


/* COUNTDOWNS */

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
              end
              -
              Date.now()
            )
            /
            1000
          );
      }
    }
  );
}


/* LADEN */

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
    Date.now()
    -
    lastManual
    <
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
        `${path}: ${
          error.message
        }`
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

  }else{

    $('#errorBox')
      .classList
      .add(
        'hidden'
      );
  }


  localStorage.setItem(
    'rm_last_sync',
    Date.now()
  );
}


/* SEITENWECHSEL */

function gotoPage(page){

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

      Array.from(
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


/* WISCHEN */

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


/* EINSTELLUNGEN */

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
            document.visibilityState
            ===
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

    localStorage.setItem(
      'rm_proxy',
      proxyValue
    );

  }else{

    localStorage.removeItem(
      'rm_proxy'
    );
  }


  if(
    tokenValue
  ){

    localStorage.setItem(
      'rm_token',
      tokenValue
    );

  }else{

    localStorage.removeItem(
      'rm_token'
    );
  }


  localStorage.setItem(
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


/* INSTALL */

function setupInstall(){

  if(
    matchMedia(
      '(display-mode: standalone)'
    )
    .matches

    ||

    navigator.standalone ===
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


/* START */

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
          './service-worker.js?v=7'
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

    }else{

      openSettings();
    }
  }
);
