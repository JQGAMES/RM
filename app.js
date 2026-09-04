const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const S = {
  data: {},
  busy: false,
  page: 0,
  blockedUntil: 0,
  autoTimer: null,
  countTimer: null,
  installPrompt: null
};

const AUTO = 60000;
const WAIT = 220;
const MANUAL = 8000;
let lastManual = 0;

const ENDPOINTS = [
  ['profile', '/v1/me'],
  ['stats', '/v1/me/stats'],
  ['buffs', '/v1/me/buffs'],
  ['potions', '/v1/me/potions'],
  ['shop', '/v1/game/shop'],
  ['season', '/v1/game/season'],
  ['live', '/v1/game/live'],
  ['blacksmith', '/v1/me/blacksmith'],
  ['dragon', '/v1/me/dragon'],
  ['outpost', '/v1/me/outpost'],
  ['skills', '/v1/me/skills?desc=1'],
  ['tournaments', '/v1/me/tournaments'],
  ['backpack', '/v1/me/backpack?desc=1'],
  ['forest', '/v1/game/forest'],
  ['province', '/v1/game/province'],
  ['party', '/v1/me/party'],
  ['dungeons', '/v1/me/dungeons'],
  ['order', '/v1/me/order'],
  ['lifetime', '/v1/me/lifetime'],
  ['bestiary', '/v1/me/bestiary']
];

const TR = {
  active: 'aktiv',
  inactive: 'inaktiv',
  running: 'läuft',
  closed: 'geschlossen',
  open: 'offen',
  rewards: 'Belohnungen',
  registration: 'Registrierung',
  fighting: 'Kämpfe',
  ceremony: 'Siegerehrung',
  away: 'nicht anwesend',
  attack: 'Angriff',
  hurt: 'besiegt',
  egg: 'Ei',
  baby: 'Babydrache',
  kid: 'Jungdrache',
  adult: 'Erwachsener Drache',
  idle: 'wartet',
  normal: 'Normal',
  heroic: 'Heroisch',
  legendary: 'Legendär'
};

const ITEM_DE = {
  health_potion: 'Heiltrank',
  strength_potion: 'Stärketrank',
  silver_arrows: 'Silberpfeile',
  healing_herbs: 'Heilkräuter',
  throwing_axes: 'Wurfäxte',
  wolf_bait: 'Wolfsköder',
  apple: 'Apfel',
  blackberries: 'Brombeeren',
  raspberries: 'Himbeeren',
  honeycomb: 'Honigwabe',
  carrots: 'Möhren',
  orc_meat: 'Ork-Fleisch',
  wild_boar_meat: 'Wildschwein-Fleisch',
  forest_mushrooms: 'Waldpilze',
  small_meals: 'Kleine Mahlzeiten',
  shadow_dust: 'Schattenstaub',
  silver_bars: 'Silberbarren',
  thorium_shard: 'Thorium-Splitter',
  royal_medal: 'Königliche Medaille',
  province_coins: 'Provinzmünzen',
  free_tickets: 'Freilose',
  slime_bags: 'Schleimbeutel'
};

const CATEGORY_DE = {
  Potions: 'Tränke',
  Equipment: 'Ausrüstung',
  Food: 'Nahrung',
  Consumables: 'Verbrauchbar',
  Crafting: 'Handwerkswaren',
  Misc: 'Sonstiges'
};

function esc(v) {
  return String(v ?? '').replace(
    /[&<>"']/g,
    m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]
  );
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return '–';

  return typeof v === 'number'
    ? new Intl.NumberFormat('de-DE').format(v)
    : String(v);
}

function val(...values) {
  return values.find(v => v !== undefined && v !== null);
}

function de(v) {
  return TR[String(v ?? '').toLowerCase()] || String(v ?? '');
}

function token() {
  return (localStorage.getItem('rm_token') || '').trim();
}

function proxy() {
  return (localStorage.getItem('rm_proxy') || '')
    .trim()
    .replace(/\/+$/, '');
}

