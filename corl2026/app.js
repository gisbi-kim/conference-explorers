'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let D,R,page=1,filtered=[],state={q:'',type:'',day:'',session:'',topic:'',resource:'',sort:'selected',size:'all',author:'',institution:'',saved:false},saved=new Set();
try{saved=new Set(JSON.parse(localStorage.getItem('corl2026-saved')||'[]'));}catch{}
const keys=Object.keys(state);const byId={};
const link=(u,t)=>/^https?:\/\//.test(u||'')?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)} ↗</a>`:'';
function arxivTitle(p,className=''){
 const title=esc(p.title),url=p.arxiv||'';
 return /^https:\/\/arxiv\.org\/abs\/\d{4}\.\d{4,5}(?:v\d+)?$/.test(url)
  ? `<a class="${esc(className)}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${title}</a>`
  : className?`<button class="${esc(className)}" data-paper="${esc(p.id)}">${title}</button>`:title;
}
function chip(k,v,label=v){return `<button class="chip" data-filter="${k}" data-value="${esc(v)}">${esc(label)}</button>`}
function resourceLinks(p){return [link(p.openreview,'OpenReview'),link(p.arxiv,'arXiv'),link(p.pdf,'PDF'),link(p.supplementary,'Supplement'),...(p.project||[]).map((u,i)=>link(u,'Project'+(i?' '+(i+1):''))),...(p.code||[]).map((u,i)=>link(u,'Code'+(i?' '+(i+1):'')))].filter(Boolean).join(' ')}
function names(p,key){return (p[key]||[]).map(v=>`<button class="text-chip" data-filter="${key==='authors'?'author':'institution'}" data-value="${esc(v)}">${esc(v)}</button>`).join(' <span class="muted">·</span> ')}
function schedule(p){return `${p.session?`${esc(p.session)} · ${esc(p.topic)}<br>${esc(p.presentation_day)} ${esc(p.presentation_date)} · ${esc(p.presentation_time)} · ${esc(p.presentation_venue)}<br>`:''}${esc(p.poster_session)} · ${esc(p.poster_day)} ${esc(p.poster_date)} · ${esc(p.poster_time)} · ${esc(p.poster_venue)} · Poster #${p.poster_number}`}
let paperId=null,restoringHistory=false;
const defaults=()=>({q:'',type:'',day:'',session:'',topic:'',resource:'',sort:'selected',size:'all',author:'',institution:'',saved:false});
function highlightFilters(){
 document.querySelectorAll('[data-filter]').forEach(button=>{
  const selected=!!state[button.dataset.filter]&&state[button.dataset.filter]===button.dataset.value;
  button.classList.toggle('filter-selected',selected);
  button.setAttribute('aria-pressed',String(selected));
 });
}
function apply(k,v){state[k]=v;page=1;paperId=null;$('#paper-dialog').close();render();sync();$('#search').scrollIntoView();}
function sync(mode='push'){
 for(const k of keys){const el=$('#'+k);if(el){if(el.type==='checkbox')el.checked=state[k];else el.value=state[k];}}
 const params=new URLSearchParams();
 for(const k of keys)if(state[k]&&!(k==='sort'&&state[k]==='selected')&&!(k==='size'&&state[k]==='all'))params.set(k,state[k]);
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
 if(!['all','20','50','100'].includes(state.size))state.size='all';
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
function match(p){const q=state.q.toLowerCase().trim();const text=[p.title,p.abstract,...p.authors,...p.institutions,p.topic,...Object.keys(p.tags).map(k=>D.topics.find(t=>t.id===k)?.label)].join(' ').toLowerCase();return (!q||q.split(/\s+/).every(t=>text.includes(t)))&&(!state.type||p.presentation_type===state.type)&&(!state.day||p.poster_day===state.day||p.presentation_day===state.day)&&(!state.session||p.session===state.session||p.poster_session===state.session)&&(!state.topic||state.topic in p.tags)&&(!state.author||p.authors.includes(state.author))&&(!state.institution||p.institutions.includes(state.institution))&&(!state.saved||saved.has(p.id))&&(!state.resource||(state.resource==='missing'?!p.abstract:!!p[state.resource]?.length));}
function render(){filtered=D.papers.filter(match);if(state.sort==='title')filtered.sort((a,b)=>a.title.localeCompare(b.title));if(state.sort==='selected')filtered.sort((a,b)=>['Oral','Spotlight','Poster only'].indexOf(a.presentation_type)-['Oral','Spotlight','Poster only'].indexOf(b.presentation_type)||a.index-b.index);const pageSize=state.size==='all'?Math.max(1,filtered.length):Number(state.size);const n=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,n);$('#result-count').textContent=`${filtered.length} / 687 papers · Page ${page} of ${n}`;$('#active').innerHTML=keys.filter(k=>state[k]&&!['sort','size'].includes(k)).map(k=>`<button class="chip filter-selected" data-remove="${k}">${esc(k)}: ${esc(k==='topic'?D.topics.find(t=>t.id===state[k])?.label:state[k])} ×</button>`).join('');$('#results').innerHTML=filtered.slice((page-1)*pageSize,page*pageSize).map(p=>`<article class="paper"><div class="paper-top"><span class="badge ${p.presentation_type}">${esc(p.presentation_type)}</span>${p.session?chip('session',p.session):''}<button class="save" data-save="${p.id}" aria-label="${saved.has(p.id)?'Unsave':'Save'} paper" aria-pressed="${saved.has(p.id)}">${saved.has(p.id)?'★':'☆'}</button></div>${arxivTitle(p,'paper-title')}<div class="authors">${p.authors.length?names(p,'authors'):'<small class="muted">Authors not yet verified</small>'}</div><div class="institutions">${names(p,'institutions')}</div><div class="schedule">${schedule(p)}</div><div class="chips">${Object.keys(p.tags).map(k=>chip('topic',k,D.topics.find(t=>t.id===k).label)).join('')}</div><div class="resources">${resourceLinks(p)}<button class="text-chip" data-paper="${p.id}">${p.abstract?'Read abstract':'Details / sources'}</button></div></article>`).join('')||'<div class="callout">No papers match. Try removing a filter.</div>';$('#pagination').hidden=n===1;$('#pagination').innerHTML=`<button data-page="${page-1}" ${page===1?'disabled':''}>← Previous</button><span>${page} / ${n}</span><button data-page="${page+1}" ${page===n?'disabled':''}>Next →</button>`;highlightFilters();}
function openPaper(id,record=true){const p=byId[id];if(!p)return;$('#paper-detail').innerHTML=`<span class="badge ${p.presentation_type}">${esc(p.presentation_type)}</span><h2>${arxivTitle(p)}</h2>${p.matched_title&&p.matched_title!==p.title?`<p class="muted">External title: ${esc(p.matched_title)}</p>`:''}<div>${names(p,'authors')||'Authors not yet verified'}</div><div>${names(p,'institutions')}</div><div class="resources">${resourceLinks(p)}</div><div class="schedule">${schedule(p)}</div><h3>Abstract</h3><p class="abstract">${esc(p.abstract||'No abstract was verified in this collection. Please check OpenReview and the external resource links.')}</p><p>${link(p.abstract_source||p.metadata_source,'Abstract / metadata source')}${p.author_source?' · '+link(p.author_source,'Author source'):''}</p>${p.identity_note?`<p>${esc(p.identity_note)}</p>`:''}<h3>Title-derived tags</h3><div class="chips">${Object.entries(p.tags).map(([k,v])=>chip('topic',k,D.topics.find(t=>t.id===k).label+' · '+v.join(', '))).join('')||'<small>No title keyword match</small>'}</div><details><summary>Institution evidence & source</summary><p>Affiliations are recorded at paper level, not assigned to individual authors.</p><p class="evidence">${esc(p.affiliations||p.affiliation_byline||'No verified affiliation text')}</p><p>${link(p.institution_source||p.affiliation_source,'Affiliation source')}</p><p class="evidence">${esc(JSON.stringify(p.institution_evidence,null,2))}</p></details>`;if(!$('#paper-dialog').open)$('#paper-dialog').showModal();paperId=id;if(record)sync();else highlightFilters();}

