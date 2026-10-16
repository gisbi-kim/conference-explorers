'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data,papers,filtered=[],page=1,author='',bookmarks=new Set();
try{const saved=JSON.parse(localStorage.getItem('ssrr2026-saved')||'[]');if(Array.isArray(saved))bookmarks=new Set(saved);}catch{}
const controls=['q','session','day','topic','award','sort'];
const sessionOf=p=>data.sessions.find(s=>s.id===p.session);
const count=(items,key)=>items.reduce((m,p)=>{const vals=key(p);for(const v of Array.isArray(vals)?vals:[vals])m[v]=(m[v]||0)+1;return m;},{});
const bar=(label,n,total,attrs)=>`<button class="bar" style="--width:${n/total*100}%" ${attrs}><b>${n} · ${(n/total*100).toFixed(1)}%</b>${esc(label)}</button>`;
function applyParams(){const params=new URLSearchParams(location.search);controls.forEach(k=>{$(k).value=params.get(k)|| (k==='sort'?'programme':'');});$('saved').checked=params.get('saved')==='1';author=params.get('author')||'';}
function sync(){const params=new URLSearchParams();controls.forEach(k=>{if($(k).value && !(k==='sort'&&$(k).value==='programme'))params.set(k,$(k).value);});if(author)params.set('author',author);if($('saved').checked)params.set('saved','1');history.replaceState(null,'',location.pathname+(params.size?'?'+params:'')+location.hash);}
function reset(){controls.forEach(k=>$(k).value=k==='sort'?'programme':'');$('saved').checked=false;author='';}
function focusFilter(key,value){reset();if(key==='author')author=value;else $(key).value=value;page=1;render();location.hash='finder';}
function render(){
 const q=$('q').value.trim().toLocaleLowerCase(),sid=$('session').value,day=$('day').value,topic=$('topic').value,award=$('award').value;
 filtered=papers.filter(p=>(!q||[p.id,p.title,...p.authors].join(' ').toLocaleLowerCase().includes(q))&&(!sid||p.session===Number(sid))&&(!day||sessionOf(p).date===day)&&(!topic||p.topics.includes(topic))&&(!award||p.awardFinalist===(award==='yes'))&&(!author||p.authors.includes(author))&&(!$('saved').checked||bookmarks.has(p.id)));
 if($('sort').value==='title')filtered.sort((a,b)=>a.title.localeCompare(b.title));if($('sort').value==='authors')filtered.sort((a,b)=>b.authors.length-a.authors.length);
 const pages=Math.max(1,Math.ceil(filtered.length/12));page=Math.max(1,Math.min(page,pages));
 $('resultCount').textContent=`${filtered.length} / ${papers.length} papers`;
 $('authorFilter').textContent=author?'Author filter: '+author:'';
 $('results').innerHTML=filtered.slice((page-1)*12,page*12).map(p=>`<article class="paper"><div><small>#${p.id} · ${esc(sessionOf(p).schedule)}${p.awardFinalist?' · ★ Award finalist':''}</small><h3><button class="title-button" data-paper="${p.id}">${esc(p.title)}</button></h3><p>${esc(p.authors.join(', '))}</p><p>Session ${p.session} · ${esc(sessionOf(p).title)}</p>${p.topics.map(t=>`<button class="tag" data-topic="${esc(t)}">${esc(t)}</button>`).join('')}</div><button class="bookmark" data-save="${p.id}" aria-pressed="${bookmarks.has(p.id)}" aria-label="${esc(p.title)} Save">${bookmarks.has(p.id)?'★ Saved':'☆ Save'}</button></article>`).join('')||'<div class="panel">No papers match. Try another query or clear the filters.</div>';
 $('pageInfo').textContent=`${page} / ${pages}`;$('prev').disabled=page===1;$('next').disabled=page===pages;sync();
}
function detail(id){const p=papers.find(p=>p.id===id);if(!p)return;const s=sessionOf(p),title=encodeURIComponent('"'+p.title+'"');
 $('detailBody').innerHTML=`<p class="eyebrow">PAPER #${p.id}${p.awardFinalist?' · AWARD FINALIST':''}</p><h2>${esc(p.title)}</h2><p>${p.authors.map(a=>`<button class="tag" data-author="${esc(a)}">${esc(a)}</button>`).join('')}</p><p><strong>Session ${s.id} · ${esc(s.title)}</strong><br>${esc(s.schedule)} · KST (UTC+9)</p><p>${p.topics.map(t=>`<button class="tag" data-topic="${esc(t)}">${esc(t)}</button>`).join('')||'No title-derived tags'}</p><p class="muted">The supplied programme does not include abstracts, affiliations or verified full-text links. The links below search externally using the paper title.</p><div class="actions"><a class="button" href="https://scholar.google.com/scholar?q=${title}" target="_blank" rel="noopener">Search Google Scholar ↗</a><a class="button" href="https://www.google.com/search?q=${title}" target="_blank" rel="noopener">Search the web ↗</a></div><p class="muted">Source: supplied SSRR 2026 accepted-papers programme · 16 Oct 2026</p><a href="source-programme.txt">Source programme</a>`;
 if(!$('detail').open)$('detail').showModal();
}
function csvExport(){const rows=[['ID','Title','Authors','Session','Date','Session start (KST)','Award finalist','Topics'],...filtered.map(p=>[p.id,p.title,p.authors.join('; '),sessionOf(p).title,sessionOf(p).date,sessionOf(p).schedule.split(', ')[1],p.awardFinalist,p.topics.join('; ')])];const safe=v=>{let s=String(v);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='SSRR2026-filtered.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function dashboard(){
 const authors=count(papers,p=>p.authors),topics=count(papers,p=>p.topics),finalists=papers.filter(p=>p.awardFinalist),ft=count(finalists,p=>p.topics);
 $('stats').innerHTML=[[papers.length,'Programme papers'],[data.sessions.length,'Official sessions'],[finalists.length,'Award finalists'],[Object.keys(authors).length,'Unique author names']].map(([n,l])=>`<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('');
 $('sessionChart').innerHTML=data.sessions.map(s=>bar(`S${s.id} · ${s.title}`,papers.filter(p=>p.session===s.id).length,papers.length,`data-session="${s.id}"`)).join('');
 $('topicChart').innerHTML=Object.entries(topics).sort((a,b)=>b[1]-a[1]).map(([t,n])=>bar(t,n,papers.length,`data-topic="${esc(t)}"`)).join('');
 $('comparison').innerHTML='<table><thead><tr><th>Title-derived topic</th><th>All · 46</th><th>Finalists · 6</th></tr></thead><tbody>'+data.topics.map(t=>`<tr><td>${esc(t.name)}</td><td><button data-topic="${esc(t.name)}">${topics[t.name]||0} · ${((topics[t.name]||0)/46*100).toFixed(1)}%</button></td><td><button data-topic="${esc(t.name)}" data-finalists="yes">${ft[t.name]||0} · ${((ft[t.name]||0)/6*100).toFixed(1)}%</button></td></tr>`).join('')+'</tbody></table>';
 $('dayChart').innerHTML=Object.entries(count(papers,p=>sessionOf(p).date)).map(([day,n])=>bar(day,n,46,`data-day="${day}"`)).join('');
 const teams=count(papers,p=>p.authors.length<=3?'1–3 authors':p.authors.length<=6?'4–6 authors':p.authors.length<=9?'7–9 authors':'10+ authors');
 $('teamChart').innerHTML=['1–3 authors','4–6 authors','7–9 authors','10+ authors'].map(label=>`<div class="bar" style="--width:${(teams[label]||0)/46*100}%"><b>${teams[label]||0}</b>${label}</div>`).join('');
 $('sessionCards').innerHTML=data.sessions.map(s=>`<article class="session-card"><small>SESSION ${s.id} · ${esc(s.schedule)}</small><h3>${esc(s.title)}</h3><button data-session="${s.id}">${papers.filter(p=>p.session===s.id).length} papers →</button></article>`).join('');
 const insights=[['01 · Teams that coordinate','Coordinating heterogeneous robot teams','Session 2 brings together multi-robot coordination and task allocation. Uncertainty-aware allocation, decentralized flocking and UAV–UGV collaboration represent different approaches.',[34,63,30]],['02 · Language meets field robotics','Language for perception and manipulation','Papers address natural-language team commands, language-guided grasping and vision-language models for drone imagery. These applications are identified from titles; evaluating performance requires reading the papers.',[7,25,57]],['03 · Resilience beyond autonomy','Mapping and communications for resilient operations','Session 4 combines localization and mapping with resilient communications. Distributed SLAM, 6G multi-network architectures and mesh network planning offer complementary reading paths.',[17,16,85]],['04 · Care in difficult environments','Robots and devices for medical response','Session 3 includes risk mapping for patient transport, airway-management workflows and hemorrhage-control devices. These papers offer a starting point for comparing mission-specific requirements.',[67,22,73]],['05 · Seeing disaster scenes','Diverse sensing approaches for disaster assessment','Reducing duplicate detections in drone imagery, combining LiDAR–RGB–thermal data and deploying seismic sensors address different disaster-observation challenges.',[87,66,52]],['06 · Extreme operating conditions','Security, demining and nuclear / CBRN response','Sessions 6–7 cover drone threat assessment, landmine reconstruction, radiation-guided exploration and decontamination. Explore these papers by operating environment and mission.',[77,53,79,33]]];
 $('insights').innerHTML=insights.map(([n,h,t,ids])=>`<article class="insight"><p class="eyebrow">${n}</p><h3>${h}</h3><p>${t}</p>${ids.map(id=>`<button data-paper="${id}" title="${esc(papers.find(p=>p.id===id).title)}">#${id} ↗</button>`).join('')}</article>`).join('');
 $('rules').innerHTML=data.topics.map(t=>`<p><strong>${esc(t.name)}</strong><br><code>${esc(t.pattern)}</code></p>`).join('');
 const showAuthors=()=>{const q=$('authorSearch').value.toLocaleLowerCase();$('authorList').innerHTML=Object.entries(authors).filter(([a])=>a.toLocaleLowerCase().includes(q)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([a,n])=>`<button data-author="${esc(a)}">${esc(a)} <b>${n}</b></button>`).join('')||'No matching authors.';};showAuthors();$('authorSearch').addEventListener('input',showAuthors);
}
async function init(){try{
 const response=await fetch('data.json');if(!response.ok)throw Error(response.status);data=await response.json();papers=data.papers;
 for(const s of data.sessions)$('session').add(new Option(`S${s.id} · ${s.title}`,s.id));
 for(const day of [...new Set(data.sessions.map(s=>s.date))])$('day').add(new Option(day,day));
 for(const t of data.topics)$('topic').add(new Option(t.name,t.name));
 dashboard();applyParams();render();
 controls.forEach(k=>$(k).addEventListener(k==='q'?'input':'change',()=>{page=1;render();}));$('saved').addEventListener('change',()=>{page=1;render();});
 $('clear').onclick=()=>{reset();page=1;render();};$('export').onclick=csvExport;
 $('prev').onclick=()=>{page--;render();};$('next').onclick=()=>{page++;render();};$('close').onclick=()=>$('detail').close();
 $('share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('share').textContent='Link copied';}catch{$('share').textContent='Copy the URL from the address bar';}setTimeout(()=>$('share').textContent='Copy filter link',3000);};
 document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;
  if(el.dataset.paper)detail(Number(el.dataset.paper));
  for(const key of ['session','topic','day','author'])if(el.dataset[key]!==undefined){if($('detail').open)$('detail').close();focusFilter(key,el.dataset[key]);if(el.dataset.finalists){$('award').value='yes';render();}}
  if(el.dataset.save){const id=Number(el.dataset.save);bookmarks.has(id)?bookmarks.delete(id):bookmarks.add(id);let stored=true;try{localStorage.setItem('ssrr2026-saved',JSON.stringify([...bookmarks]));}catch{stored=false;}render();if(!stored)$('resultCount').textContent+=' · Browser storage is blocked; bookmarks will last only for this visit.';}
 });
 window.addEventListener('popstate',()=>{applyParams();page=1;render();});
 }catch(e){$('resultCount').textContent='Could not load papers. Refresh the page or download the full CSV.';console.error(e);}}
init();