function auto() {
  return localStorage.getItem('rm_auto') !== '0';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
 * Die KnightManager-API liefert Antworten teilweise als:
 *
 * {
 *   success: true,
 *   data: {...}
 * }
 *
 * Deshalb werden diese Antworten hier zentral entpackt.
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

/*
 * Wandelt auch verschachtelte Werte wie
 *
 * { total: 22 }
 * { current: 40 }
 * { value: 11 }
 * { base: 30, bonus: 10 }
 *
 * zuverlässig in eine Zahl um.
 */
function metricNumber(x) {
  if (x === null || x === undefined) return null;

  if (typeof x === 'number' && Number.isFinite(x)) {
    return x;
  }

  if (
    typeof x === 'string' &&
    x.trim() !== '' &&
    Number.isFinite(Number(x))
  ) {
    return Number(x);
  }

  if (typeof x !== 'object') return null;

  for (const key of [
    'total',
    'current',
    'value',
    'amount',
    'score',
    'level'
  ]) {
    if (Number.isFinite(Number(x[key]))) {
      return Number(x[key]);
    }
  }

  if (
    Number.isFinite(Number(x.base)) &&
    Number.isFinite(Number(x.bonus))
  ) {
    return Number(x.base) + Number(x.bonus);
  }

  if (Number.isFinite(Number(x.base))) {
    return Number(x.base);
  }

  return null;
}

function deepMetric(obj, keys) {
  for (const key of keys) {
    const parts = key.split('.');
    let current = obj;

    for (const part of parts) {
      if (current == null) break;
      current = current[part];
    }

    const n = metricNumber(current);

    if (n != null) return n;
  }

  return null;
}

function itemName(item) {
  if (item?.name_de) return item.name_de;

  const ident = String(item?.ident || '').toLowerCase();

  if (ITEM_DE[ident]) return ITEM_DE[ident];

  return (
    item?.item_name_de ||
    item?.item_name ||
    item?.name ||
    item?.ident ||
    'Gegenstand'
  );
}

async function api(path) {
  if (Date.now() < S.blockedUntil) {
    throw Object.assign(
      new Error('API-Pause aktiv.'),
      { rate: true }
    );
  }

  if (!token() || !proxy()) {
    throw new Error('API-Zugang fehlt.');
  }

  const separator = path.includes('?') ? '&' : '?';
  const url =
    proxy() +
    path +
    separator +
    '_=' +
    Date.now();

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  const raw = await response.text();

  let body = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    if (response.status === 429) {
      const match = raw.match(/(\d+)\s*seconds?/i);
      const seconds = Number(match?.[1] || 60);

      S.blockedUntil =
        Date.now() + seconds * 1000;

      throw Object.assign(
        new Error(
          `API-Limit erreicht. Noch ungefähr ${seconds} Sekunden warten.`
        ),
        { rate: true }
      );
    }

    throw new Error(
      `${path}: HTTP ${response.status}`
    );
  }

  return unwrap(body);
}

function progress(percent) {
  const p = Math.max(
    0,
    Math.min(100, Number(percent) || 0)
  );

  return `
    <div class="progress">
      <i style="width:${p}%"></i>
    </div>
  `;
}

function row(label, value, meta = '', icon = '') {
  return `
    <div class="dataRow">
      <div class="dataLabel">
        ${icon ? `<span class="rowIcon">${icon}</span>` : ''}
        <div>
          <strong>${esc(label)}</strong>
          ${meta ? `<small>${esc(meta)}</small>` : ''}
        </div>
      </div>

      <b>${esc(fmt(value))}</b>
    </div>
  `;
}

/* -------------------------------------------------
   SHOP
------------------------------------------------- */

