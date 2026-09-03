const DIRECT_API = 'https://api.knight-manager.com';
const $ = (s)=>document.querySelector(s);
const state = {timer:null, data:{}};

function esc(v){
  return String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function fmt(n){
  if(n===null||n===undefined||n==='') return '–';
  if(typeof n==='number') return new Intl.NumberFormat('de-DE').format(n);
  return esc(n);
}
function minText(m){
  if(m===null||m===undefined) return '–';
  if(m < 60) return `${Math.max(0,Math.floor(m))} Min`;
  const h=Math.floor(m/60), r=Math.floor(m%60);
  return `${h} Std ${r} Min`;
}
function setText(id, val){ const el=$(id); if(el) el.textContent = val ?? '–'; }
function token(){ return localStorage.getItem('rm_token') || ''; }
function proxyUrl(){ return (localStorage.getItem('rm_proxy') || '').replace(/\/+$/,''); }
function autoRefresh(){ return localStorage.getItem('rm_auto') !== '0'; }

async function api(path){
  const t=token();
  const proxy=proxyUrl();

  if(!t) throw new Error(`${path}: Kein API-Token gespeichert.`);
  if(!proxy) throw new Error(`${path}: Keine Cloudflare-Worker-Adresse gespeichert.`);

  let r;

  try {
    r=await fetch(proxy+path,{
      headers:{
        'Authorization':`Bearer ${t}`,
        'Accept':'application/json'
      },
      cache:'no-store'
    });
  } catch (e) {
    throw new Error(`${path}: Worker nicht erreichbar (${e?.message || e})`);
  }

  const raw = await r.text();

  let body = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = {raw};
  }

  if(!r.ok){
    const detail =
      body?.error ||
      body?.message ||
      body?.raw ||
      'keine Antwort';

    throw new Error(`${path}: HTTP ${r.status} – ${detail}`);
  }

  return body;
}

async function loadAll(){
  const app=$('#app');
  app.classList.add('loading');
  setText('#refreshState','Aktualisiere…');

  try{
    const endpoints = [
      ['profile','/v1/me'],
      ['skills','/v1/me/skills'],
      ['buffs','/v1/me/buffs'],
      ['blacksmith','/v1/me/blacksmith'],
      ['dragon','/v1/me/dragon'],
      ['outpost','/v1/me/outpost'],
      ['season','/v1/game/season'],
      ['shop','/v1/game/shop'],
      ['live','/v1/game/live']
    ];

    const results = await Promise.allSettled(
      endpoints.map(x=>api(x[1]))
    );

    results.forEach((r,i)=>{
      if(r.status==='fulfilled'){
        state.data[endpoints[i][0]]=r.value;
      }
    });

    const report = results.map((r,i)=>
      r.status === 'fulfilled'
        ? `${endpoints[i][1]}: OK`
        : `${endpoints[i][1]}: ${r.reason?.message || r.reason}`
    ).join('\n');

    const rejected = results.filter(
      r=>r.status==='rejected'
    );

    if(!state.data.profile && rejected.length){
      alert(
        'RitterManager API-Diagnose:\n\n' +
        report
      );

      throw rejected[0].reason;
    }

    render();

    if(rejected.length){
      $('#errorBox').textContent = report;
      $('#errorBox').classList.remove('hidden');

      alert(
        'RitterManager API-Diagnose:\n\n' +
        report
      );
    } else {
      $('#errorBox').classList.add('hidden');
    }

    setText('#refreshState','Gerade aktualisiert');
    localStorage.setItem('rm_last',String(Date.now()));

  } catch(e){
    const msg=e?.message || String(e);

    $('#errorBox').textContent=msg;
    $('#errorBox').classList.remove('hidden');

    setText(
      '#refreshState',
      'Fehler: '+msg
    );

  } finally {
    app.classList.remove('loading');
  }
}

