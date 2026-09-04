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


const AUTO = 60000;
const WAIT = 220;
const MANUAL = 8000;

let lastManual = 0;


const ENDPOINTS = [

  ['profile','/v1/me'],

  ['stats','/v1/me/stats'],

  ['buffs','/v1/me/buffs'],

  ['potions','/v1/me/potions'],

  ['shop','/v1/game/shop'],

  ['season','/v1/game/season'],

  ['live','/v1/game/live'],

  ['blacksmith','/v1/me/blacksmith'],

  ['dragon','/v1/me/dragon'],

  ['outpost','/v1/me/outpost'],

  ['skills','/v1/me/skills?desc=1'],

  ['tournaments','/v1/me/tournaments'],

  ['backpack','/v1/me/backpack?desc=1'],

  ['forest','/v1/game/forest'],

  ['province','/v1/game/province'],

  ['party','/v1/me/party'],

  ['dungeons','/v1/me/dungeons'],

  ['order','/v1/me/order'],

  ['lifetime','/v1/me/lifetime'],

  ['bestiary','/v1/me/bestiary']

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
      'Mittwoch: Auswertung der Kampfklassen.'
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
      'Samstag: Kämpfe der Ritterspiele.'
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


const EFFECT = {

  aim:[
    'Zielgenauigkeit',
    'Erhöht die Zielgenauigkeit im Düsterwald.'
  ],

  all_hunt:[
    'Jagdmeister',
    'Erhöht mehrere Jagdwerte gleichzeitig.'
  ],

  breakthrough:[
    'Durchschlagskraft',
    'Erhöht die Durchschlagskraft im Düsterwald.'
  ],

  fix_hp:[
    'Lebenskraft',
    'Erhöht die maximalen Lebenspunkte.'
  ],

  forest_xp:[
    'Walderfahrung',
    'Erhöht die Erfahrung im Düsterwald.'
  ],

  hunting_skills:[
    'Jagdinstinkt',
    'Erhöht die Chance auf Jagdfähigkeiten.'
  ],

  ice:[
    'Frostschutz',
    'Gewährt zusätzlichen Schutz.'
  ],

  loot_bonus:[
    'Beutebonus',
    'Erhöht die Chance auf Beute.'
  ],

  marks:[
    'Spurenleser',
    'Erhöht die Fähigkeit, Spuren zu lesen.'
  ],

  max_hp:[
    'Lebensboost',
    'Erhöht die maximalen Lebenspunkte.'
  ],

  str:[
    'Stärkeboost',
    'Erhöht die Stärke.'
  ],

  threat:[
    'Bedrohung',
    'Verändert die Bedrohung im Dungeon.'
  ],

  forest_curse:[
    'Fluch des Ork-Hauptmanns',
    'Negative Wirkung durch den Ork-Hauptmann.'
  ],

  toxic:[
    'Vergiftet',
    'Verringert mehrere Werte.'
  ]

};


const CATEGORY_DE = {

  Potions:'Tränke',

  Equipment:'Ausrüstung',

  Food:'Nahrung',

  Consumables:'Verbrauchbar',

  Crafting:'Handwerkswaren',

  Misc:'Sonstiges'

};


const ITEM_DE = {

  health_potion:'Heiltrank',

  strength_potion:'Stärketrank',

  silver_arrows:'Silberpfeile',

  healing_herbs:'Heilkräuter',

  throwing_axes:'Wurfäxte',

  wolf_bait:'Wolfsköder',

  apple:'Apfel',

  blackberries:'Brombeeren',

  raspberries:'Himbeeren',

  honeycomb:'Honigwabe',

  carrots:'Möhren',

  orc_meat:'Ork-Fleisch',

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

  Fireball:'Feuerball',

  'Shield Wall':
    'Schildwall',

  'Quick Shot':
    'Schnellschuss',

  Bandage:'Verband',

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


function val(...xs){

  return xs.find(
    x =>
      x !== undefined
      &&
      x !== null
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


/* ZAHLEN AUS VERSCHACHTELTEN OBJEKTEN */

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
    const k
    of [
      'total',
      'current',
      'value',
      'amount',
      'score',
      'level',
      'points',
      'count'
    ]
  ){

    if(
      Number.isFinite(
        Number(
          x[k]
        )
      )
    ){
      return Number(
        x[k]
      );
    }
  }

  if(
    Number.isFinite(
      Number(
        x.base
      )
    )
    &&
    Number.isFinite(
      Number(
        x.bonus
      )
    )
  ){

    return (
      Number(
        x.base
      )
      +
      Number(
        x.bonus
      )
    );
  }

  if(
    Number.isFinite(
      Number(
        x.base
      )
    )
  ){
    return Number(
      x.base
    );
  }

  return null;
}


function getPath(
  obj,
  path
){

  let current =
    obj;

  for(
    const part
    of path.split('.')
  ){

    if(
      current == null
    ){
      return null;
    }

    current =
      current[
        part
      ];
  }

  return current;
}


function deepMetric(
  obj,
  paths
){

  for(
    const path
    of paths
  ){

    const number =
      metricNumber(
        getPath(
          obj,
          path
        )
      );

    if(
      number != null
    ){
      return number;
    }
  }

  return null;
}


/*
  Falls KnightManager einen Jagdwert
  tiefer verschachtelt zurückgibt,
  wird nach dem Feldnamen gesucht.
*/

function recursiveMetric(
  obj,
  keyNames,
  maxDepth = 5
){

  const targets =
    new Set(
      keyNames.map(
        key =>
          key.toLowerCase()
      )
    );

  const seen =
    new Set();


  function walk(
    node,
    depth
  ){

    if(
      node == null
      ||
      depth > maxDepth
      ||
      typeof node !==
      'object'
      ||
      seen.has(
        node
      )
    ){
      return null;
    }


    seen.add(
      node
    );


    for(
      const [
        key,
        value
      ]
      of Object.entries(
        node
      )
    ){

      if(
        targets.has(
          key.toLowerCase()
        )
      ){

        const number =
          metricNumber(
            value
          );

        if(
          number != null
        ){
          return number;
        }
      }
    }


    for(
      const value
      of Object.values(
        node
      )
    ){

      const number =
        walk(
          value,
          depth + 1
        );

      if(
        number != null
      ){
        return number;
      }
    }

    return null;
  }


  return walk(
    obj,
    0
  );
}


function itemName(x){

  if(
    x?.name_de
  ){
    return x.name_de;
  }


  const ident =
    String(
      x?.ident
      ||
      ''
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
      x?.item_name
      ||
      x?.name
      ||
      x?.ident
      ||
      'Gegenstand'
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


      const seconds =
        Number(
          match?.[1]
          ||
          60
        );


      S.blockedUntil =
        Date.now()
        +
        seconds
        *
        1000;


      throw Object.assign(
        new Error(
          `API-Limit erreicht. Noch ca. ${seconds} Sekunden.`
        ),
        {
          rate:true
        }
      );
    }


    throw new Error(
      `${path}: HTTP ${
        response.status
      }${
        raw
          ? ` – ${
              raw.slice(
                0,
                120
              )
            }`
          : ''
      }`
    );
  }


  return unwrap(
    body
  );
}


/* ZEIT */

function timeLeft(seconds){

  seconds =
    Math.max(
      0,
      Math.ceil(
        Number(
          seconds
        )
        ||
        0
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
      )
      /
      60
    );


  const rest =
    seconds % 60;


  return hours

    ? (
      `${hours}:` +
      `${String(minutes).padStart(2,'0')}:` +
      `${String(rest).padStart(2,'0')}`
    )

    : (
      `${minutes}:` +
      `${String(rest).padStart(2,'0')}`
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


/* HTML */

function progress(percent){

  const value =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          percent
        )
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
        ${esc(
          fmt(
            value
          )
        )}
      </div>

    </div>
  `;
}


/* PROFIL */

function hero(){

  const profile =
    S.data.profile
    ||
    {};


  const ranking =
    profile.ranking
    ||
    {};


  const rank =
    profile.rank
    ||
    {};


  const currencies =
    profile.currencies
    ||
    {};


  const combat =
    profile.combat
    ||
    {};


  const energy =
    metricNumber(
      val(
        profile.energy,
        profile.resources?.energy
      )
    );


  const servants =
    metricNumber(
      val(
        currencies.servants,
        profile.servants,
        profile.resources?.servants
      )
    );


  const arrows =
    metricNumber(
      val(
        currencies.arrow_makers,
        profile.arrow_makers,
        profile.arrowmakers,
        profile.resources?.arrow_makers
      )
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
              profile.name
              ||
              'Mein Ritter'
            )}
          </div>

          <div class="rankline">

            ${esc(
              [
                rank.title,
                profile.title,

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
              profile.status?.location
              ||
              'Unterwegs'
            )}

          </div>

        </div>

        <span
          class="online ${
            profile.status?.online
              ? ''
              : 'offline'
          }"
        >

          ${
            profile.status?.online
              ? 'ONLINE'
              : 'OFFLINE'
          }

        </span>

      </div>


      <div class="stats4">

        <div class="tile">

          <span class="emoji">
            ⚔️
          </span>

          <b>
            ${fmt(
              profile.level
            )}
          </b>

          <span>
            Level
          </span>

        </div>


        <div class="tile">

          <span class="emoji">
            🪙
          </span>

          <b>
            ${fmt(
              currencies.gold
            )}
          </b>

          <span>
            Gold
          </span>

        </div>


        <div class="tile">

          <span class="emoji">
            💎
          </span>

          <b>
            ${fmt(
              currencies.diamonds
            )}
          </b>

          <span>
            Diamanten
          </span>

        </div>


        <div class="tile">

          <span class="emoji">
            🏆
          </span>

          <b>
            ${fmt(
              ranking.honor
            )}
          </b>

          <span>
            Ruhm
          </span>

        </div>


        ${
          energy != null
            ? `
              <div class="tile">

                <span class="emoji">
                  ⚡
                </span>

                <b>
                  ${fmt(energy)}
                </b>

                <span>
                  Energie
                </span>

              </div>
            `
            : ''
        }


        ${
          servants != null
            ? `
              <div class="tile">

                <span class="emoji">
                  🧑‍🌾
                </span>

                <b>
                  ${fmt(servants)}
                </b>

                <span>
                  Leibeigene
                </span>

              </div>
            `
            : ''
        }


        ${
          arrows != null
            ? `
              <div class="tile">

                <span class="emoji">
                  🎯
                </span>

                <b>
                  ${fmt(arrows)}
                </b>

                <span>
                  Pfeilmacher
                </span>

              </div>
            `
            : ''
        }


        ${
          hp != null
            ? `
              <div class="tile">

                <span class="emoji">
                  ❤️
                </span>

                <b>
                  ${fmt(hp)}
                </b>

                <span>
                  Lebenspunkte
                </span>

              </div>
            `
            : ''
        }

      </div>

    </div>
  `;
}


/* BUFFS */

function mergedEffects(){

  const buffs =
    S.data.buffs
    ||
    {};


  const potions =
    S.data.potions
    ||
    {};


  const output =
    [];


  for(
    const item
    of (
      Array.isArray(
        buffs.buffs
      )
        ? buffs.buffs
        : []
    )
  ){

    output.push({
      ...item,
      bad:false
    });
  }


  for(
    const item
    of (
      Array.isArray(
        buffs.debuffs
      )
        ? buffs.debuffs
        : []
    )
  ){

    output.push({
      ...item,
      bad:true
    });
  }


  for(
    const item
    of (
      Array.isArray(
        potions.potions
      )
        ? potions.potions
        : []
    )
  ){

    const duplicate =
      output.some(
        effect =>
          String(
            effect.source_item?.name
            ||
            effect.name
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

      output.push({
        ...item,
        bad:false,
        type:'potion'
      });
    }
  }


  return output;
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
                  (
                    a,
                    b
                  ) =>
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


                    const info =
                      EFFECT[
                        item.type
                      ]
                      ||
                      [];


                    const name =
                      item.type ===
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
                          info[0]
                          ||
                          item.name
                          ||
                          item.type
                          ||
                          'Wirkung'
                        );


                    const description =
                      item.type ===
                      'potion'

                        ? 'Aktiver Trank'

                        : (
                          info[1]
                          ||
                          item.description
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

                              ? timeLeft(
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

                                  ? `${
                                      fmt(
                                        item.remaining_minutes
                                      )
                                    } Min`

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

  const seen =
    new Set();


  function walk(
    node,
    depth = 0
  ){

    if(
      node == null
      ||
      depth > 6
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
            item
            &&
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
          walk(
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
      ||
      seen.has(
        node
      )
    ){
      return [];
    }


    seen.add(
      node
    );


    for(
      const key
      of [
        'offers',
        'items',
        'shop_offers',
        'shopItems',
        'shop_items',
        'products',
        'current_offers',
        'currentOffers'
      ]
    ){

      if(
        node[
          key
        ]
        != null
      ){

        const found =
          walk(
            node[
              key
            ],
            depth + 1
          );


        if(
          found.length
        ){
          return found;
        }
      }
    }


    const values =
      Object.values(
        node
      );


    if(
      values.length
      &&
      values.every(
        value =>
          value
          &&
          typeof value ===
          'object'
      )
      &&
      values.some(
        value =>
          'price' in value
          ||
          'item_name' in value
          ||
          'item_id' in value
          ||
          'currency' in value
      )
    ){
      return values;
    }


    for(
      const value
      of values
    ){

      const found =
        walk(
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


  return walk(
    data,
    0
  );
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

                            : (
                              currency.includes(
                                'honor'
                              )

                                ? '🏆 Ruhm'

                                : currency
                            )
                        );


                    return `
                      <div class="shopOffer">

                        <div class="shopOfferName">
                          ${esc(name)}
                        </div>

                        <div class="shopOfferPrice">

                          ${esc(
                            fmt(price)
                          )}

                          ${esc(
                            currencyText
                          )}

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
              Der Shop-Endpunkt ist verbunden, meldet aber aktuell keine Angebote.
            </div>
          `
      }

    </div>
  `;
}


/* EVENTS */

function isActiveEvent(value){

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


  const output =
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
      &&
      value?.status
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
      value?.merchant
    ){

      meta =
        `Händler: ${
          value.merchant
        }`;
    }


    output.push({
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


    output.push({

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


  return output;
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
      (
        a,
        b
      ) =>
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

  return (
    days === 1
      ? 'Morgen'
      : (
        days === 2
          ? 'Übermorgen'
          : `In ${days} Tagen`
      )
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
                        ${esc(
                          event.meta
                        )}
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
                    ${esc(
                      event.desc
                    )}
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


/* XP */

function xpInfo(area){

  const profile =
    S.data.profile
    ||
    {};


  const roots =
    area ===
    'combat'

      ? [
        profile.combat,
        profile.combat_level,
        profile.progress?.combat,
        profile.level_progress,
        profile.progress
      ]

      : [
        profile.hunting,
        profile.hunt,
        profile.hunting_level,
        profile.progress?.hunting
      ];


  for(
    const root
    of roots
  ){

    if(
      !root
      ||
      typeof root !==
      'object'
    ){
      continue;
    }


    const current =
      deepMetric(
        root,
        [
          'xp.current',
          'xp_current',
          'current_xp',
          'progress.current',
          'current'
        ]
      );


    const needed =
      deepMetric(
        root,
        [
          'xp.needed',
          'xp_needed',
          'needed_xp',
          'xp_to_next',
          'next_xp',
          'progress.needed',
          'max_xp',
          'needed'
        ]
      );


    const percent =
      deepMetric(
        root,
        [
          'xp.percent',
          'xp_percent',
          'percent',
          'progress.percent'
        ]
      );


    if(
      current != null
      &&
      needed != null
      &&
      needed > 0
    ){

      return {

        current,

        needed,

        percent:
          percent != null

            ? percent

            : (
              current
              /
              needed
              *
              100
            )
      };
    }
  }


  return null;
}


function xpCard(
  title,
  icon,
  level,
  xp
){

  if(
    !xp
  ){

    return `
      <div class="xpCard">

        <div class="xpTop">

          <strong>
            ${icon} ${esc(title)}
          </strong>

          <b>
            Level ${fmt(level)}
          </b>

        </div>

        <div class="rowMeta">
          XP-Fortschritt wird angezeigt, sobald die API ihn liefert.
        </div>

      </div>
    `;
  }


  const percent =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          xp.percent
        )
        ||
        0
      )
    );


  return `
    <div class="xpCard">

      <div class="xpTop">

        <strong>
          ${icon} ${esc(title)}
        </strong>

        <b>

          Level ${fmt(level)}

          (${Math.round(percent)}%)

        </b>

      </div>

      ${progress(percent)}

      <div class="rowMeta">

        ${fmt(
          xp.current
        )}

        /

        ${fmt(
          xp.needed
        )}

        XP

      </div>

    </div>
  `;
}


/* AUSBAU */

function upgradeOverview(){

  const profile =
    S.data.profile
    ||
    {};


  const blacksmith =
    S.data.blacksmith
    ||
    {};


  const sword =
    deepMetric(
      blacksmith,
      [
        'sword.level'
      ]
    )
    ??
    deepMetric(
      profile,
      [
        'upgrades.sword'
      ]
    );


  const armor =
    deepMetric(
      blacksmith,
      [
        'armor.level'
      ]
    )
    ??
    deepMetric(
      profile,
      [
        'upgrades.armor'
      ]
    );


  const shelter =
    deepMetric(
      blacksmith,
      [
        'shelter.level'
      ]
    )
    ??
    deepMetric(
      profile,
      [
        'upgrades.shelter'
      ]
    );


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🔨 Ausbau
        </h2>
      </div>


      <div class="upgradeGrid">

        <div class="upgradeTile">

          <div class="upgradePic">
            ⚔️
          </div>

          <b>
            ${fmt(sword)}
          </b>

          <span>
            Schwert
          </span>

        </div>


        <div class="upgradeTile">

          <div class="upgradePic">
            🛡️
          </div>

          <b>
            ${fmt(armor)}
          </b>

          <span>
            Rüstung
          </span>

        </div>


        <div class="upgradeTile">

          <div class="upgradePic">
            🏠
          </div>

          <b>
            ${fmt(shelter)}
          </b>

          <span>
            Unterkunft
          </span>

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

          <span>
            Rang
          </span>

        </div>


        <div class="tile">

          <b>

            ${fmt(
              activity.rank
            )}

            /

            ${fmt(
              activity.max_rank
            )}

          </b>

          <span>
            Aktivität
          </span>

        </div>


        <div class="tile">

          <b>
            ${fmt(
              hunting.level
            )}
          </b>

          <span>
            Jagdlevel
          </span>

        </div>


        <div class="tile">

          <b>
            ${fmt(
              profile.progress?.tower
            )}
          </b>

          <span>
            Turm-Ebene
          </span>

        </div>


        <div class="tile">

          <b>
            ${fmt(
              stats.pvp?.winrate
            )}%
          </b>

          <span>
            PvP-Siegquote
          </span>

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

    ${upgradeOverview()}

    ${quickStatus()}

  `;
}


/* KAMPF */

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
        ??
        combat.defence
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
      item[1]
      != null
  );


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          ⚔️ Kampfwerte
        </h2>
      </div>


      ${
        xpCard(
          'Kampflevel',
          '🏅',
          profile.level,
          xpInfo(
            'combat'
          )
        )
      }


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
                  activity.better_than_percent
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

  const profile =
    S.data.profile
    ||
    {};


  const hunting =
    profile.hunting
    ||
    {};


  const breakthrough =
    deepMetric(
      hunting,
      [
        'breakthrough',
        'breakthrough_power',
        'attributes.breakthrough',
        'stats.breakthrough',
        'skills.breakthrough'
      ]
    )
    ??
    recursiveMetric(
      hunting,
      [
        'breakthrough',
        'breakthrough_power',
        'breakthroughPower'
      ]
    );


  const accuracy =
    deepMetric(
      hunting,
      [
        'aim',
        'accuracy',
        'attributes.aim',
        'attributes.accuracy',
        'stats.aim',
        'stats.accuracy'
      ]
    )
    ??
    recursiveMetric(
      hunting,
      [
        'aim',
        'accuracy'
      ]
    );


  const marks =
    deepMetric(
      hunting,
      [
        'marks',
        'tracking',
        'track_reading',
        'attributes.marks',
        'attributes.tracking',
        'stats.marks'
      ]
    )
    ??
    recursiveMetric(
      hunting,
      [
        'marks',
        'tracking',
        'track_reading'
      ]
    );


  const values = [

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
      breakthrough,
      '💣'
    ],

    [
      'Genauigkeit',
      accuracy,
      '🎯'
    ],

    [
      'Spuren lesen',
      marks,
      '🐾'
    ]

  ];


  return `
    <div class="panel">

      <div class="panelHead">
        <h2>
          🏹 Jagd
        </h2>
      </div>


      ${
        xpCard(
          'Jagdlevel',
          '🌲',
          metricNumber(
            hunting.level
          ),
          xpInfo(
            'hunting'
          )
        )
      }


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
              data[
                key
              ];


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
                    ? `Fertig in ${
                        timeLeft(
                          (
                            end
                            -
                            Date.now()
                          )
                          /
                          1000
                        )
                      }`
                    : 'Ausbau läuft'
                )

                : (
                  `Nächste Stufe: ${
                    fmt(
                      item.next_upgrade
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


/* SKILLS */

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
            ? ` · Kämpfe übrig ${
                fmt(
                  item.credits
                )
              }`
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


/* RITTERSEITE */

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

          stats.pvp
            ?.wins,

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

                order.order
                  .name,

                `Rang ${
                  fmt(
                    order.order
                      .rank
                  )
                } · ${
                  fmt(
                    order.order
                      .members
                  )
                } Mitglieder`,

                '🛡️'
              )
            }


            ${
              row(

                'Ordenspunkte',

                order.order
                  .points,

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
    Array.isArray(
      data.items
    )

      ? data.items

      : [];


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


    (
      groups[
        category
      ]
      ??=
      []
    )
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

        ${fmt(
          data.total_items
          ??
          items.length
        )}

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

                          .filter(
                            Boolean
                          )

                          .join(
                            ' · '
                          );


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

                                  : 'Keine zusätzliche Beschreibung verfügbar.'
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


/* WELT */

function forest(){

  const data =
    S.data.forest
    ||
    {};


  const captain =
    data.orc_king
    ||
    data.orc_captain
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
        Object.keys(
          captain
        ).length

          ? row(

              'Ork-Hauptmann',

              captain.alive
                ? 'Lebt'
                : 'Besiegt',

              captain.alive

                ? `${
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

                : '',

              '👑'
            )

          : ''
      }


      ${
        Object.keys(
          dragon
        ).length

          ? row(

              'Reichsdrache',

              de(
                dragon.phase
              ),

              dragon.attack_count != null
                ? `${
                    fmt(
                      dragon.attack_count
                    )
                  }. Angriff`
                : '',

              '🐉'
            )

          : ''
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
              key ===
              'green'

                ? 'Grüne'

                : (
                  key ===
                  'yellow'

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
          ${de(
            party.status
          )}
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
          ${fmt(
            data.total_kills
            ||
            0
          )}
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


function dragonCard(){

  const data =
    S.data.dragon
    ||
    {};


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
          de(
            data.status
          ),
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
        task.description
        ||
        'Aktuelle Aufgabe'
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
            ${fmt(
              data.tasks_completed
            )}
          </b>

          <span>
            Erledigt
          </span>

        </div>


        <div class="tile">

          <b>
            ${fmt(
              data.tasks_skipped
            )}
          </b>

          <span>
            Übersprungen
          </span>

        </div>


        <div class="tile">

          <b>
            ${fmt(
              data.pending_rewards
            )}
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


/* MEHR */

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
          ${fmt(
            data.pet_count
            ??
            pets.length
          )}
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


function updateCountdowns(){

  $$(
    '[data-expires]'
  )
  .forEach(
    element => {

      const end =
        Number(
          element.dataset
            .expires
        );


      if(
        Number.isFinite(
          end
        )
      ){

        element.textContent =
          timeLeft(
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


  if(
    force
  ){
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

      S.data[
        key
      ] =
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
    String(
      Date.now()
    )
  );
}


/* SEITEN */

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
            index ===
            S.page

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
          event.changedTouches[0]
            .clientX;


        startY =
          event.changedTouches[0]
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
          event.changedTouches[0]
            .clientX
          -
          startX;


        const dy =
          event.changedTouches[0]
            .clientY
          -
          startY;


        if(
          Math.abs(
            dx
          )
          >
          65

          &&

          Math.abs(
            dx
          )
          >
          Math.abs(
            dy
          )
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

    navigator.standalone
    ===
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


        await S.installPrompt
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
        button =>

          button.onclick =
            () =>
              gotoPage(
                Number(
                  button.dataset.tab
                )
              )
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
            event.target.id
            ===
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
          './service-worker.js?v=9'
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
