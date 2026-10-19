'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let D,R,page=1,filtered=[],state={q:'',type:'',day:'',session:'',topic:'',resource:'',sort:'selected',size:'50',author:'',institution:'',track:'',location:'',coverage:'',saved:false},saved=new Set();
try{saved=new Set(JSON.parse(localStorage.getItem('neurips2026-saved')||'[]'));}catch{}
const keys=Object.keys(state);const byId={};
const link=(u,t)=>/^https?:\/\//.test(u||'')?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)} ↗</a>`:'';
function chip(k,v,label=v){return `<button class="chip" data-filter="${k}" data-value="${esc(v)}">${esc(label)}</button>`}
function resourceLinks(p){return [link(p.official,'Official'),link(p.openreview,'OpenReview'),link(p.arxiv,'arXiv'),link(p.pdf,'PDF'),link(p.supplementary,'Supplement'),...(p.project||[]).map((u,i)=>link(u,'Project'+(i?' '+(i+1):''))),...(p.code||[]).map((u,i)=>link(u,'Code'+(i?' '+(i+1):'')))].filter(Boolean).join(' ')}
function names(p,key){return (p[key]||[]).map(v=>`<button class="text-chip" data-filter="${key==='authors'?'author':'institution'}" data-value="${esc(v)}">${esc(v)}</button>`).join(' <span class="muted">·</span> ')}
function schedule(p){return `${esc(p.track)} · ${esc(p.locations.join(' / ')||'Location unassigned')}<br>${esc(p.sessions.join(' · ')||'Session unassigned')}<br><span class="coverage-badge">${esc(p.coverage)}</span>`;}
let paperId=null,restoringHistory=false;
const defaults=()=>({q:'',type:'',day:'',session:'',topic:'',resource:'',sort:'selected',size:'50',author:'',institution:'',track:'',location:'',coverage:'',saved:false});
function highlightFilters(){
 document.querySelectorAll('[data-filter]').forEach(button=>{
  const selected=!!state[button.dataset.filter]&&state[button.dataset.filter]===button.dataset.value;
  button.classList.toggle('filter-selected',selected);
  button.setAttribute('aria-pressed',String(selected));
 });
}
function apply(k,v){state[k]=v;page=1;paperId=null;$('#paper-dialog').close();render();sync();$('#search').scrollIntoView();}
function sync(mode='push'){
 for(const k of keys){const el=$(k==='coverage'?'#coverage-filter':'#'+k);if(el){if(el.type==='checkbox')el.checked=state[k];else el.value=state[k];}}
 const params=new URLSearchParams();
 for(const k of keys)if(state[k]&&!(k==='sort'&&state[k]==='selected')&&!(k==='size'&&state[k]==='50'))params.set(k,state[k]);
 if(page>1)params.set('page',page);
 if(paperId)params.set('paper',paperId);
 const url=location.pathname+(params.size?'?'+params:'')+location.hash;
 if(mode==='push'&&url!==location.pathname+location.search+location.hash){
  history.replaceState({...history.state,scrollY:window.scrollY},'');
  history.pushState({scrollY:window.scrollY},'',url);
 }else if(mode==='replace')history.replaceState({...history.state,scrollY:window.scrollY},'',url);
 highlightFilters();
}
function readLocation(){
 const params=new URLSearchParams(location.search);state=defaults();
 for(const k of keys)if(params.has(k))state[k]=k==='saved'?params.get(k)==='true':params.get(k);
 if(!['all','20','50','100'].includes(state.size))state.size='50';
 page=Math.max(1,Number.parseInt(params.get('page'),10)||1);
 paperId=byId[params.get('paper')]?params.get('paper'):null;
}
function restoreLocation(event){
 if(!D)return;
 restoringHistory=true;
 readLocation();
 if(!paperId)$('#paper-dialog').close();
 render();sync('none');
 if(paperId)openPaper(paperId,false);
 const y=event.state?.scrollY;
 requestAnimationFrame(()=>{if(Number.isFinite(y))window.scrollTo({top:y,behavior:'instant'});else scrollToSection(location.hash);restoringHistory=false;updateSectionNavigation();});
}
function updateSectionNavigation(){
 document.querySelectorAll('aside a[href^="#"]').forEach(a=>{
  if(a.hash===(location.hash||'#overview'))a.setAttribute('aria-current','location');
  else a.removeAttribute('aria-current');
 });
}
function scrollToSection(hash){
 const target=document.getElementById((hash||'#overview').slice(1));
 if(target)target.scrollIntoView({behavior:'instant',block:'start'});
}
// Own section navigation so native hash popstate cannot reset the scroll to zero.
document.addEventListener('click',event=>{
 const a=event.target.closest('a[href^="#"]');
 if(!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 if(!document.getElementById(a.hash.slice(1)))return;
 event.preventDefault();
 history.replaceState({...history.state,scrollY:window.scrollY},'');
 if(location.hash!==a.hash)history.pushState({},'',location.pathname+location.search+a.hash);
 scrollToSection(a.hash);
 history.replaceState({...history.state,scrollY:window.scrollY},'');
 updateSectionNavigation();
});
history.scrollRestoration='manual';
window.addEventListener('popstate',restoreLocation);
window.addEventListener('scroll',()=>{if(!restoringHistory)history.replaceState({...history.state,scrollY:window.scrollY},'');},{passive:true});
function closePaper(){if(!paperId)return;paperId=null;$('#paper-dialog').close();sync();}
function match(p){const q=state.q.toLowerCase().trim();return (!q||q.split(/\s+/).every(t=>p.searchText.includes(t)))&&(!state.type||p.presentation_type===state.type)&&(!state.day||p.dates.includes(state.day))&&(!state.session||p.sessions.includes(state.session))&&(!state.topic||state.topic in p.tags)&&(!state.author||p.authors.includes(state.author))&&(!state.institution||p.institutions.includes(state.institution))&&(!state.track||p.track===state.track)&&(!state.location||p.locations.includes(state.location))&&(!state.coverage||p.coverage===state.coverage)&&(!state.saved||saved.has(p.id))&&(!state.resource||(state.resource==='missing'?!p.abstract:!!p[state.resource]?.length));}
function render(){filtered=D.papers.filter(match);if(state.sort==='title')filtered.sort((a,b)=>a.title.localeCompare(b.title));if(state.sort==='selected')filtered.sort((a,b)=>['Oral','Spotlight','Poster only'].indexOf(a.presentation_type)-['Oral','Spotlight','Poster only'].indexOf(b.presentation_type)||a.index-b.index);const pageSize=state.size==='all'?Math.max(1,filtered.length):Number(state.size);const n=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,n);$('#result-count').textContent=`${filtered.length} / ${D.papers.length} papers · Page ${page} of ${n}`;$('#active').innerHTML=keys.filter(k=>state[k]&&!['sort','size'].includes(k)).map(k=>`<button class="chip filter-selected" data-remove="${k}">${esc(k)}: ${esc(k==='topic'?D.topics.find(t=>t.id===state[k])?.label:state[k])} ×</button>`).join('');$('#results').innerHTML=filtered.slice((page-1)*pageSize,page*pageSize).map(p=>`<article class="paper"><div class="paper-top"><span class="badge ${p.presentation_type}">${esc(p.presentation_type)}</span>${p.session?chip('session',p.session):''}<button class="save" data-save="${p.id}" aria-label="${saved.has(p.id)?'Unsave':'Save'} paper" aria-pressed="${saved.has(p.id)}">${saved.has(p.id)?'★':'☆'}</button></div><button class="paper-title" data-paper="${p.id}">${esc(p.title)}</button><div class="authors">${p.authors.length?names(p,'authors'):'<small class="muted">Authors not yet verified</small>'}</div><div class="institutions">${names(p,'institutions')}</div><div class="schedule">${schedule(p)}</div><div class="chips">${Object.keys(p.tags).map(k=>chip('topic',k,D.topics.find(t=>t.id===k).label)).join('')}</div><div class="resources">${resourceLinks(p)}<button class="text-chip" data-paper="${p.id}">${p.abstract?'Read abstract':'Details / sources'}</button></div></article>`).join('')||'<div class="callout">No papers match. Try removing a filter.</div>';$('#pagination').hidden=n===1;$('#pagination').innerHTML=`<button data-page="${page-1}" ${page===1?'disabled':''}>← Previous</button><span>${page} / ${n}</span><button data-page="${page+1}" ${page===n?'disabled':''}>Next →</button>`;highlightFilters();}
function openPaper(id,record=true){const p=byId[id];if(!p)return;$('#paper-detail').innerHTML=`<span class="badge ${p.presentation_type}">${esc(p.presentation_type)}</span><h2>${esc(p.title)}</h2>${p.matched_title&&p.matched_title!==p.title?`<p class="muted">External title: ${esc(p.matched_title)}</p>`:''}<div>${names(p,'authors')||'Authors not yet verified'}</div><div>${names(p,'institutions')}</div><div class="resources">${resourceLinks(p)}</div><div class="schedule">${schedule(p)}</div><div class="abstract-heading"><h3>Abstract</h3><div class="abstract-controls" role="group" aria-label="Abstract text size"><span>Text size</span><button type="button" data-abstract-size="-1" aria-label="Decrease abstract text size">−</button><output id="abstract-size-value" aria-live="polite"></output><button type="button" data-abstract-size="1" aria-label="Increase abstract text size">+</button><button type="button" data-abstract-size="reset">Reset</button></div></div><div class="abstract" id="abstract-content">${AbstractMarkup.render(p.abstract||'No abstract was verified in this collection. Please check OpenReview and the external resource links.')}</div><p>${link(p.abstract_source||p.metadata_source,'Abstract / metadata source')}${p.author_source?' · '+link(p.author_source,'Author source'):''}</p>${p.identity_note?`<p>${esc(p.identity_note)}</p>`:''}<h3>Title-derived tags</h3><div class="chips">${Object.entries(p.tags).map(([k,v])=>chip('topic',k,D.topics.find(t=>t.id===k).label+' · '+v.join(', '))).join('')||'<small>No title keyword match</small>'}</div><details><summary>Institution evidence & source</summary><p>Affiliations are recorded at paper level, not assigned to individual authors.</p><p class="evidence">${esc(p.affiliations||p.affiliation_byline||'No verified affiliation text')}</p><p>${link(p.institution_source||p.affiliation_source,'Affiliation source')}</p><p class="evidence">${esc(JSON.stringify(p.institution_evidence,null,2))}</p></details>`;applyAbstractSize();if(document.querySelector('#abstract-content .math-fallback,#abstract-content .source-macro')){const note=document.createElement('p');note.className='muted';note.textContent='Some source formulas or macros are incomplete; their original text is preserved.';document.querySelector('#abstract-content').after(note);}if(!$('#paper-dialog').open)$('#paper-dialog').showModal();paperId=id;if(record)sync();else highlightFilters();}

