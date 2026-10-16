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
 $('authorFilter').textContent=author?'저자 필터: '+author:'';
 $('results').innerHTML=filtered.slice((page-1)*12,page*12).map(p=>`<article class="paper"><div><small>#${p.id} · ${esc(sessionOf(p).schedule)}${p.awardFinalist?' · ★ Award finalist':''}</small><h3><button class="title-button" data-paper="${p.id}">${esc(p.title)}</button></h3><p>${esc(p.authors.join(', '))}</p><p>Session ${p.session} · ${esc(sessionOf(p).title)}</p>${p.topics.map(t=>`<button class="tag" data-topic="${esc(t)}">${esc(t)}</button>`).join('')}</div><button class="bookmark" data-save="${p.id}" aria-pressed="${bookmarks.has(p.id)}" aria-label="${esc(p.title)} 저장">${bookmarks.has(p.id)?'★ 저장됨':'☆ 저장'}</button></article>`).join('')||'<div class="panel">검색 결과가 없습니다. 검색어를 바꾸거나 필터를 초기화하세요.</div>';
 $('pageInfo').textContent=`${page} / ${pages}`;$('prev').disabled=page===1;$('next').disabled=page===pages;sync();
}
function detail(id){const p=papers.find(p=>p.id===id);if(!p)return;const s=sessionOf(p),title=encodeURIComponent('"'+p.title+'"');
 $('detailBody').innerHTML=`<p class="eyebrow">PAPER #${p.id}${p.awardFinalist?' · AWARD FINALIST':''}</p><h2>${esc(p.title)}</h2><p>${p.authors.map(a=>`<button class="tag" data-author="${esc(a)}">${esc(a)}</button>`).join('')}</p><p><strong>Session ${s.id} · ${esc(s.title)}</strong><br>${esc(s.schedule)} · KST (UTC+9)</p><p>${p.topics.map(t=>`<button class="tag" data-topic="${esc(t)}">${esc(t)}</button>`).join('')||'제목 기반 태그 없음'}</p><p class="muted">초록·기관·검증된 원문 링크는 제공된 프로그램에 없습니다. 아래 링크는 제목으로 외부 검색을 수행합니다.</p><div class="actions"><a class="button" href="https://scholar.google.com/scholar?q=${title}" target="_blank" rel="noopener">Google Scholar 검색 ↗</a><a class="button" href="https://www.google.com/search?q=${title}" target="_blank" rel="noopener">웹 검색 ↗</a></div><p class="muted">출처: 제공된 SSRR 2026 Accepted papers 프로그램 · 16 Oct 2026</p><a href="source-programme.txt">프로그램 원자료</a>`;
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
 const insights=[['01 · Teams that coordinate','이종 로봇의 협력과 임무 분담','Session 2는 다중 로봇 협력과 임무 할당을 묶습니다. 불확실성을 고려한 할당, 분산 군집 제어, UAV–UGV 협력이 서로 다른 접근으로 등장합니다.',[34,63,30]],['02 · Language meets field robotics','언어 모델에서 현장 인지·조작으로','자연어로 팀을 지휘하고, 언어로 파지를 유도하며, 드론 영상에 VLM을 적용하는 논문이 있습니다. 제목에서 확인되는 적용 범위이며 실제 성능 검증은 본문 확인이 필요합니다.',[7,25,57]],['03 · Resilience beyond autonomy','지도와 통신이 함께 만드는 운용 기반','Session 4는 위치 추정·지도 작성과 통신 복원력을 함께 다룹니다. 분산 SLAM, 6G 다중 네트워크, 메시 네트워크 계획을 연결해 읽을 수 있습니다.',[17,16,85]],['04 · Care in difficult environments','의료 대응을 위한 로봇과 장치','환자 이송의 위험 지도, 기도 관리 워크플로, 출혈 제어 장치가 Session 3에 포함됩니다. 임무별 요구를 비교하기 좋은 출발점입니다.',[67,22,73]],['05 · Seeing disaster scenes','재난 인지와 데이터의 다양성','드론 영상의 중복 검출 감소, LiDAR–RGB–열화상 데이터, 지진 센서의 현장 배치가 재난 관측의 서로 다른 과제를 보여줍니다.',[87,66,52]],['06 · Extreme operating conditions','보안·지뢰 제거·핵 및 CBRN 대응','Sessions 6–7에서는 드론 위협 평가, 지뢰 재구성, 방사선 환경 탐색과 오염 제거가 다뤄집니다. 적용 환경과 임무를 기준으로 논문을 살펴볼 수 있습니다.',[77,53,79,33]]];
 $('insights').innerHTML=insights.map(([n,h,t,ids])=>`<article class="insight"><p class="eyebrow">${n}</p><h3>${h}</h3><p>${t}</p>${ids.map(id=>`<button data-paper="${id}" title="${esc(papers.find(p=>p.id===id).title)}">#${id} ↗</button>`).join('')}</article>`).join('');
 $('rules').innerHTML=data.topics.map(t=>`<p><strong>${esc(t.name)}</strong><br><code>${esc(t.pattern)}</code></p>`).join('');
 const showAuthors=()=>{const q=$('authorSearch').value.toLocaleLowerCase();$('authorList').innerHTML=Object.entries(authors).filter(([a])=>a.toLocaleLowerCase().includes(q)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([a,n])=>`<button data-author="${esc(a)}">${esc(a)} <b>${n}</b></button>`).join('')||'일치하는 저자가 없습니다.';};showAuthors();$('authorSearch').addEventListener('input',showAuthors);
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
 $('share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('share').textContent='링크 복사 완료';}catch{$('share').textContent='주소창의 URL을 복사하세요';}setTimeout(()=>$('share').textContent='필터 링크 복사',3000);};
 document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;
  if(el.dataset.paper)detail(Number(el.dataset.paper));
  for(const key of ['session','topic','day','author'])if(el.dataset[key]!==undefined){if($('detail').open)$('detail').close();focusFilter(key,el.dataset[key]);if(el.dataset.finalists){$('award').value='yes';render();}}
  if(el.dataset.save){const id=Number(el.dataset.save);bookmarks.has(id)?bookmarks.delete(id):bookmarks.add(id);let stored=true;try{localStorage.setItem('ssrr2026-saved',JSON.stringify([...bookmarks]));}catch{stored=false;}render();if(!stored)$('resultCount').textContent+=' · 브라우저 저장이 차단되어 이번 방문에만 유지됩니다.';}
 });
 window.addEventListener('popstate',()=>{applyParams();page=1;render();});
 }catch(e){$('resultCount').textContent='데이터를 불러오지 못했습니다. 새로고침하거나 전체 CSV를 다운로드하세요.';console.error(e);}}
init();