function render(){
  const p=state.data.profile||{};

  setText('#knightName',p.name||'Mein Ritter');
  setText('#level',fmt(p.level));
  setText('#gold',fmt(p.currencies?.gold));
  setText('#diamonds',fmt(p.currencies?.diamonds));
  setText('#honor',fmt(p.ranking?.honor));
  setText('#location',p.status?.location ? `📍 ${p.status.location}` : 'Standort unbekannt');

  const online=$('#online');
  online.textContent=p.status?.online?'ONLINE':'OFFLINE';
  online.className=p.status?.online?'online':'online offline';

  setText('#huntLevel',fmt(p.hunting?.level));
  setText('#huntKills',fmt(p.hunting?.kills));
  setText('#huntPoints',fmt(p.hunting?.points));
  setText('#cooking',fmt(p.crafting?.cooking));
  setText('#engineering',fmt(p.crafting?.engineering));
  setText('#adventure',fmt(p.progress?.adventure));
  setText('#tower',fmt(p.progress?.tower));
  setText('#sword',fmt(p.upgrades?.sword));
  setText('#armor',fmt(p.upgrades?.armor));
  setText('#shelter',fmt(p.upgrades?.shelter));
  setText('#rank',fmt(p.ranking?.position));

  const season=state.data.season||{};
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
  const d=state.data.skills||{};

  const renderList=(items,el)=>{
    el.innerHTML='';

    if(!items?.length){
      el.innerHTML='<div class="small">Keine Daten</div>';
      return;
    }

    items
      .sort((a,b)=>(b.active===true)-(a.active===true))
      .forEach(s=>{
        el.insertAdjacentHTML(
          'beforeend',
          `<div class="skill ${s.active?'active':''}">
            <div>
              <div class="skillName">${esc(s.name)}</div>
              <div class="skillMeta">Stufe ${fmt(s.level)}</div>
            </div>
            ${s.active?'<span class="badge">AKTIV</span>':''}
          </div>`
        );
      });
  };

  renderList(d.combat,$('#combatSkills'));
  renderList(d.hunting,$('#huntSkills'));
}

function renderBuffs(){
  const d=state.data.buffs||{};

  const all=[
    ...(d.buffs||[]).map(x=>({...x,debuff:false})),
    ...(d.debuffs||[]).map(x=>({...x,debuff:true}))
  ];

  const el=$('#buffs');
  el.innerHTML='';

  if(!all.length){
    el.innerHTML='<div class="small">Keine aktiven Buffs oder Debuffs.</div>';
    return;
  }

  all.forEach(b=>{
    el.insertAdjacentHTML(
      'beforeend',
      `<div class="buff">
        <div class="buffTop">
          <span>${esc(b.name)}</span>
          <span>${b.debuff?'⚠ ':''}${minText(b.remaining_minutes)}</span>
        </div>
        <div class="buffDesc">
          ${esc(b.description||'')}
          ${b.value!==undefined?` · Wert ${fmt(b.value)}`:''}
        </div>
      </div>`
    );
  });
}

function renderSmith(){
  const d=state.data.blacksmith||{};
  const el=$('#smith');

  el.innerHTML='';

  const map=[
    ['sword','Schwert'],
    ['armor','Rüstung'],
    ['shelter','Unterkunft']
  ];

  map.forEach(([k,n])=>{
    const x=d[k];
    if(!x) return;

    el.insertAdjacentHTML(
      'beforeend',
      `<div class="row">
        <span>${n} · Stufe ${fmt(x.level)}</span>
        <strong>
          ${x.in_progress
            ? '⏳ '+minText(x.timer?.remaining_minutes)
            : 'bereit'}
        </strong>
      </div>`
    );
  });

  if(!el.innerHTML){
    el.innerHTML='<div class="small">Keine Daten</div>';
  }
}

function renderDragon(){
  const d=state.data.dragon||{};
  const el=$('#dragon');

  if(d.has_dragon===false){
    el.innerHTML='<div class="small">Noch kein Drache.</div>';
    return;
  }

  if(d.level===undefined){
    el.innerHTML='<div class="small">Keine Daten</div>';
    return;
  }

  const pct=Math.max(
    0,
    Math.min(100,Number(d.xp_percent||0))
  );

  el.innerHTML=`
    <div class="row">
      <span>Status</span>
      <strong>${esc(d.status)}</strong>
    </div>

    <div class="row">
      <span>Level</span>
      <strong>${fmt(d.level)}</strong>
    </div>

    <div class="row">
      <span>Futter</span>
      <strong>${fmt(d.food)}</strong>
    </div>

    <div class="small" style="margin-top:9px">
      XP ${fmt(d.xp)} / ${fmt(d.xp_needed)}
    </div>

    <div class="progress">
      <i style="width:${pct}%"></i>
    </div>
  `;
}