function extractShopOffers(data) {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  const candidates = [
    data.offers,
    data.items,
    data.shop?.offers,
    data.shop?.items,
    data.current_offers,
    data.current?.offers,
    data.current?.items
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function shopCurrency(offer) {
  const currency =
    offer.currency ||
    offer.price_currency ||
    offer.cost_currency ||
    '';

  switch (String(currency).toLowerCase()) {
    case 'gold':
      return '🪙 Gold';

    case 'diamond':
    case 'diamonds':
      return '💎 Diamanten';

    case 'honor':
      return '🏆 Ruhm';

    default:
      return currency;
  }
}

function renderShop() {
  const offers =
    extractShopOffers(S.data.shop);

  if (!offers.length) {
    return `
      <div class="panel shopPanel">
        <div class="panelHead">
          <div>
            <div class="eyebrow">AKTUELL</div>
            <h2>🛒 Shop</h2>
          </div>

          <span class="badge">0</span>
        </div>

        <div class="empty">
          Die Shop-API meldet derzeit keine Angebote.
        </div>
      </div>
    `;
  }

  return `
    <div class="panel shopPanel">
      <div class="panelHead">
        <div>
          <div class="eyebrow">AKTUELL</div>
          <h2>🛒 Shop</h2>
        </div>

        <span class="badge">
          ${offers.length}
        </span>
      </div>

      <div class="shopGrid">
        ${offers.map(offer => {
          const name =
            offer.item_name_de ||
            offer.name_de ||
            itemName(offer);

          const amount =
            val(
              offer.amount,
              offer.quantity,
              offer.count
            );

          const price =
            val(
              offer.price,
              offer.cost,
              offer.price_amount
            );

          const currency =
            shopCurrency(offer);

          return `
            <div class="shopItem">
              <div class="shopItemName">
                🎁
                ${amount && amount !== 1
                  ? `${fmt(amount)} × `
                  : ''}
                ${esc(name)}
              </div>

              <div class="shopPrice">
                ${esc(fmt(price))}
                ${currency
                  ? ` ${esc(currency)}`
                  : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

async function refreshShopOnly() {
  try {
    S.data.shop =
      await api('/v1/game/shop');

    return true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------
   BUFFS
------------------------------------------------- */

function expiry(obj) {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  const raw =
    obj.expires_at ??
    obj.finishes_at;

  if (raw != null) {
    const n = Number(raw);

    if (Number.isFinite(n)) {
      return n > 2e12 ? n : n * 1000;
    }

    const parsed = Date.parse(raw);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const date =
    Date.parse(obj.expires_datetime || '');

  if (Number.isFinite(date)) {
    return date;
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

function timeLeft(seconds) {
  let sec =
    Math.max(
      0,
      Math.ceil(Number(seconds) || 0)
    );

  const hours =
    Math.floor(sec / 3600);

  const minutes =
    Math.floor((sec % 3600) / 60);

  const rest =
    sec % 60;

  if (hours) {
    return (
      `${hours}:` +
      `${String(minutes).padStart(2, '0')}:` +
      `${String(rest).padStart(2, '0')}`
    );
  }

  return (
    `${minutes}:` +
    `${String(rest).padStart(2, '0')}`
  );
}

function renderBuffs() {
  const data = S.data.buffs || {};

  const buffs =
    Array.isArray(data.buffs)
      ? data.buffs
      : [];

  const debuffs =
    Array.isArray(data.debuffs)
      ? data.debuffs
      : [];

  const all = [
    ...buffs.map(x => ({
      ...x,
      negative: false
    })),
    ...debuffs.map(x => ({
      ...x,
      negative: true
    }))
  ];

  return `
    <div class="panel buffPanel">
      <div class="panelHead">
        <div>
          <div class="eyebrow">
            AKTUELLER BUFF
          </div>

          <h2>⏱️ Aktive Wirkungen</h2>
        </div>

        <span class="badge">
          ${all.length}
        </span>
      </div>

      ${
        all.length
          ? all.map(effect => {
              const end =
                expiry(effect);

              return `
                <div class="effectCard
                  ${effect.negative
                    ? 'negative'
                    : ''}">
                  
                  <div>
                    <strong>
                      ${esc(
                        effect.name_de ||
                        effect.name ||
                        effect.type ||
                        'Wirkung'
                      )}
                    </strong>

                    ${
                      effect.description
                        ? `<small>
                            ${esc(effect.description)}
                           </small>`
                        : ''
                    }
                  </div>

                  ${
                    end
                      ? `<b
                          class="countdown"
                          data-expires="${end}">
                          ${timeLeft(
                            (end - Date.now()) /
                            1000
                          )}
                         </b>`
                      : ''
                  }
                </div>
              `;
            }).join('')
          : `
            <div class="empty">
              Keine aktiven Buffs oder Debuffs.
            </div>
          `
      }
    </div>
  `;
}

/* -------------------------------------------------
   LEVEL / XP
------------------------------------------------- */

function xpInfo(profile, area) {
  const roots =
    area === 'combat'
      ? [
          profile.combat,
          profile.combat_level,
          profile.progress?.combat,
          profile.level_progress
        ]
      : [
          profile.hunting,
          profile.hunt,
          profile.hunting_level,
          profile.progress?.hunting
        ];

  for (const root of roots) {
    if (!root || typeof root !== 'object') {
      continue;
    }

    const current =
      deepMetric(root, [
        'xp.current',
        'xp_current',
        'current_xp',
        'progress.current'
      ]);

    const needed =
      deepMetric(root, [
        'xp.needed',
        'xp_needed',
        'needed_xp',
        'xp_to_next',
        'next_xp',
        'progress.needed',
        'max_xp'
      ]);

    const percent =
      deepMetric(root, [
        'xp.percent',
        'xp_percent',
        'percent',
        'progress.percent'
      ]);

    if (
      current != null &&
      needed != null &&
      needed > 0
    ) {
      return {
        current,
        needed,
        percent:
          percent != null
            ? percent
            : current / needed * 100
      };
    }
  }

  return null;
}

function levelProgressCard(
  title,
  icon,
  level,
  xp
) {
  if (!xp) {
    return `
      <div class="levelProgressCard">
        <div class="levelProgressTop">
          <strong>
            ${icon} ${esc(title)}
          </strong>

          <b>
            Level ${fmt(level)}
          </b>
        </div>
      </div>
    `;
  }

  const percent =
    Math.max(
      0,
      Math.min(100, xp.percent || 0)
    );

  return `
    <div class="levelProgressCard">
      <div class="levelProgressTop">
        <strong>
          ${icon} ${esc(title)}
        </strong>

        <b>
          Level ${fmt(level)}
          (${Math.round(percent)}%)
        </b>
      </div>

      ${progress(percent)}

      <small>
        ${fmt(xp.current)}
        /
        ${fmt(xp.needed)}
        XP
      </small>
    </div>
  `;
}

/* -------------------------------------------------
   SCHNELLÜBERSICHT
------------------------------------------------- */

function upgradeTiles() {
  const p = S.data.profile || {};
  const smith = S.data.blacksmith || {};

  const sword =
    deepMetric(smith, [
      'sword.level',
      'sword.current_level'
    ]) ??
    deepMetric(p, [
      'upgrades.sword'
    ]);

  const armor =
    deepMetric(smith, [
      'armor.level',
      'armor.current_level'
    ]) ??
    deepMetric(p, [
      'upgrades.armor'
    ]);

  const shelter =
    deepMetric(smith, [
      'shelter.level',
      'shelter.current_level',
      'housing.level'
    ]) ??
    deepMetric(p, [
      'upgrades.shelter'
    ]);

  return `
    <div class="quickUpgrades">
      <div class="upgradeTile">
        <span class="upgradeIcon">⚔️</span>
        <b>${fmt(sword)}</b>
        <small>Schwert</small>
      </div>

      <div class="upgradeTile">
        <span class="upgradeIcon">🛡️</span>
        <b>${fmt(armor)}</b>
        <small>Rüstung</small>
      </div>

      <div class="upgradeTile">
        <span class="upgradeIcon">🏠</span>
        <b>${fmt(shelter)}</b>
        <small>Unterkunft</small>
      </div>
    </div>
  `;
}

/* -------------------------------------------------
   ÜBERSICHT
------------------------------------------------- */

function overview() {
  const p =
    S.data.profile || {};

  const currencies =
    p.currencies || {};

  const combat =
    p.combat || {};

  const hunting =
    p.hunting || {};

  const energy =
    metricNumber(
      val(
        p.energy,
        p.status?.energy
      )
    );

  const servants =
    metricNumber(
      val(
        p.servants,
        p.currencies?.servants
      )
    );

  return `
    <div class="pageHeader">
      <h2>Übersicht</h2>
      <small>
        Wischen für weitere Bereiche →
      </small>
    </div>

    <div class="heroCard">
      <div class="heroTop">
        <div>
          <h2>
            ${esc(
              p.name ||
              'Ritter'
            )}
          </h2>

          <strong class="goldText">
            ${esc(
              p.rank?.title ||
              ''
            )}

            ${
              p.title
                ? ` · ${esc(p.title)}`
                : ''
            }

            ${
              p.ranking?.division
                ? ` · Division ${fmt(
                    p.ranking.division
                  )}`
                : ''
            }
          </strong>

          <div class="muted">
            📍
            ${
              p.status?.location_de ||
              p.status?.location ||
              'Unterwegs'
            }
          </div>
        </div>

        <span class="statusPill">
          ${
            p.status?.online
              ? 'ONLINE'
              : 'OFFLINE'
          }
        </span>
      </div>

      <div class="heroStats">
        <div class="statTile">
          <span>⚔️</span>
          <b>${fmt(p.level)}</b>
          <small>LEVEL</small>
        </div>

        <div class="statTile">
          <span>🪙</span>
          <b>${fmt(currencies.gold)}</b>
          <small>GOLD</small>
        </div>

        <div class="statTile">
          <span>💎</span>
          <b>${fmt(currencies.diamonds)}</b>
          <small>DIAMANTEN</small>
        </div>

        <div class="statTile">
          <span>🏆</span>
          <b>${fmt(currencies.honor)}</b>
          <small>RUHM</small>
        </div>

        <div class="statTile">
          <span>⚡</span>
          <b>${fmt(energy)}</b>
          <small>ENERGIE</small>
        </div>

        <div class="statTile">
          <span>👨‍🌾</span>
          <b>${fmt(servants)}</b>
          <small>LEIBEIGENE</small>
        </div>

        <div class="statTile">
          <span>🎯</span>
          <b>
            ${fmt(
              val(
                p.arrow_makers,
                p.arrowmakers,
                p.currencies?.arrow_makers
              )
            )}
          </b>
          <small>PFEILMACHER</small>
        </div>

        <div class="statTile">
          <span>❤️</span>
          <b>
            ${fmt(
              deepMetric(p, [
                'combat.hp.total',
                'combat.health.total',
                'combat.hp'
              ])
            )}
          </b>
          <small>LEBENSPUNKTE</small>
        </div>
      </div>
    </div>

    ${upgradeTiles()}

    ${renderBuffs()}

    ${renderShop()}

    ${renderEvents()}
  `;
}

/* -------------------------------------------------
   JAGD
------------------------------------------------- */

function huntingValues() {
  const p =
    S.data.profile || {};

  const h =
    p.hunting || {};

  const level =
    deepMetric(h, [
      'level',
      'hunt_level'
    ]);

  const points =
    deepMetric(h, [
      'points',
      'hunting_points',
      'hunt_points'
    ]);

  const kills =
    deepMetric(h, [
      'kills',
      'orcs_killed',
      'total_kills'
    ]);

  /*
   * WICHTIG:
   * Durchschlagskraft, Genauigkeit und Spurenlesen
   * können von der API als Objekt zurückkommen.
   */
  const breakthrough =
    deepMetric(h, [
      'breakthrough',
      'breakthrough_power',
      'attributes.breakthrough',
      'stats.breakthrough',
      'skills.breakthrough'
    ]);

  const accuracy =
    deepMetric(h, [
      'accuracy',
      'aim',
      'attributes.accuracy',
      'attributes.aim',
      'stats.accuracy',
      'stats.aim'
    ]);

  const tracks =
    deepMetric(h, [
      'marks',
      'tracking',
      'tracks',
      'track_reading',
      'attributes.marks',
      'attributes.tracking',
      'stats.marks'
    ]);

  const xp =
    xpInfo(p, 'hunting');

  return `
    <div class="panel">
      <div class="panelHead">
        <h2>🏹 Jagd</h2>
      </div>

      ${
        levelProgressCard(
          'Jagdlevel',
          '🌲',
          level,
          xp
        )
      }

      ${row(
        'Jagdpunkte',
        points,
        '',
        '🦌'
      )}

      ${row(
        'Abschüsse',
        kills,
        '',
        '💀'
      )}

      ${row(
        'Durchschlagskraft',
        breakthrough,
        '',
        '💣'
      )}

      ${row(
        'Genauigkeit',
        accuracy,
        '',
        '🎯'
      )}

      ${row(
        'Spuren lesen',
        tracks,
        '',
        '🐾'
      )}
    </div>
  `;
}

/* -------------------------------------------------
   KAMPFWERTE
------------------------------------------------- */

function combatValues() {
  const p =
    S.data.profile || {};

  const c =
    p.combat || {};

  const hp =
    deepMetric(c, [
      'hp.total',
      'health.total',
      'hp'
    ]);

  const strength =
    deepMetric(c, [
      'strength.total',
      'strength'
    ]);

  const defense =
    deepMetric(c, [
      'defense.total',
      'defence.total',
      'defense',
      'defence'
    ]);

  const speed =
    deepMetric(c, [
      'speed.total',
      'speed'
    ]);

  const luck =
    deepMetric(c, [
      'luck.total',
      'luck'
    ]);

  const rank =
    val(
      p.ranking?.activity?.rank,
      p.ranking?.activity_rank
    );

  const total =
    val(
      p.ranking?.activity?.total,
      p.ranking?.activity_total
    );

  const better =
    val(
      p.ranking?.activity?.better_than_percent,
      p.ranking?.better_than_percent
    );

  const xp =
    xpInfo(p, 'combat');

  return `
    <div class="panel">
      <div class="panelHead">
        <h2>⚔️ Kampfwerte</h2>
      </div>

      ${levelProgressCard(
        'Kampflevel',
        '🏅',
        p.level,
        xp
      )}

      ${row(
        'Lebenspunkte',
        hp,
        '',
        '❤️'
      )}

      ${row(
        'Stärke',
        strength,
        '',
        '💣'
      )}

      ${row(
        'Verteidigung',
        defense,
        '',
        '🛡️'
      )}

      ${row(
        'Geschwindigkeit',
        speed,
        '',
        '🥕'
      )}

      ${row(
        'Glück',
        luck,
        '',
        '🧲'
      )}

      ${row(
        'Aktivitätsrang',
        rank != null
          ? `${fmt(rank)} / ${fmt(total)}`
          : '–',
        better != null
          ? `${fmt(better)} % besser als Vergleichsgruppe`
          : '',
        '📈'
      )}
    </div>
  `;
}

/* -------------------------------------------------
   SCHMIED
------------------------------------------------- */

function blacksmithCard() {
  const d =
    S.data.blacksmith || {};

  function smithItem(
    name,
    icon,
    obj
  ) {
    if (!obj) return '';

    const level =
      metricNumber(
        val(
          obj.level,
          obj.current_level
        )
      );

    const end =
      expiry(obj);

    return `
      <div class="smithTile">
        <span>${icon}</span>
        <b>${fmt(level)}</b>
        <small>${esc(name)}</small>

        ${
          obj.in_progress && end
            ? `
              <em
                data-expires="${end}">
                ${timeLeft(
                  (end - Date.now()) /
                  1000
                )}
              </em>
            `
            : ''
        }
      </div>
    `;
  }

  return `
    <div class="panel">
      <div class="panelHead">
        <h2>🔨 Schmied</h2>
      </div>

      <div class="smithGrid">
        ${smithItem(
          'Schwert',
          '⚔️',
          d.sword
        )}

        ${smithItem(
          'Rüstung',
          '🛡️',
          d.armor
        )}

        ${smithItem(
          'Unterkunft',
          '🏠',
          d.shelter
        )}
      </div>
    </div>
  `;
}

function knight() {
  const p =
    S.data.profile || {};

  return `
    <div class="pageHeader">
      <h2>Mein Ritter</h2>
      <small>
        ${esc(p.name || '')}
      </small>
    </div>

    ${combatValues()}
    ${huntingValues()}
    ${blacksmithCard()}
  `;
}

/* -------------------------------------------------
   RUCKSACK
------------------------------------------------- */

function backpack() {
  const d =
    S.data.backpack || {};

  const items =
    Array.isArray(d.items)
      ? d.items
      : [];

  const groups = {};

  for (const item of items) {
    const category =
      CATEGORY_DE[item.category] ||
      item.category ||
      'Sonstiges';

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(item);
  }

  return `
    <div class="pageHeader">
      <h2>Rucksack</h2>
      <small>
        ${fmt(
          d.total_items ??
          items.length
        )}
        Gegenstände
      </small>
    </div>

    ${
      Object.keys(groups).length
        ? Object.entries(groups)
            .map(([category, list]) => `
              <div class="panel category">
                <h3>
                  ${esc(category)}
                  <span class="tiny muted">
                    ${list.length}
                  </span>
                </h3>

                <div class="itemGrid">
                  ${list.map(item => {
                    const description =
                      item.description_de ||
                      item.description ||
                      '';

                    return `
                      <details class="item">
                        <summary>
                          ${fmt(item.amount)}
                          ×
                          ${esc(itemName(item))}
                        </summary>

                        <div class="itemDescription">
                          ${
                            description
                              ? esc(description)
                              : 'Keine zusätzliche Beschreibung verfügbar.'
                          }
                        </div>
                      </details>
                    `;
                  }).join('')}
                </div>
              </div>
            `).join('')
        : `
          <div class="panel empty">
            Rucksackdaten sind derzeit
            nicht verfügbar.
          </div>
        `
    }
  `;
}

/* -------------------------------------------------
   EVENTS
------------------------------------------------- */

function collectEvents() {
  const live =
    S.data.live || {};

  const result = [];

  const sources = [
    live.events,
    live.current_events,
    live.active_events,
    live.weekly_events
  ];

  for (const source of sources) {
    if (!source) continue;

    if (Array.isArray(source)) {
      for (const event of source) {
        if (
          event &&
          event.active !== false &&
          String(
            event.status || ''
          ).toLowerCase() !== 'closed'
        ) {
          result.push(event);
        }
      }
    } else if (
      typeof source === 'object'
    ) {
      for (const [key, event] of
        Object.entries(source)) {

        if (!event) continue;

        if (
          typeof event === 'object' &&
          event.active !== false &&
          String(
            event.status || ''
          ).toLowerCase() !== 'closed'
        ) {
          result.push({
            ident: key,
            ...event
          });
        }
      }
    }
  }

  return result;
}

function renderEvents() {
  const events =
    collectEvents();

  return `
    <div class="panel eventPanel">
      <div class="panelHead">
        <div>
          <div class="eyebrow">
            EVENTS
          </div>

          <h2>
            📅 Aktuelle Events
          </h2>
        </div>

        <span class="badge">
          ${events.length}
        </span>
      </div>

      ${
        events.length
          ? events.map(event => `
              <div class="eventCard">
                <strong>
                  ${esc(
                    event.name_de ||
                    event.title_de ||
                    event.name ||
                    event.title ||
                    event.ident ||
                    'Event'
                  )}
                </strong>

                ${
                  event.description_de ||
                  event.description
                    ? `
                      <small>
                        ${esc(
                          event.description_de ||
                          event.description
                        )}
                      </small>
                    `
                    : ''
                }
              </div>
            `).join('')
          : `
            <div class="empty">
              Momentan läuft kein
              gemeldetes Event.
            </div>
          `
      }
    </div>
  `;
}

/* -------------------------------------------------
   WELT
------------------------------------------------- */

function forestCard() {
  const d =
    S.data.forest || {};

  const captain =
    d.orc_king ||
    d.orc_captain ||
    {};

  const dragon =
    d.dragon || {};

  return `
    <div class="panel">
      <div class="panelHead">
        <h2>🌲 Düsterwald</h2>
      </div>

      ${
        Object.keys(captain).length
          ? row(
              'Ork-Hauptmann',
              captain.alive
                ? 'Lebt'
                : 'Besiegt',
              captain.hp_percent != null
                ? `${fmt(
                    captain.hp_percent
                  )} % Leben`
                : '',
              '👑'
            )
          : ''
      }

      ${
        Object.keys(dragon).length
          ? row(
              'Reichsdrache',
              de(dragon.phase),
              dragon.attack_count != null
                ? `${fmt(
                    dragon.attack_count
                  )}. Angriff`
                : '',
              '🐉'
            )
          : ''
      }
    </div>
  `;
}

function world() {
  return `
    <div class="pageHeader">
      <h2>Welt</h2>
      <small>Live-Daten</small>
    </div>

    ${forestCard()}
    ${renderEvents()}
  `;
}

/* -------------------------------------------------
   MEHR
------------------------------------------------- */

function lifetimeCard() {
  const d =
    S.data.lifetime || {};

  const c =
    d.combat || {};

  const h =
    d.hunting || {};

  const e =
    d.economy || {};

  const p =
    d.progression || {};

  return `
    <div class="panel">
      <div class="panelHead">
        <h2>📚 Langzeitstatistik</h2>
      </div>

      ${row(
        'Kämpfe gewonnen',
        c.battles_won,
        `Verloren ${fmt(
          c.battles_lost
        )} · Ruhm verdient ${fmt(
          c.honor_earned
        )}`,
        '⚔️'
      )}

      ${row(
        'Orks besiegt',
        h.orcs_killed,
        `Wölfe ${fmt(
          h.wolves_killed
        )} · Pfeile ${fmt(
          h.arrows_shot
        )}`,
        '🏹'
      )}

      ${row(
        'Gold verdient',
        e.gold_earned,
        `Leibeigene verdient ${fmt(
          e.servants_earned
        )}`,
        '🪙'
      )}

      ${row(
        'Abenteuer abgeschlossen',
        p.adventures_completed,
        `Saisons ${fmt(
          p.seasons_played
        )} · gewonnen ${fmt(
          p.seasons_won
        )}`,
        '📜'
      )}
    </div>
  `;
}

function petCard() {
  const d =
    S.data.bestiary || {};

  const pets =
    Array.isArray(d.pets)
      ? d.pets
      : [];

  return `
    <div class="panel">
      <div class="panelHead">
        <h2>🐾 Haustier</h2>

        <span class="badge">
          ${fmt(
            d.pet_count ??
            pets.length
          )}
        </span>
      </div>

      ${
        pets.length
          ? pets.map(pet =>
              row(
                pet.name ||
                pet.type?.name_de ||
                'Haustier',
                `Bindung ${fmt(
                  pet.bond_level
                )}`,
                pet.type?.name_de || '',
                '🐾'
              )
            ).join('')
          : `
            <div class="empty">
              Kein Haustier vorhanden.
            </div>
          `
      }
    </div>
  `;
}

function more() {
  return `
    <div class="pageHeader">
      <h2>Mehr</h2>
      <small>
        Statistik & Sammlung
      </small>
    </div>

    ${lifetimeCard()}
    ${petCard()}
  `;
}

/* -------------------------------------------------
   RENDERING
------------------------------------------------- */

function render() {
  $('#overviewPage').innerHTML =
    overview();

  $('#knightPage').innerHTML =
    knight();

  $('#backpackPage').innerHTML =
    backpack();

  $('#worldPage').innerHTML =
    world();

  $('#morePage').innerHTML =
    more();

  const season =
    S.data.season || {};

  $('#season').textContent =
    season.season != null
      ? `Saison ${season.season} · Tag ${season.day}${
          season.paused
            ? ' · pausiert'
            : ''
        }`
      : 'Persönliche Übersicht';

  updateCountdowns();
}

function updateCountdowns() {
  $$('[data-expires]').forEach(el => {
    const end =
      Number(el.dataset.expires);

    if (Number.isFinite(end)) {
      el.textContent =
        timeLeft(
          (end - Date.now()) /
          1000
        );
    }
  });
}

/* -------------------------------------------------
   DATEN LADEN
------------------------------------------------- */

async function loadAll(force = false) {
  if (S.busy) return;

  if (
    force &&
    Date.now() - lastManual < MANUAL
  ) {
    return;
  }

  if (force) {
    lastManual = Date.now();
  }

  S.busy = true;

  $('#refreshBtn').textContent =
    '…';

  const errors = [];

  for (const [key, path] of ENDPOINTS) {
    try {
      S.data[key] =
        await api(path);
    } catch (error) {
      errors.push(
        `${path}: ${error.message}`
      );

      if (error.rate) {
        break;
      }
    }

    await sleep(WAIT);
  }

  /*
   * SHOP IST BESONDERS WICHTIG:
   * Wenn beim ersten Abruf keine Angebote
   * angekommen sind, wird der Shop nach
   * kurzer Pause ein zweites Mal frisch
   * abgerufen.
   */
  if (
    !extractShopOffers(
      S.data.shop
    ).length
  ) {
    await sleep(700);
    await refreshShopOnly();
  }

  S.busy = false;

  $('#refreshBtn').textContent =
    '↻';

  render();

  if (errors.length) {
    $('#errorBox').textContent =
      errors.join('\n');

    $('#errorBox')
      .classList
      .remove('hidden');
  } else {
    $('#errorBox')
      .classList
      .add('hidden');
  }

  localStorage.setItem(
    'rm_last_sync',
    Date.now()
  );
}

/* -------------------------------------------------
   SEITEN / WISCHEN
------------------------------------------------- */

function gotoPage(page) {
  S.page =
    Math.max(
      0,
      Math.min(4, page)
    );

  $$('.page').forEach(
    (el, index) =>
      el.classList.toggle(
        'active',
        index === S.page
      )
  );

  $$('.tab').forEach(
    (el, index) =>
      el.classList.toggle(
        'active',
        index === S.page
      )
  );

  $('#pageDots').innerHTML =
    Array.from(
      { length: 5 },
      (_, index) =>
        `<i class="${
          index === S.page
            ? 'active'
            : ''
        }"></i>`
    ).join('');

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function setupSwipe() {
  let startX = 0;
  let startY = 0;

  $('#pager').addEventListener(
    'touchstart',
    event => {
      startX =
        event.changedTouches[0].clientX;

      startY =
        event.changedTouches[0].clientY;
    },
    { passive: true }
  );

  $('#pager').addEventListener(
    'touchend',
    event => {
      const dx =
        event.changedTouches[0].clientX -
        startX;

      const dy =
        event.changedTouches[0].clientY -
        startY;

      if (
        Math.abs(dx) > 65 &&
        Math.abs(dx) >
          Math.abs(dy) * 1.35
      ) {
        gotoPage(
          S.page +
          (dx < 0 ? 1 : -1)
        );
      }
    },
    { passive: true }
  );
}

/* -------------------------------------------------
   EINSTELLUNGEN
------------------------------------------------- */

function openSettings() {
  $('#proxyInput').value =
    proxy();

  $('#tokenInput').value =
    token();

  $('#autoInput').checked =
    auto();

  $('#drawer')
    .classList
    .add('open');
}

function closeSettings() {
  $('#drawer')
    .classList
    .remove('open');
}

function setupAuto() {
  clearInterval(S.autoTimer);

  if (
    auto() &&
    token() &&
    proxy()
  ) {
    S.autoTimer =
      setInterval(() => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          loadAll(false);
        }
      }, AUTO);
  }
}

function save() {
  const proxyValue =
    $('#proxyInput')
      .value
      .trim()
      .replace(/\/+$/, '');

  const tokenValue =
    $('#tokenInput')
      .value
      .trim();

  if (proxyValue) {
    localStorage.setItem(
      'rm_proxy',
      proxyValue
    );
  } else {
    localStorage.removeItem(
      'rm_proxy'
    );
  }

  if (tokenValue) {
    localStorage.setItem(
      'rm_token',
      tokenValue
    );
  } else {
    localStorage.removeItem(
      'rm_token'
    );
  }

  localStorage.setItem(
    'rm_auto',
    $('#autoInput').checked
      ? '1'
      : '0'
  );

  closeSettings();
  setupAuto();
  loadAll(true);
}

/* -------------------------------------------------
   PWA INSTALLATION
------------------------------------------------- */

function setupInstall() {
  if (
    matchMedia(
      '(display-mode: standalone)'
    ).matches ||
    navigator.standalone === true
  ) {
    document.body
      .classList
      .add('standalone');
  }

  addEventListener(
    'beforeinstallprompt',
    event => {
      event.preventDefault();

      S.installPrompt =
        event;

      $('#installBtn')
        .classList
        .remove('hidden');
    }
  );

  $('#installBtn').onclick =
    async () => {
      if (!S.installPrompt) {
        return;
      }

      S.installPrompt.prompt();

      await S.installPrompt.userChoice;

      S.installPrompt = null;

      $('#installBtn')
        .classList
        .add('hidden');
    };
}

/* -------------------------------------------------
   START
------------------------------------------------- */

addEventListener('load', () => {
  $$('.tab').forEach(button => {
    button.onclick =
      () =>
        gotoPage(
          Number(
            button.dataset.tab
          )
        );
  });

  gotoPage(0);

  setupSwipe();
  setupInstall();

  $('#settingsBtn').onclick =
    openSettings;

  $('#closeBtn').onclick =
    closeSettings;

  $('#saveBtn').onclick =
    save;

  $('#forgetBtn').onclick =
    () => {
      localStorage.removeItem(
        'rm_token'
      );

      $('#tokenInput').value =
        '';
    };

  $('#refreshBtn').onclick =
    () => loadAll(true);

  $('#drawer').onclick =
    event => {
      if (
        event.target.id ===
        'drawer'
      ) {
        closeSettings();
      }
    };

  S.countTimer =
    setInterval(
      updateCountdowns,
      1000
    );

  setupAuto();

  if (
    'serviceWorker' in navigator
  ) {
    navigator.serviceWorker
      .register(
        './service-worker.js?v=8'
      )
      .catch(() => {});
  }

  if (
    token() &&
    proxy()
  ) {
    loadAll(false);
  } else {
    openSettings();
  }
});
