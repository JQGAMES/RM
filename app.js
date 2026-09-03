const DIRECT_API = 'https://api.knight-manager.com';
const $ = (s)=>document.querySelector(s);

const state = {
  timer:null,
  countdownTimer:null,
  data:{},
  busy:false,
  lastSync:0
};

const API_SYNC_MS = 60000;
const BETWEEN_REQUESTS_MS = 450;

function esc(v){
  return String(v ?? '').replace(/[&<>"']/g,m=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[m]));
}

function fmt(n){
  if(n===null||n===undefined||n==='') return '–';
  if(typeof n==='number') return new Intl.NumberFormat('de-DE').format(n);
  return esc(n);
}

function minText(m){
  if(m===null||m===undefined) return '–';

  if(m < 60){
    return `${Math.max(0,Math.floor(m))} Min`;
  }

  const h=Math.floor(m/60);
  const r=Math.floor(m%60);

  return `${h} Std ${r} Min`;
}

function setText(id,val){
  const el=$(id);

  if(el){
    el.textContent=val ?? '–';
  }
}

function token(){
  return localStorage.getItem('rm_token') || '';
}

function proxyUrl(){
  return (localStorage.getItem('rm_proxy') || '')
    .replace(/\/+$/,'');
}

function autoRefresh(){
  return localStorage.getItem('rm_auto') !== '0';
}

function sleep(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}

function secondsText(totalSeconds){

  if(
    totalSeconds===null ||
    totalSeconds===undefined ||
    Number.isNaN(totalSeconds)
  ){
    return '–';
  }

  const s=Math.max(
    0,
    Math.floor(totalSeconds)
  );

  const h=Math.floor(s/3600);
  const m=Math.floor((s%3600)/60);
  const sec=s%60;

  if(h>0){

    return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;

  }

  return `${m}:${String(sec).padStart(2,'0')}`;
}

function expiryFromObject(obj){

  if(
    !obj ||
    typeof obj!=='object'
  ){
    return null;
  }

  const absolute=
    obj.expires_at ??
    obj.expiresAt ??
    obj.ends_at ??
    obj.endsAt ??
    obj.expire_at ??
    obj.expiry_at;

  if(absolute){

    const ts=Date.parse(absolute);

    if(Number.isFinite(ts)){
      return ts;
    }

  }

  const sec=
    obj.remaining_seconds ??
    obj.seconds_remaining ??
    obj.remainingSeconds;

  if(
    sec!==undefined &&
    sec!==null &&
    Number.isFinite(Number(sec))
  ){

    return Date.now() +
      Math.max(0,Number(sec))*1000;

  }

  const min=
    obj.remaining_minutes ??
    obj.minutes_remaining ??
    obj.remainingMinutes;

  if(
    min!==undefined &&
    min!==null &&
    Number.isFinite(Number(min))
  ){

    return Date.now() +
      Math.max(0,Number(min))*60000;

  }

  return null;
}

function stampCountdowns(){

  const d=state.data.buffs||{};

  const groups=[
    d.buffs||[],
    d.debuffs||[]
  ];

  groups.forEach(list=>
    list.forEach(item=>{

      item.__expiresAt=
        expiryFromObject(item);

    })
  );

  const smith=
    state.data.blacksmith||{};

  [
    'sword',
    'armor',
    'shelter'
  ].forEach(k=>{

    if(smith[k]?.timer){

      smith[k].timer.__expiresAt=
        expiryFromObject(
          smith[k].timer
        );

    }

  });
}

function updateCountdowns(){

  document
    .querySelectorAll('[data-expires-at]')
    .forEach(el=>{

      const expiresAt=
        Number(el.dataset.expiresAt);

      if(
        !Number.isFinite(expiresAt)
      ){
        return;
      }

      const remaining=
        Math.ceil(
          (expiresAt-Date.now())/1000
        );

      el.textContent=
        (el.dataset.prefix||'') +
        secondsText(remaining);

      if(remaining<=0){

        el.classList.add(
          'expired'
        );

      }

    });
}

async function api(path){

  const t=token();
  const proxy=proxyUrl();

  if(!t){
    throw new Error(
      `${path}: Kein API-Token gespeichert.`
    );
  }

  if(!proxy){
    throw new Error(
      `${path}: Keine Cloudflare-Worker-Adresse gespeichert.`
    );
  }

  let r;

  try {

    r=await fetch(
      proxy+path,
      {
        headers:{
          'Authorization':`Bearer ${t}`,
          'Accept':'application/json'
        },
        cache:'no-store'
      }
    );

  }catch(e){

    throw new Error(
      `${path}: Worker nicht erreichbar (${e?.message || e})`
    );

  }

  const raw=
    await r.text();

  let body={};

  try {

    body=
      raw
        ? JSON.parse(raw)
        : {};

  }catch{

    body={raw};

  }

  if(!r.ok){

    const detail=
      body?.error ||
      body?.message ||
      body?.raw ||
      'keine Antwort';

    throw new Error(
      `${path}: HTTP ${r.status} – ${detail}`
    );

  }

  return body;
}

async function loadAll(){

  if(state.busy){
    return;
  }

  state.busy=true;

  const app=$('#app');

  if(app){
    app.classList.add('loading');
  }

  setText(
    '#refreshState',
    'Aktualisiere…'
  );

  try{

    const endpoints=[
      ['buffs','/v1/me/buffs'],
      ['profile','/v1/me'],
      ['skills','/v1/me/skills'],
      ['blacksmith','/v1/me/blacksmith'],
      ['dragon','/v1/me/dragon'],
      ['outpost','/v1/me/outpost'],
      ['season','/v1/game/season'],
      ['shop','/v1/game/shop'],
      ['live','/v1/game/live']
    ];

    const results=[];

    for(
      let i=0;
      i<endpoints.length;
      i++
    ){

      const [key,path]=
        endpoints[i];

      try{

        const value=
          await api(path);

        state.data[key]=value;

        results.push({
          status:'fulfilled',
          value
        });

      }catch(err){

        results.push({
          status:'rejected',
          reason:err
        });

      }

      if(
        i<
        endpoints.length-1
      ){

        await sleep(
          BETWEEN_REQUESTS_MS
        );

      }
    }

    stampCountdowns();

    render();

    updateCountdowns();

    const report=
      results
        .map(
          (r,i)=>
            r.status==='fulfilled'
              ? `${endpoints[i][1]}: OK`
              : `${endpoints[i][1]}: ${r.reason?.message || r.reason}`
        )
        .join('\n');

    const rejected=
      results.filter(
        r=>r.status==='rejected'
      );

    const errorBox=
      $('#errorBox');

    if(
      rejected.length
    ){

      if(errorBox){

        errorBox.textContent=
          report;

        errorBox.classList.remove(
          'hidden'
        );

      }

      setText(
        '#refreshState',
        `Teilweise aktualisiert · ${new Date().toLocaleTimeString(
          'de-DE',
          {
            hour:'2-digit',
            minute:'2-digit',
            second:'2-digit'
          }
        )}`
      );

    }else{

      if(errorBox){

        errorBox.classList.add(
          'hidden'
        );

      }

      setText(
        '#refreshState',
        `Aktuell · ${new Date().toLocaleTimeString(
          'de-DE',
          {
            hour:'2-digit',
            minute:'2-digit',
            second:'2-digit'
          }
        )}`
      );

    }

    state.lastSync=
      Date.now();

    localStorage.setItem(
      'rm_last',
      String(state.lastSync)
    );

  }catch(e){

    const msg=
      e?.message ||
      String(e);

    const errorBox=
      $('#errorBox');

    if(errorBox){

      errorBox.textContent=
        msg;

      errorBox.classList.remove(
        'hidden'
      );

    }

    setText(
      '#refreshState',
      'Fehler: '+msg
    );

  }finally{

    if(app){

      app.classList.remove(
        'loading'
      );

    }

    state.busy=false;
  }
}

function render(){

  const p=
    state.data.profile||{};

  setText(
    '#knightName',
    p.name||'Mein Ritter'
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
    '#location',
    p.status?.location
      ? `📍 ${p.status.location}`
      : 'Standort unbekannt'
  );

  const online=
    $('#online');

  if(online){

    online.textContent=
      p.status?.online
        ? 'ONLINE'
        : 'OFFLINE';

    online.className=
      p.status?.online
        ? 'online'
        : 'online offline';

  }

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
    '#rank',
    fmt(p.ranking?.position)
  );

  const season=
    state.data.season||{};

  setText(
    '#season',
    season.season!==undefined
      ? `Saison ${season.season} · Tag ${season.day}`
      : 'Saison –'
  );

  renderSkills();
  renderBuffs();
  renderSmith();
  renderDragon();
  renderOutpost();
  renderShop();
  renderLive();
}

function renderSkills(){

  const d=
    state.data.skills||{};

  const renderList=
    (items,el)=>{

      if(!el){
        return;
      }

      el.innerHTML='';

      if(!items?.length){

        el.innerHTML=
          '<div class="small">Keine Daten</div>';

        return;
      }

      [...items]
        .sort(
          (a,b)=>
            (b.active===true)-
            (a.active===true)
        )
        .forEach(s=>{

          el.insertAdjacentHTML(
            'beforeend',
            `<div class="skill ${s.active?'active':''}">

              <div>

                <div class="skillName">
                  ${esc(s.name)}
                </div>

                <div class="skillMeta">
                  Stufe ${fmt(s.level)}
                </div>

              </div>

              ${s.active
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

function renderBuffs(){

  const d=
    state.data.buffs||{};

  const all=[
    ...(d.buffs||[])
      .map(
        x=>({
          ...x,
          debuff:false
        })
      ),

    ...(d.debuffs||[])
      .map(
        x=>({
          ...x,
          debuff:true
        })
      )
  ];

  const el=
    $('#buffs');

  if(!el){
    return;
  }

  el.innerHTML='';

  if(!all.length){

    el.innerHTML=
      '<div class="small">Keine aktiven Buffs oder Debuffs.</div>';

    return;
  }

  all.forEach(b=>{

    const expiry=
      b.__expiresAt ??
      expiryFromObject(b);

    let timerHtml='–';

    if(expiry){

      timerHtml=
        `<span
          data-expires-at="${expiry}"
          data-prefix="${b.debuff?'⚠ ':''}"
        >${b.debuff?'⚠ ':''}${secondsText(
          Math.ceil(
            (expiry-Date.now())/1000
          )
        )}</span>`;

    }else if(
      b.remaining_minutes!==undefined
    ){

      timerHtml=
        `${b.debuff?'⚠ ':''}${minText(
          b.remaining_minutes
        )}`;

    }

    el.insertAdjacentHTML(
      'beforeend',
      `<div class="buff">

        <div class="buffTop">

          <span>
            ${esc(b.name)}
          </span>

          <span>
            ${timerHtml}
          </span>

        </div>

        <div class="buffDesc">

          ${esc(b.description||'')}

          ${b.value!==undefined
            ? ` · Wert ${fmt(b.value)}`
            : ''
          }

        </div>

      </div>`
    );

  });
}

function renderSmith(){

  const d=
    state.data.blacksmith||{};

  const el=
    $('#smith');

  if(!el){
    return;
  }

  el.innerHTML='';

  const map=[
    ['sword','Schwert'],
    ['armor','Rüstung'],
    ['shelter','Unterkunft']
  ];

  map.forEach(([k,n])=>{

    const x=d[k];

    if(!x){
      return;
    }

    let status=
      'bereit';

    if(x.in_progress){

      const expiry=
        x.timer?.__expiresAt ??
        expiryFromObject(
          x.timer
        );

      status=
        expiry
          ? `⏳ <span data-expires-at="${expiry}">${secondsText(
              Math.ceil(
                (expiry-Date.now())/1000
              )
            )}</span>`
          : `⏳ ${minText(
              x.timer?.remaining_minutes
            )}`;

    }

    el.insertAdjacentHTML(
      'beforeend',
      `<div class="row">

        <span>
          ${n} · Stufe ${fmt(x.level)}
        </span>

        <strong>
          ${status}
        </strong>

      </div>`
    );

  });

  if(!el.innerHTML){

    el.innerHTML=
      '<div class="small">Keine Daten</div>';

  }
}

function renderDragon(){

  const d=
    state.data.dragon||{};

  const el=
    $('#dragon');

  if(!el){
    return;
  }

  if(
    d.has_dragon===false
  ){

    el.innerHTML=
      '<div class="small">Noch kein Drache.</div>';

    return;
  }

  if(
    d.level===undefined
  ){

    el.innerHTML=
      '<div class="small">Keine Daten</div>';

    return;
  }

  const pct=
    Math.max(
      0,
      Math.min(
        100,
        Number(
          d.xp_percent||0
        )
      )
    );

  el.innerHTML=
    `<div class="row">

      <span>
        Status
      </span>

      <strong>
        ${esc(d.status)}
      </strong>

    </div>

    <div class="row">

      <span>
        Level
      </span>

      <strong>
        ${fmt(d.level)}
      </strong>

    </div>

    <div class="row">

      <span>
        Futter
      </span>

      <strong>
        ${fmt(d.food)}
      </strong>

    </div>

    <div
      class="small"
      style="margin-top:9px"
    >

      XP ${fmt(d.xp)}
      /
      ${fmt(d.xp_needed)}

    </div>

    <div class="progress">

      <i
        style="width:${pct}%"
      ></i>

    </div>`;
}

function renderOutpost(){

  const d=
    state.data.outpost||{};

  const t=
    d.current_task;

  const el=
    $('#outpost');

  if(!el){
    return;
  }

  if(!t){

    el.innerHTML=
      '<div class="small">Keine aktive Außenposten-Aufgabe.</div>';

    return;
  }

  const pct=
    t.target
      ? Math.min(
          100,
          (t.progress/t.target)*100
        )
      : 0;

  el.innerHTML=
    `<div
      style="
        font-size:13px;
        font-weight:700
      "
    >

      ${esc(t.description)}

    </div>

    <div
      class="small"
      style="margin-top:8px"
    >

      ${fmt(t.progress)}
      /
      ${fmt(t.target)}

    </div>

    <div class="progress">

      <i
        style="width:${pct}%"
      ></i>

    </div>

    <div
      class="small"
      style="margin-top:8px"
    >

      Erledigt:
      ${fmt(d.tasks_completed)}

      · Belohnungen offen:
      ${fmt(d.pending_rewards)}

    </div>`;
}

function renderShop(){

  const d=
    state.data.shop||{};

  const el=
    $('#shop');

  if(!el){
    return;
  }

  el.innerHTML='';

  (d.offers||[])
    .forEach(o=>{

      el.insertAdjacentHTML(
        'beforeend',
        `<div class="shopItem">

          <b>
            ${esc(o.item_name)}
          </b>

          <span>
            ${fmt(o.price)}
            ${esc(o.currency)}
          </span>

        </div>`
      );

    });

  if(!el.innerHTML){

    el.innerHTML=
      '<div class="small">Keine Shopdaten.</div>';

  }
}

function renderLive(){

  const d=
    state.data.live||{};

  const el=
    $('#live');

  if(!el){
    return;
  }

  const active=[];

  if(
    d.tower?.phase
  ){

    active.push(
      `Schwarzer Turm: ${d.tower.phase}`
    );

  }

  Object.entries(
    d.weekly_events||{}
  ).forEach(
    ([k,v])=>{

      if(v?.active){

        active.push(
          k.replaceAll('_',' ')
        );

      }

    }
  );

  Object.entries(
    d.events||{}
  ).forEach(
    ([k,v])=>{

      if(
        v===true ||
        v?.active
      ){

        active.push(
          k.replaceAll('_',' ')
        );

      }

    }
  );

  el.innerHTML=
    active.length
      ? active
          .map(
            x=>
              `<span
                class="pill"
                style="margin:3px"
              >
                ${esc(x)}
              </span>`
          )
          .join('')
      : '<div class="small">Keine besonderen Live-Ereignisse erkannt.</div>';
}

function openSettings(){

  const drawer=
    $('#drawer');

  if(!drawer){
    return;
  }

  const tokenInput=
    $('#tokenInput');

  const proxyInput=
    $('#proxyInput');

  const autoInput=
    $('#autoInput');

  if(tokenInput){
    tokenInput.value=
      token();
  }

  if(proxyInput){
    proxyInput.value=
      proxyUrl();
  }

  if(autoInput){
    autoInput.checked=
      autoRefresh();
  }

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

  const tokenInput=
    $('#tokenInput');

  const proxyInput=
    $('#proxyInput');

  const autoInput=
    $('#autoInput');

  const t=
    tokenInput?.value.trim() || '';

  const proxy=
    (proxyInput?.value || '')
      .trim()
      .replace(/\/+$/,'');

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
    autoInput?.checked
      ? '1'
      : '0'
  );

  closeSettings();

  setupTimer();

  if(
    t &&
    proxy
  ){

    loadAll();

  }else{

    openSettings();

  }
}

function forgetToken(){

  localStorage.removeItem(
    'rm_token'
  );

  const tokenInput=
    $('#tokenInput');

  if(tokenInput){
    tokenInput.value='';
  }

  const errorBox=
    $('#errorBox');

  if(errorBox){

    errorBox.textContent=
      'Token wurde nur auf diesem Gerät gelöscht.';

    errorBox.classList.remove(
      'hidden'
    );

  }
}

function setupTimer(){

  if(state.timer){

    clearInterval(
      state.timer
    );

  }

  state.timer=null;

  if(
    autoRefresh() &&
    token() &&
    proxyUrl()
  ){

    state.timer=
      setInterval(
        loadAll,
        API_SYNC_MS
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

  state.countdownTimer=
    setInterval(
      updateCountdowns,
      1000
    );

  updateCountdowns();
}

function updateAutoRefreshLabel(){

  const box=
    $('#autoInput');

  const parent=
    box?.parentElement;

  if(!parent){
    return;
  }

  parent
    .childNodes
    .forEach(node=>{

      if(
        node.nodeType===Node.TEXT_NODE &&
        node.textContent.includes(
          '30 Sekunden'
        )
      ){

        node.textContent=
          node.textContent.replace(
            '30 Sekunden',
            '60 Sekunden'
          );

      }

    });
}

document.addEventListener(
  'click',
  e=>{

    const target=
      e.target instanceof Element
        ? e.target
        : null;

    if(!target){
      return;
    }

    if(
      target.closest(
        '#settingsBtn'
      )
    ){

      e.preventDefault();

      openSettings();

      return;
    }

    if(
      target.closest(
        '#closeBtn'
      )
    ){

      e.preventDefault();

      closeSettings();

      return;
    }

    if(
      target.closest(
        '#saveBtn'
      )
    ){

      e.preventDefault();

      saveSettings();

      return;
    }

    if(
      target.closest(
        '#forgetBtn'
      )
    ){

      e.preventDefault();

      forgetToken();

      return;
    }

    if(
      target.closest(
        '#refreshBtn'
      )
    ){

      e.preventDefault();

      loadAll();

      return;
    }

  }
);

window.addEventListener(
  'load',
  ()=>{

    const drawer=
      $('#drawer');

    if(drawer){

      drawer.addEventListener(
        'click',
        e=>{

          if(
            e.target===drawer
          ){

            closeSettings();

          }

        }
      );

    }

    if(
      'serviceWorker'
      in navigator
    ){

      navigator
        .serviceWorker
        .register(
          './service-worker.js'
        )
        .catch(()=>{});

    }

    updateAutoRefreshLabel();

    setupCountdownTimer();

    setupTimer();

    if(
      token() &&
      proxyUrl()
    ){

      loadAll();

    }else{

      openSettings();

    }

  }
);