function renderOutpost(){
  const d=state.data.outpost||{};
  const t=d.current_task;
  const el=$('#outpost');

  if(!t){
    el.innerHTML='<div class="small">Keine aktive Außenposten-Aufgabe.</div>';
    return;
  }

  const pct=t.target
    ? Math.min(100,(t.progress/t.target)*100)
    : 0;

  el.innerHTML=`
    <div style="font-size:13px;font-weight:700">
      ${esc(t.description)}
    </div>

    <div class="small" style="margin-top:8px">
      ${fmt(t.progress)} / ${fmt(t.target)}
    </div>

    <div class="progress">
      <i style="width:${pct}%"></i>
    </div>

    <div class="small" style="margin-top:8px">
      Erledigt: ${fmt(d.tasks_completed)}
      · Belohnungen offen: ${fmt(d.pending_rewards)}
    </div>
  `;
}

function renderShop(){
  const d=state.data.shop||{};
  const el=$('#shop');

  el.innerHTML='';

  (d.offers||[]).forEach(o=>{
    el.insertAdjacentHTML(
      'beforeend',
      `<div class="shopItem">
        <b>${esc(o.item_name)}</b>
        <span>${fmt(o.price)} ${esc(o.currency)}</span>
      </div>`
    );
  });

  if(!el.innerHTML){
    el.innerHTML='<div class="small">Keine Shopdaten.</div>';
  }
}

function renderLive(){
  const d=state.data.live||{};
  const el=$('#live');
  const active=[];

  if(d.tower?.phase){
    active.push(
      `Schwarzer Turm: ${d.tower.phase}`
    );
  }

  Object.entries(d.weekly_events||{})
    .forEach(([k,v])=>{
      if(v?.active){
        active.push(k.replaceAll('_',' '));
      }
    });

  Object.entries(d.events||{})
    .forEach(([k,v])=>{
      if(v===true || v?.active){
        active.push(k.replaceAll('_',' '));
      }
    });

  el.innerHTML=
    active.length
      ? active
          .map(
            x=>`<span class="pill" style="margin:3px">${esc(x)}</span>`
          )
          .join('')
      : '<div class="small">Keine besonderen Live-Ereignisse erkannt.</div>';
}

function openSettings(){
  $('#tokenInput').value=token();
  $('#proxyInput').value=proxyUrl();
  $('#autoInput').checked=autoRefresh();
  $('#drawer').classList.add('open');
}

function closeSettings(){
  $('#drawer').classList.remove('open');
}

function saveSettings(){
  const t=$('#tokenInput').value.trim();

  const proxy=$('#proxyInput')
    .value
    .trim()
    .replace(/\/+$/,'');

  if(t){
    localStorage.setItem('rm_token',t);
  } else {
    localStorage.removeItem('rm_token');
  }

  if(proxy){
    localStorage.setItem('rm_proxy',proxy);
  } else {
    localStorage.removeItem('rm_proxy');
  }

  localStorage.setItem(
    'rm_auto',
    $('#autoInput').checked?'1':'0'
  );

  closeSettings();
  setupTimer();

  if(t && proxy){
    loadAll();
  } else {
    openSettings();
  }
}

function forgetToken(){
  localStorage.removeItem('rm_token');
  $('#tokenInput').value='';

  $('#errorBox').textContent=
    'Token wurde nur auf diesem Gerät gelöscht.';

  $('#errorBox').classList.remove('hidden');
}

function setupTimer(){
  if(state.timer){
    clearInterval(state.timer);
  }

  if(autoRefresh() && token() && proxyUrl()){
    state.timer=setInterval(
      loadAll,
      30000
    );
  }
}

window.addEventListener('load',()=>{
  $('#settingsBtn').addEventListener(
    'click',
    openSettings
  );

  $('#closeBtn').addEventListener(
    'click',
    closeSettings
  );

  $('#saveBtn').addEventListener(
    'click',
    saveSettings
  );

  $('#forgetBtn').addEventListener(
    'click',
    forgetToken
  );

  $('#refreshBtn').addEventListener(
    'click',
    loadAll
  );

  $('#drawer').addEventListener(
    'click',
    e=>{
      if(e.target.id==='drawer'){
        closeSettings();
      }
    }
  );

  if('serviceWorker' in navigator){
    navigator
      .serviceWorker
      .register('./service-worker.js')
      .catch(()=>{});
  }

  setupTimer();

  if(token() && proxyUrl()){
    loadAll();
  } else {
    openSettings();
  }
});
