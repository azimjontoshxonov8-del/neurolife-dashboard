/* =============================================
   НЕЙРОМАЙФ — app.js (GitHub Pages + Live Sheets)
   ============================================= */

/* ── Google Sheets IDs ── */
const SHEETS = {
  baza: '1CsqSyUfPZLXmeJacHlCEDna6KYZFV1HGbG1csQai6wM',
  kpi:  '1m62lBBNo5PBaCRe5P92V4Jlp-NnqXo2bja_3Epx1Yvo',
};

/* ── Fallback static data ── */
const FALLBACK = {
  months: ['Yanvar','Fevral','Mart','Aprel','May'],
  mo:     ['Yan','Fev','Mar','Apr','May'],
  kirim:  [310190100, 306252000, 350960000, 522462000, 438964500],
  chiqim: [373273152, 319781164, 362011946, 396280170,  84960226],
  sof:    [-63083052, -13529164, -11051946, 126181830, 354004274],
  services: [
    { name:'LFK',    data:[115716700,141526000,136784000,209352000,208480500], total:811859200 },
    { name:'SIT',    data:[38641000,46280000,59124000,80236000,68952000],      total:293233000 },
    { name:'MASSAJ', data:[41409200,49182000,38150000,76762000,51604000],      total:257107200 },
    { name:'IGNA',   data:[56134000,17506000,52368000,65368000,45272000],      total:236648000 },
    { name:'ERGO',   data:[41409200,35308000,25844000,30394000,24206000],      total:157161200 },
    { name:'ORTO',   data:[8880000,5400000,18240000,35000000,23000000],        total:90520000  },
    { name:'Boshqa', data:[8000000,11050000,20450000,25350000,17450000],       total:82300000  },
  ],
  expenses: [
    { name:'Ish haqlari',   value:748656067 },
    { name:'Soliq',         value:279872017 },
    { name:'Ijara',         value:240000000 },
    { name:'Ovqat/Bonus',   value:60000000  },
    { name:'Buxgalter',     value:60000000  },
    { name:'Adm. xarajat',  value:55847474  },
    { name:'Marketing',     value:38637000  },
    { name:'Kommunal',      value:28921932  },
    { name:'Avto',          value:9962400   },
    { name:'Bank/Internet', value:8058326   },
  ],
  bolimlar: [
    { name:"Bo'lim 1", hodimlar:3 },
    { name:"Bo'lim 2", hodimlar:3 },
    { name:"Bo'lim 3", hodimlar:4 },
    { name:"Bo'lim 4", hodimlar:3 },
    { name:"Bo'lim 5", hodimlar:3 },
  ],
  hodimlar: Array.from({length:16},(_,i)=>({
    no:i+1, bolim:`Bo'lim ${Math.floor(i/3)+1}`,
    hodim:`Hodim ${i+1}`, jami:null,ort:null,plan:null,pct:null,kpi:null,holat:null
  })),
  acc:{ naqd:669893960, firma:279872017 },
  lastUpdated:'05.06.2026',
};

let DATA = JSON.parse(JSON.stringify(FALLBACK));

/* ── Google Sheets gviz fetch ── */
async function fetchGviz(id, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.replace(/^[^\(]+\(/, '').replace(/\);\s*$/, ''));
  return json.table;
}

/* ── Parse BAZA sheet ── */
async function loadBaza() {
  try {
    const t = await fetchGviz(SHEETS.baza, 'BAZA');
    if (!t || !t.rows) return false;
    const rows = t.rows;
    let kirim=[], chiqim=[], sof=[], found=0;
    for (const row of rows) {
      const cells = row.c || [];
      const label = (cells[0]?.v || '').toString().toLowerCase().trim();
      if (label.includes('kirim') && found===0) {
        for(let i=1;i<=5;i++) kirim.push(+(cells[i]?.v)||0);
        found++;
      } else if (label.includes('chiqim') && found===1) {
        for(let i=1;i<=5;i++) chiqim.push(+(cells[i]?.v)||0);
        found++;
      } else if ((label.includes('sof') || label.includes('foyda')) && found===2) {
        for(let i=1;i<=5;i++) sof.push(+(cells[i]?.v)||0);
        found++;
      }
      if (found===3) break;
    }
    if (kirim.length===5 && kirim.some(v=>v>0)) {
      DATA.kirim = kirim;
      DATA.chiqim = chiqim;
      DATA.sof = sof;
      DATA.lastUpdated = new Date().toLocaleDateString('uz-UZ');
      return true;
    }
  } catch(e) { console.warn('Sheets fetch failed, using static data:', e); }
  return false;
}