function ranking(key,query=''){const m=new Map();D.papers.forEach(p=>new Set(p[key]).forEach(n=>m.set(n,(m.get(n)||0)+1)));return [...m].filter(([n])=>n.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,100).map(([n,c])=>`<button data-filter="${key==='authors'?'author':'institution'}" data-value="${esc(n)}"><span>${esc(n)}</span><b>${c}</b></button>`).join('')||'No match';}
function download(name,text,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob(['\ufeff',text],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function init(){[D,R]=await Promise.all([fetch('data.json?v=20261023-arxiv').then(r=>r.json()),fetch('research.json?v=20261018-openreview').then(r=>r.json())]);D.papers.forEach(p=>byId[p.id]=p);readLocation();$('#stats').innerHTML=[['',687,'Accepted papers'],['Oral',21,'Oral · 7 sessions'],['Spotlight',72,'Spotlight · 8 sessions'],['Poster only',594,'Poster only']].map(([v,n,l])=>`<button class="stat" data-filter="type" data-value="${v}"><b>${n}</b><span>${l}</span></button>`).join('');$('#coverage').textContent=`Public metadata coverage · Abstracts ${D.papers.filter(p=>p.abstract).length}/687 · Authors ${D.papers.filter(p=>p.authors.length).length}/687 · Institutions ${D.papers.filter(p=>p.institutions.length).length}/687 · arXiv ${D.papers.filter(p=>p.arxiv).length}/687`;
$('#insights').innerHTML=R.insights.map((x,i)=>`<article class="insight"><span class="num">0${i+1} / ${esc(x.official_sessions.join(' · '))}</span><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p>${x.examples.map(e=>`<button class="example" data-paper="${e.id}">${esc(e.title)}<small>${esc(e.session)} · ${esc(e.why)}</small></button>`).join('')}</article>`).join('');$('#comparison').innerHTML=D.topics.map(t=>`<tr><td>${chip('topic',t.id,t.label)}</td>${['All','Oral','Spotlight','Poster only'].map((c,i)=>`<td class="c${i}"><button data-compare="${t.id}" data-cohort="${c}"><b>${t[c].percent.toFixed(1)}%</b> <small>${t[c].count}/${t[c].total}</small><span class="bar" style="width:${t[c].percent*2.5}%"></span></button></td>`).join('')}</tr>`).join('');$('#rules').innerHTML=D.topics.map(t=>`<p><b>${esc(t.label)}</b><br><code>${esc(t.pattern)}</code></p>`).join('');$('#session-grid').innerHTML=D.sessions.map(s=>`<button class="session-card" data-filter="session" data-value="${esc(s.label)}"><b>${esc(s.label)} · ${D.presentations.filter(p=>p.session_id===s.session_id).length} papers</b><span>${esc(s.topic||'All topics')}</span><small>${esc(s.day)} · ${esc(s.date)}<br>${esc(s.time)} · ${esc(s.venue)}</small></button>`).join('');$('#session').innerHTML+=D.sessions.map(s=>`<option>${esc(s.label)}</option>`).join('');$('#topic').innerHTML+=D.topics.map(t=>`<option value="${t.id}">${esc(t.label)}</option>`).join('');$('#author-list').innerHTML=ranking('authors');$('#institution-list').innerHTML=ranking('institutions');$('#method-list').innerHTML=R.methodology.filter(t=>!t.includes('RoboTTT,')).map(t=>`<p>${esc(t)}</p>`).join('');render();sync('replace');if(paperId)openPaper(paperId,false);requestAnimationFrame(()=>{if(!paperId&&location.hash)scrollToSection(location.hash);updateSectionNavigation();});}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.filter)apply(b.dataset.filter,b.dataset.value);if(b.dataset.remove)apply(b.dataset.remove,b.dataset.remove==='saved'?false:'');if(b.dataset.paper)openPaper(b.dataset.paper);if(b.dataset.compare){state.topic=b.dataset.compare;apply('type',b.dataset.cohort==='All'?'':b.dataset.cohort);}if(b.dataset.page){page=Number(b.dataset.page);render();sync();$('#search').scrollIntoView();}if(b.dataset.save){saved.has(b.dataset.save)?saved.delete(b.dataset.save):saved.add(b.dataset.save);try{localStorage.setItem('corl2026-saved',JSON.stringify([...saved]));}catch{}render();}});
for(const k of keys){const el=$('#'+k);if(el)el.addEventListener(el.tagName==='INPUT'&&el.type!=='checkbox'?'input':'change',()=>{state[k]=el.type==='checkbox'?el.checked:el.value;page=1;render();sync();});}
$('#clear').onclick=()=>{keys.filter(k=>k!=='size').forEach(k=>state[k]=k==='sort'?'selected':k==='saved'?false:'');page=1;render();sync();};$('#close-dialog').onclick=closePaper;$('#paper-dialog').addEventListener('cancel',e=>{e.preventDefault();closePaper();});$('#paper-dialog').addEventListener('close',()=>{if(paperId&&!$('#paper-dialog').open)closePaper();});$('#author-lookup').oninput=e=>{$('#author-list').innerHTML=ranking('authors',e.target.value);highlightFilters();};$('#institution-lookup').oninput=e=>{$('#institution-list').innerHTML=ranking('institutions',e.target.value);highlightFilters();};
$('#export').onclick=()=>{const cols=['id','title','presentation_type','session','topic','presentation_day','presentation_date','presentation_time','poster_session','poster_day','poster_date','poster_time','poster_number','authors','institutions','abstract','pdf','supplementary','arxiv','openreview','project','code'];const quote=v=>'"'+String(Array.isArray(v)?v.join('; '):v??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';download('CoRL2026_filtered.csv',[cols,...filtered.map(p=>cols.map(k=>p[k]))].map(r=>r.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');};$('#share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('#share').textContent='Link copied ✓';setTimeout(()=>$('#share').textContent='Copy filter link',2000);}catch{$('#share').textContent='Copy URL from address bar';}};
init().catch(e=>{$('#results').textContent='Could not load the data. Please refresh the page.';console.error(e);});