function ranking(key,query=''){const m=new Map();D.papers.forEach(p=>new Set(p[key]).forEach(n=>m.set(n,(m.get(n)||0)+1)));return [...m].filter(([n])=>n.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,100).map(([n,c])=>`<button data-filter="${key==='authors'?'author':'institution'}" data-value="${esc(n)}"><span>${esc(n)}</span><b>${c}</b></button>`).join('')||'No match';}
function download(name,text,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob(['\ufeff',text],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function loadData(){const r=await fetch('data.json.gz?v=20261019-neurips');if(!r.ok)throw Error('Data HTTP '+r.status);if(typeof DecompressionStream!=='undefined'){return JSON.parse(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text());}throw Error('This browser needs gzip decompression support. Please use a current browser.');}

function uniqueOfficialData(data) {
 const normalize=s=>String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
 const groups=[],titles=new Map(),forums=new Map();
 const rank=p=>({'Oral':0,'Spotlight':1,'Poster only':2}[p.presentation_type]??3);
 for(const paper of data.papers.filter(p=>p.coverage==='Current official listing')){
  const title=normalize(paper.title);
  let forum='';try{forum=new URL(paper.openreview).searchParams.get('id')||'';}catch{}
  const matches=[titles.get(title),forum?forums.get(forum):undefined].filter(g=>g);
  const group=matches[0]||{papers:[]};
  if(!matches.length)groups.push(group);
  for(const other of new Set(matches.slice(1)))if(other!==group){
   group.papers.push(...other.papers);other.papers=[];
   for(const [key,value] of titles)if(value===other)titles.set(key,group);
   for(const [key,value] of forums)if(value===other)forums.set(key,group);
  }
  group.papers.push(paper);titles.set(title,group);if(forum)forums.set(forum,group);
 }
 const papers=groups.filter(g=>g.papers.length).map(g=>{
  const entries=[...g.papers].sort((a,b)=>rank(a)-rank(b)),p={...entries[0]};
  for(const key of ['authors','institutions','locations','sessions','dates','project','code'])
   p[key]=[...new Set(entries.flatMap(e=>e[key]||[]))];
  p.tags=Object.fromEntries([...new Set(entries.flatMap(e=>Object.keys(e.tags||{})))].map(k=>[k,[...new Set(entries.flatMap(e=>e.tags?.[k]||[]))]]));
  p.aliasIds=entries.map(e=>e.id);
  for(const key of ['abstract','pdf','openreview','arxiv','supplementary'])
   if(!p[key])p[key]=entries.find(e=>e[key])?.[key]||'';
  return p;
 });
 const topics=data.topics.map(t=>({...t,...Object.fromEntries(['All','Oral','Spotlight','Poster only'].map(c=>{
  const cohort=papers.filter(p=>c==='All'||p.presentation_type===c),count=cohort.filter(p=>t.id in p.tags).length;
  return [c,{count,total:cohort.length,percent:cohort.length?100*count/cohort.length:0}];
 }))}));
 const sessions=data.sessions.map(s=>({...s,count:papers.filter(p=>p.sessions.includes(s.label)).length})).filter(s=>s.count);
 return {...data,papers,topics,sessions};
}
function refreshResearch(research,data) {
 return {...research,insights:research.insights.map(x=>{
  const topic=data.topics.find(t=>t.label===x.title);if(!topic)return x;
  const a=topic.All,o=topic.Oral,s=topic.Spotlight;
  return {...x,summary:`${a.count.toLocaleString('en-US')} titles match this rule (${a.percent.toFixed(1)}% of the collection). Oral: ${o.count}/${o.total}; Spotlight: ${s.count}/${s.total}. These are overlapping title-keyword counts, not year-over-year trends or a measure of research quality.`,
   examples:data.papers.filter(p=>topic.id in p.tags).sort((a,b)=>['Oral','Spotlight','Poster only'].indexOf(a.presentation_type)-['Oral','Spotlight','Poster only'].indexOf(b.presentation_type)).slice(0,3).map(p=>({id:p.id,title:p.title,session:p.presentation_type,why:'Matched terms: '+p.tags[topic.id].join(', ')}))};
 }),methodology:[
 'Snapshot: 19 October 2026. This explorer shows '+data.papers.length.toLocaleString('en-US')+' unique papers from the current official listing. Earlier-only records are excluded from browsing and statistics.',
 'Each paper appears once. Matching normalized titles or OpenReview forum IDs are merged; presentation labels use Oral, then Spotlight, then Poster priority. Sessions and resource links are retained. This is not a certified final acceptance count.',
 ...research.methodology.slice(2).filter(t=>!t.includes('union')).map(t=>t.replace('abstracts and earlier-only records','abstracts').replace('Source status is shown per paper and can be filtered.','Earlier-only records remain in the archived source files.'))
 ]};
}

async function init(){[D,R]=await Promise.all([loadData(),fetch('research.json?v=20261019-neurips').then(r=>r.json())]);D=uniqueOfficialData(D);R=refreshResearch(R,D);document.querySelector('aside a[href="#search"] span').textContent=D.papers.length;D.papers.forEach(p=>{for(const id of p.aliasIds)byId[id]=p;byId[p.id]=p;p.searchText=[p.title,p.abstract,...p.authors,...p.institutions,...Object.keys(p.tags).map(k=>D.topics.find(t=>t.id===k)?.label)].join(' ').toLowerCase();});readLocation();$('#stats').innerHTML=[['',D.papers.length,'Unique official papers'],...['Oral','Spotlight','Poster only'].map(c=>[c,D.papers.filter(p=>p.presentation_type===c).length,c])].map(([v,n,l])=>`<button class="stat" data-filter="type" data-value="${v}"><b>${n.toLocaleString('en-US')}</b><span>${l}</span></button>`).join('');$('#coverage').textContent=`Metadata coverage · Abstracts ${D.papers.filter(p=>p.abstract).length}/${D.papers.length} · Authors ${D.papers.filter(p=>p.authors.length).length}/${D.papers.length} · Institutions ${D.papers.filter(p=>p.institutions.length).length}/${D.papers.length}`;
for(const [id,values] of [['day',D.papers.flatMap(p=>p.dates)],['track',D.papers.map(p=>p.track)],['location',D.papers.flatMap(p=>p.locations)]])$('#'+id).innerHTML+=[...new Set(values)].sort().map(v=>`<option>${esc(v)}</option>`).join('');
$('#insights').innerHTML=R.insights.map((x,i)=>`<article class="insight"><span class="num">0${i+1} / ${esc(x.official_sessions.join(' · '))}</span><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p>${x.examples.map(e=>`<button class="example" data-paper="${e.id}">${esc(e.title)}<small>${esc(e.session)} · ${esc(e.why)}</small></button>`).join('')}</article>`).join('');$('#comparison').innerHTML=D.topics.map(t=>`<tr><td>${chip('topic',t.id,t.label)}</td>${['All','Oral','Spotlight','Poster only'].map((c,i)=>`<td class="c${i}"><button data-compare="${t.id}" data-cohort="${c}"><b>${t[c].percent.toFixed(1)}%</b> <small>${t[c].count}/${t[c].total}</small><span class="bar" style="width:${t[c].percent*2.5}%"></span></button></td>`).join('')}</tr>`).join('');$('#rules').innerHTML=D.topics.map(t=>`<p><b>${esc(t.label)}</b><br><code>${esc(t.pattern)}</code></p>`).join('');$('#session-grid').innerHTML=D.sessions.map(s=>`<button class="session-card" data-filter="session" data-value="${esc(s.label)}"><b>${esc(s.label)}</b><span>${s.count} papers</span><small>Current official listing</small></button>`).join('');$('#session').innerHTML+=D.sessions.map(s=>`<option>${esc(s.label)}</option>`).join('');$('#topic').innerHTML+=D.topics.map(t=>`<option value="${t.id}">${esc(t.label)}</option>`).join('');$('#author-list').innerHTML=ranking('authors');$('#institution-list').innerHTML=ranking('institutions');$('#method-list').innerHTML=R.methodology.filter(t=>!t.includes('RoboTTT,')).map(t=>`<p>${esc(t)}</p>`).join('');render();sync('replace');if(paperId)openPaper(paperId,false);requestAnimationFrame(()=>{if(!paperId&&location.hash)scrollToSection(location.hash);updateSectionNavigation();});}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.filter)apply(b.dataset.filter,b.dataset.value);if(b.dataset.remove)apply(b.dataset.remove,b.dataset.remove==='saved'?false:'');if(b.dataset.paper)openPaper(b.dataset.paper);if(b.dataset.compare){state.topic=b.dataset.compare;apply('type',b.dataset.cohort==='All'?'':b.dataset.cohort);}if(b.dataset.page){page=Number(b.dataset.page);render();sync();$('#search').scrollIntoView();}if(b.dataset.save){saved.has(b.dataset.save)?saved.delete(b.dataset.save):saved.add(b.dataset.save);try{localStorage.setItem('neurips2026-saved',JSON.stringify([...saved]));}catch{}render();}});
for(const k of keys){const el=$(k==='coverage'?'#coverage-filter':'#'+k);if(el)el.addEventListener(el.tagName==='INPUT'&&el.type!=='checkbox'?'input':'change',()=>{state[k]=el.type==='checkbox'?el.checked:el.value;page=1;render();sync();});}
$('#clear').onclick=()=>{keys.filter(k=>k!=='size').forEach(k=>state[k]=k==='sort'?'selected':k==='saved'?false:'');page=1;render();sync();};$('#close-dialog').onclick=closePaper;$('#paper-dialog').addEventListener('cancel',e=>{e.preventDefault();closePaper();});$('#paper-dialog').addEventListener('close',()=>{if(paperId&&!$('#paper-dialog').open)closePaper();});$('#author-lookup').oninput=e=>{$('#author-list').innerHTML=ranking('authors',e.target.value);highlightFilters();};$('#institution-lookup').oninput=e=>{$('#institution-list').innerHTML=ranking('institutions',e.target.value);highlightFilters();};
$('#export').onclick=()=>{const cols=['id','title','presentation_type','session','topic','presentation_day','presentation_date','presentation_time','poster_session','poster_day','poster_date','poster_time','poster_number','track','locations','coverage','official','authors','institutions','abstract','pdf','supplementary','arxiv','openreview','project','code'];const quote=v=>'"'+String(Array.isArray(v)?v.join('; '):v??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';download('NeurIPS2026_filtered.csv',[cols,...filtered.map(p=>cols.map(k=>p[k]))].map(r=>r.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');};$('#share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('#share').textContent='Link copied ✓';setTimeout(()=>$('#share').textContent='Copy filter link',2000);}catch{$('#share').textContent='Copy URL from address bar';}};
init().catch(e=>{$('#results').textContent='Could not load the data. Please refresh the page.';console.error(e);});

for(const a of document.querySelectorAll('a[href="data.json"]'))a.addEventListener('click',e=>{e.preventDefault();if(D)download('NeurIPS2026.json',JSON.stringify({...D,papers:D.papers.map(({searchText,...p})=>p)}),'application/json');});

let abstractFontSize=18;
try{const stored=Number(localStorage.getItem('neurips2026-abstract-size'));if(stored>=14&&stored<=30)abstractFontSize=stored;}catch{}
function applyAbstractSize(){
 const content=document.querySelector('#abstract-content');if(!content)return;
 content.style.fontSize=abstractFontSize+'px';
 document.querySelector('#abstract-size-value').textContent=abstractFontSize+' px';
 document.querySelector('[data-abstract-size="-1"]').disabled=abstractFontSize<=14;
 document.querySelector('[data-abstract-size="1"]').disabled=abstractFontSize>=30;
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-abstract-size]');if(!button)return;
 abstractFontSize=button.dataset.abstractSize==='reset'?18:Math.max(14,Math.min(30,abstractFontSize+2*Number(button.dataset.abstractSize)));
 try{localStorage.setItem('neurips2026-abstract-size',String(abstractFontSize));}catch{}
 applyAbstractSize();
});