/* ── Formatters ── */
function fmt(n) {
  const a=Math.abs(n);
  if(a>=1e9) return (n/1e9).toFixed(2)+' mlrd';
  if(a>=1e6) return (n/1e6).toFixed(1)+' mln';
  if(a>=1e3) return (n/1e3).toFixed(0)+' ming';
  return Math.round(n).toLocaleString('uz');
}
function fmtN(n){ return new Intl.NumberFormat('uz-UZ').format(Math.round(n)); }

/* ── Counter animation ── */
function count(el, target, mode) {
  if(!el) return;
  const steps=40, interval=900/steps;
  let step=0;
  const timer=setInterval(()=>{
    step++;
    const ease=1-Math.pow(1-step/steps,3);
    const cur=target*ease;
    el.textContent=mode==='fmt'?fmt(cur):Math.round(cur);
    if(step>=steps){ el.textContent=mode==='fmt'?fmt(target):Math.round(target); clearInterval(timer); }
  },interval);
}

/* ── Charts ── */
const charts={};
function destroyChart(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }
const COLORS={
  kirim:'rgba(240,116,105,0.85)', chiqim:'rgba(100,116,139,0.75)',
  svc:['#f07469','#e8855a','#f5a623','#4ade80','#60a5fa','#a78bfa','#f472b6'],
  exp:['#f07469','#e8855a','#f5a623','#4ade80','#60a5fa','#a78bfa','#f472b6','#fb923c','#34d399','#818cf8'],
};
function cd(){ const dark=document.body.classList.contains('dark'); return { color:dark?'#cbd5e1':'#475569', gridColor:dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)' }; }

/* ── KPI cards ── */
function updateKPIs(){
  const tK=DATA.kirim.reduce((a,b)=>a+b,0);
  const tC=DATA.chiqim.reduce((a,b)=>a+b,0);
  const tS=DATA.sof.reduce((a,b)=>a+b,0);
  count(document.getElementById('v-total-kirim'),tK,'fmt');
  count(document.getElementById('v-total-chiqim'),tC,'fmt');
  count(document.getElementById('v-sof-foyda'),tS,'fmt');
  count(document.getElementById('v-hodim'),DATA.hodimlar.length,'num');
  const bs=document.getElementById('v-bolim-sub'); if(bs) bs.textContent=DATA.bolimlar.length+" bo'lim";

  count(document.getElementById('v-cf-jan'),DATA.kirim[0],'fmt');
  count(document.getElementById('v-cf-feb'),DATA.kirim[1],'fmt');
  count(document.getElementById('v-cf-max'),Math.max(...DATA.kirim),'fmt');
  count(document.getElementById('v-naqd'),DATA.acc.naqd,'fmt');

  const sT=DATA.services.reduce((a,s)=>a+s.total,0);
  ['sn1','sn2','sn3','sn4'].forEach((id,i)=>{ const el=document.getElementById(id); if(el) el.textContent=DATA.services[i]?.name||'—'; });
  ['sv1','sv2','sv3','sv4'].forEach((id,i)=>{ const el=document.getElementById(id); if(el) count(el,DATA.services[i]?.total||0,'fmt'); });
  ['sp1','sp2','sp3','sp4'].forEach((id,i)=>{ const el=document.getElementById(id); if(el) el.textContent=sT?((DATA.services[i]?.total/sT*100).toFixed(1)+'%'):'—'; });

  const eT=DATA.expenses.reduce((a,e)=>a+e.value,0);
  ['en1','en2','en3','en4'].forEach((id,i)=>{ const el=document.getElementById(id); if(el) el.textContent=DATA.expenses[i]?.name||'—'; });
  ['ev1','ev2','ev3','ev4'].forEach((id,i)=>{ const el=document.getElementById(id); if(el) count(el,DATA.expenses[i]?.value||0,'fmt'); });
  ['ep1','ep2','ep3','ep4'].forEach((id,i)=>{ const el=document.getElementById(id); if(el) el.textContent=eT?((DATA.expenses[i]?.value/eT*100).toFixed(1)+'%'):'—'; });

  count(document.getElementById('v-kpi-hodim'),DATA.hodimlar.length,'num');
  count(document.getElementById('v-kpi-bolim'),DATA.bolimlar.length,'num');
  count(document.getElementById('v-pr-jan'),DATA.sof[0],'fmt');
  count(document.getElementById('v-pr-apr'),DATA.sof[3],'fmt');
  count(document.getElementById('v-pr-may'),DATA.sof[4],'fmt');

  const sd=document.getElementById('sync-label'); if(sd) sd.textContent=DATA.lastUpdated;
  const ss=document.getElementById('sync-status'); if(ss) ss.className='sync-dot synced';
}

/* ── Tables ── */
function buildTables(){
  const pill=(s)=>s>=0?'<span class="pill pill-ok">Foydali</span>':'<span class="pill pill-err">Yo\'qotish</span>';

  const tm=document.getElementById('t-monthly');
  if(tm) tm.innerHTML=DATA.kirim.map((k,i)=>{
    const c=DATA.chiqim[i],s=DATA.sof[i],r=k?((s/k)*100).toFixed(1):0;
    return `<tr><td>${DATA.months[i]}</td><td class="r">${fmtN(k)}</td><td class="r">${fmtN(c)}</td>
    <td class="r ${s>=0?'positive':'negative'}">${fmtN(s)}</td>
    <td class="r ${r>=0?'positive':'negative'}">${r}%</td><td>${pill(s)}</td></tr>`;
  }).join('');

  const ts=document.getElementById('t-services');
  if(ts){ const sT=DATA.services.reduce((a,s)=>a+s.total,0);
    ts.innerHTML=DATA.services.map(s=>`<tr><td><strong>${s.name}</strong></td>
    ${s.data.map(v=>`<td class="r">${fmt(v)}</td>`).join('')}
    <td class="r"><strong>${fmt(s.total)}</strong></td>
    <td class="r">${sT?((s.total/sT*100).toFixed(1)+'%'):'—'}</td></tr>`).join(''); }

  const tk=document.getElementById('t-kpi');
  if(tk) tk.innerHTML=DATA.hodimlar.map(h=>`<tr>
    <td>${h.no}</td><td>${h.bolim}</td><td>${h.hodim}</td>
    <td class="r">${h.jami??'—'}</td><td class="r">${h.ort??'—'}</td>
    <td class="r">${h.plan??'—'}</td><td class="r">${h.pct!=null?h.pct+'%':'—'}</td>
    <td class="r">${h.kpi??'—'}</td><td>${h.holat??'<span class="pill">—</span>'}</td></tr>`).join('');

  const tp=document.getElementById('t-profit');
  if(tp) tp.innerHTML=DATA.kirim.map((k,i)=>{
    const c=DATA.chiqim[i],s=DATA.sof[i],r=k?((s/k)*100).toFixed(1):0;
    return `<tr><td>${DATA.months[i]}</td><td class="r">${fmtN(k)}</td><td class="r">${fmtN(c)}</td>
    <td class="r ${s>=0?'positive':'negative'}">${fmtN(s)}</td>
    <td class="r ${r>=0?'positive':'negative'}">${r}%</td><td>${pill(s)}</td></tr>`;
  }).join('');
}

/* ── Charts ── */
function buildCharts(){
  const D=cd(), mo=DATA.mo;
  const opt=(extra={})=>({responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:D.color}}},...extra});
  const scales=()=>({x:{ticks:{color:D.color},grid:{color:D.gridColor}},y:{ticks:{color:D.color},grid:{color:D.gridColor}}});

  destroyChart('monthly');
  const cm=document.getElementById('c-monthly');
  if(cm) charts['monthly']=new Chart(cm,{type:'bar',data:{labels:mo,datasets:[
    {label:'Kirim',data:DATA.kirim.map(v=>+(v/1e6).toFixed(1)),backgroundColor:COLORS.kirim,borderRadius:6},
    {label:'Chiqim',data:DATA.chiqim.map(v=>+(v/1e6).toFixed(1)),backgroundColor:COLORS.chiqim,borderRadius:6},
  ]},options:{...opt(),scales:scales()}});

  destroyChart('svc-donut');
  const csd=document.getElementById('c-svc-donut');
  if(csd) charts['svc-donut']=new Chart(csd,{type:'doughnut',data:{labels:DATA.services.map(s=>s.name),datasets:[{data:DATA.services.map(s=>+(s.total/1e6).toFixed(1)),backgroundColor:COLORS.svc,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:D.color,font:{size:11}}}}}});

  destroyChart('cashflow');
  const ccf=document.getElementById('c-cashflow');
  if(ccf) charts['cashflow']=new Chart(ccf,{type:'line',data:{labels:mo,datasets:[
    {label:'Kirim',data:DATA.kirim.map(v=>+(v/1e6).toFixed(1)),borderColor:COLORS.kirim,backgroundColor:'rgba(240,116,105,0.12)',fill:true,tension:0.4,pointRadius:5},
    {label:'Chiqim',data:DATA.chiqim.map(v=>+(v/1e6).toFixed(1)),borderColor:'#64748b',backgroundColor:'rgba(100,116,139,0.08)',fill:true,tension:0.4,pointRadius:5},
    {label:'Sof',data:DATA.sof.map(v=>+(v/1e6).toFixed(1)),borderColor:COLORS.kirim,backgroundColor:'transparent',tension:0.4,pointRadius:5,borderDash:[5,5]},
  ]},options:{...opt(),scales:scales()}});

  destroyChart('account');
  const cac=document.getElementById('c-account');
  if(cac) charts['account']=new Chart(cac,{type:'doughnut',data:{labels:['Naqd','Firma'],datasets:[{data:[+(DATA.acc.naqd/1e6).toFixed(1),+(DATA.acc.firma/1e6).toFixed(1)],backgroundColor:['#f07469','#60a5fa'],borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:D.color}}}}});

  destroyChart('svc-line');
  const csl=document.getElementById('c-svc-line');
  if(csl) charts['svc-line']=new Chart(csl,{type:'line',data:{labels:mo,datasets:DATA.services.map((s,i)=>({label:s.name,data:s.data.map(v=>+(v/1e6).toFixed(1)),borderColor:COLORS.svc[i],backgroundColor:'transparent',tension:0.4,pointRadius:4}))},options:{...opt(),scales:scales()}});

  destroyChart('svc-pie');
  const csp=document.getElementById('c-svc-pie');
  if(csp) charts['svc-pie']=new Chart(csp,{type:'doughnut',data:{labels:DATA.services.map(s=>s.name),datasets:[{data:DATA.services.map(s=>+(s.total/1e6).toFixed(1)),backgroundColor:COLORS.svc,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:D.color,font:{size:11}}}}}});

  destroyChart('exp-bar');
  const ceb=document.getElementById('c-exp-bar');
  if(ceb) charts['exp-bar']=new Chart(ceb,{type:'bar',data:{labels:DATA.expenses.map(e=>e.name),datasets:[{label:'UZS mln',data:DATA.expenses.map(e=>+(e.value/1e6).toFixed(1)),backgroundColor:COLORS.exp,borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:scales()}});

  destroyChart('exp-pie');
  const cep=document.getElementById('c-exp-pie');
  if(cep) charts['exp-pie']=new Chart(cep,{type:'doughnut',data:{labels:DATA.expenses.map(e=>e.name),datasets:[{data:DATA.expenses.map(e=>+(e.value/1e6).toFixed(1)),backgroundColor:COLORS.exp,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:D.color,font:{size:10}}}}}});

  destroyChart('dept');
  const cdp=document.getElementById('c-dept');
  if(cdp) charts['dept']=new Chart(cdp,{type:'bar',data:{labels:DATA.bolimlar.map(b=>b.name),datasets:[{label:'Hodimlar',data:DATA.bolimlar.map(b=>b.hodimlar),backgroundColor:COLORS.svc,borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:D.color},grid:{color:D.gridColor}},y:{ticks:{color:D.color,stepSize:1},grid:{color:D.gridColor}}}}});

  destroyChart('profit');
  const cpf=document.getElementById('c-profit');
  if(cpf) charts['profit']=new Chart(cpf,{type:'bar',data:{labels:mo,datasets:[{label:'Sof foyda',data:DATA.sof.map(v=>+(v/1e6).toFixed(1)),backgroundColor:DATA.sof.map(v=>v>=0?'rgba(240,116,105,0.85)':'rgba(239,68,68,0.75)'),borderRadius:6}]},options:{...opt(),scales:scales()}});
}

/* ── Navigation ── */
const TITLES={overview:"Umumiy ko'rinish",cashflow:'Pul oqimi',services:'Xizmatlar',expenses:'Xarajatlar',kpi:'Hodimlar KPI',profit:'Foyda tahlili'};
function go(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a=>a.classList.remove('active'));
  const sec=document.getElementById(id); if(sec) sec.classList.add('active');
  const link=document.querySelector(`.nav-link[data-section="${id}"]`); if(link) link.classList.add('active');
  const pt=document.getElementById('page-title'); if(pt) pt.textContent=TITLES[id]||'';
  window.location.hash=id;
  if(window.innerWidth<=768) document.getElementById('sidebar')?.classList.remove('open');
}
document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();go(a.dataset.section);}));
document.getElementById('menu-btn')?.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'));

/* ── Dark mode ── */
(()=>{
  const btn=document.getElementById('btn-theme'),icon=document.getElementById('theme-icon');
  if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');
  function syncIcon(){ const dark=document.body.classList.contains('dark');
    if(icon) icon.innerHTML=dark?'<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>':'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'; }
  syncIcon();
  btn?.addEventListener('click',()=>{ document.body.classList.toggle('dark'); localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light'); syncIcon(); setTimeout(buildCharts,100); });
})();

/* ── Init ── */
async function init() {
  const ov=document.getElementById('loading-overlay');
  const sd=document.getElementById('sync-label');
  const ss=document.getElementById('sync-status');
  if(sd) sd.textContent='Sheets yuklanmoqda…';
  const ok=await loadBaza();
  if(ov) ov.style.display='none';
  if(ss) ss.className='sync-dot synced';
  if(sd) sd.textContent=ok?DATA.lastUpdated:"Statik ma'lumot";
  const hash=(window.location.hash||'#overview').replace('#','');
  go(hash in TITLES?hash:'overview');
  buildTables();
  updateKPIs();
  setTimeout(buildCharts,50);
}

if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); } else { init(); }
