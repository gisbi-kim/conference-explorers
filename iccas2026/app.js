'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read = (key, fallback) => {try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}};
const persist = (key, value) => {try{localStorage.setItem(key, JSON.stringify(value));return true;}catch{return false;}};
let language = read('iccas2026-language','en') === 'ko' ? 'ko' : 'en';
let dark = read('iccas2026-dark',false) === true;
const storedSaved = read('iccas2026-saved',[]);
let saved = new Set(Array.isArray(storedSaved) ? storedSaved : []);
let data, papers = [], sessionMap, authorMap, filtered = [], page = 1, scheduleDay = '2026-10-27', authorFilter = '', openPaper = '';
const pageSize = 15;
const fields = ['q','scope','day','format','keyword','session','affiliation','room','sort'];
const originalText = new Map([...document.querySelectorAll('[data-i18n]')].map(el => [el, el.textContent]));
const ko = {
 explorer:'논문 · 프로그램 탐색기',allConferences:'전체 학회 ↗',overview:'개요',findPapers:'논문 검색',research:'연구 분야',sessions:'발표 세션',people:'저자 · 소속',events:'초청 강연 · 행사',sources:'출처 · 수록 범위',officialProgramme:'공식 프로그램 ↗',snapshot:'수집 기준 · 2026년 10월 31일',sourceBadge:'공식 프로그램 · 10월 17일 갱신본',heroTitle:'제어 · 자동화 · 시스템',intro:'지능형 제어, 로보틱스, AI를 연결하는 연구를 살펴보세요. 전체 프로그램에서 논문을 검색하고 저자와 연구 분야를 따라 탐색할 수 있습니다.',explorePapers:'논문 614편 탐색 ↓',browseProgramme:'세션별 프로그램 보기',tentative:'공식 원문에 잠정 프로그램으로 표시된 자료입니다. 실제 발표 여부나 채택 통계를 의미하지 않습니다.',findNext:'관심 있는 논문을 찾아보세요.',allCSV:'전체 논문 · CSV ↓',queryLabel:'제목 · 초록 · 저자 · 소속 · 논문 ID',searchIn:'검색 범위',allFields:'전체 항목',titleOnly:'제목만',abstractOnly:'초록만',searchHint:'띄어쓰기로 구분한 검색어는 모두 포함(AND)으로 검색합니다. 정확한 구문은 큰따옴표로 묶으세요.',day:'발표일',allDays:'전체 날짜',format:'발표 형식',allFormats:'구두 · 포스터',oral:'구두',poster:'포스터',keyword:'공식 키워드',allKeywords:'전체 키워드',session:'세션',allSessions:'전체 세션',affiliation:'소속 (원문 표기)',allAffiliations:'전체 소속',room:'발표장',allRooms:'전체 발표장',savedOnly:'저장한 논문만',sort:'정렬',programmeOrder:'프로그램 순서',titleAZ:'제목순',reset:'필터 초기화',export:'검색 결과 CSV ↓',share:'검색 링크 복사',prev:'← 이전',next:'다음 →',researchTitle:'연구 분야별로 살펴보세요.',keywordNote:'공식 키워드별 논문 수입니다. 한 논문에 여러 키워드가 있을 수 있으며, 비율의 분모는 전체 614편입니다.',byDay:'날짜별 논문 수',byFormat:'발표 형식별 논문 수',formatNote:'구두 발표는 50개 세션 269편, 포스터는 7개 세션 345편입니다. 세션 이름으로 수상 여부를 판단하지 않습니다.',sessionsTitle:'4일간의 57개 발표 세션',timeNote:'모든 시간은 일본 표준시(JST, UTC+9)이며 한국과 같습니다. 세션에서 해당 논문 목록으로 이동할 수 있습니다.',topAffiliations:'논문 수가 많은 소속 표기',affiliationNote:'원문에 같은 소속으로 표기된 논문 수입니다. 한 논문 안의 중복 소속은 한 번 세며, 표기 변형은 합치지 않습니다. 기관 순위를 뜻하지 않습니다.',authorDirectory:'저자 색인',findAuthor:'저자 찾기',authorNote:'공식 저자 색인 식별자로 구분합니다. 좌장·조직자 역할은 제외하고 논문 저술만 집계합니다. 검색 결과는 최대 30명까지 표시합니다.',eventNote:'튜토리얼·워크숍·기조 강연·키노트·프런티어 세션·교류 행사 등 19개 프로그램 블록입니다. 일부 제목의 실제 행사 시간은 배정 슬롯보다 짧아 두 표기를 모두 보존했습니다.',sourceTitle:'공식 프로그램에서 출발합니다.',coverage:'수록 범위',coverageText:'구두·포스터 57개 세션의 고유 논문 614편과 모든 초록, 저자 식별자 1,584개, 공식 키워드 22개를 수록했습니다. 일별 프로그램의 제목, 저자 이름, 소속과 시간을 보존했습니다.',sourceText:'전체 일정표, 일별 페이지 4개, 저자·키워드 색인을 2026년 10월 31일 수집했습니다. 원문은 10월 17일 최종 갱신 및 변경 가능한 잠정 프로그램으로 표시되어 있습니다.',limitations:'자료를 읽을 때',limitationsText:'실제 참석·발표 여부, 채택률, 수상 결과를 나타내는 자료는 아닙니다. 초록은 저자가 제공한 요약이며, 소속의 표기 변형은 구분합니다. PDF나 코드 링크를 추정해 붙이지 않았습니다.',privacyText:'저장한 논문과 화면 설정은 이 브라우저에만 보관합니다. 공유 링크에는 필터와 논문 ID가 포함되지만 저장 목록은 전달되지 않습니다. 분석 추적기와 외부 폰트는 사용하지 않습니다.',scheduleNotes:'원문 시간표 안내',authorIndex:'공식 저자 색인 ↗',keywordIndex:'공식 키워드 색인 ↗',manifest:'수집 출처 목록',footer:'ICCAS 2026 · 독립적으로 제작한 프로그램 탐색기입니다. 학회 공식 사이트가 아닙니다.',close:'닫기 ×'
};
const tr = (en, kr) => language === 'ko' ? kr : en;
const dateLabel = date => new Intl.DateTimeFormat(language==='ko'?'ko-KR':'en-GB',{month:'short',day:'numeric',weekday:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
const formatLabel = type => type === 'Oral Session' ? tr('Oral','구두') : tr('Poster','포스터');
function appearance(){
 document.documentElement.lang=language;
 document.documentElement.dataset.theme=dark?'dark':'light';
 $('language').textContent=language==='en'?'한국어':'EN';
 $('theme').textContent=dark?tr('Light','라이트'):tr('Dark','다크');
 $('theme').setAttribute('aria-pressed',String(dark));
 for(const [el,en] of originalText)el.textContent=language==='ko'?(ko[el.dataset.i18n]||en):en;
}
function options(id, values){
 const select=$(id), value=select.value;
 while(select.options.length>1)select.remove(1);
 for(const entry of values){const [key,label]=Array.isArray(entry)?entry:[entry,entry];select.add(new Option(label,key));}
 select.value=value;
}
function populate(){
 options('day',data.dates.map(d=>[d,dateLabel(d)]));
 options('keyword',[...new Set(papers.flatMap(p=>p.keywords))].sort());
 options('session',data.sessions.filter(s=>s.papers.length).map(s=>[s.id,`${s.id} · ${s.title}`]));
 options('room',[...new Set(papers.map(p=>p.room))].sort());
 options('affiliation',[...new Set(papers.flatMap(p=>p.authors.map(a=>a.affiliation)))].sort());
}
function counts(values){const c=new Map();for(const v of values)c.set(v,(c.get(v)||0)+1);return [...c].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));}
function bar(label,count,max,key,value){return `<button class="bar" data-filter="${key}" data-value="${esc(value??label)}"><span class="bar-top"><span>${esc(label)}</span><b>${count}</b></span><div class="bar-track"><div class="bar-fill" style="width:${count/max*100}%"></div></div></button>`;}
function renderOverview(){
 const c=data.counts;
 $('stats').innerHTML=[[c.papers,tr('Programme papers','프로그램 수록 논문'),tr('269 oral · 345 poster','구두 269 · 포스터 345')],[c.paperSessions,tr('Technical sessions','논문 발표 세션'),tr('Across four days','4일간의 프로그램')],[c.abstracts,tr('Available abstracts','수록 초록'),tr('Search the complete text','초록 전문 검색 가능')],[c.authors,tr('Author identifiers','저자 식별자'),tr('Official author index','공식 저자 색인 기준')]].map(([n,l,note])=>`<div class="stat"><strong>${n.toLocaleString()}</strong><span>${l}</span><small>${note}</small></div>`).join('');
 const keywords=counts(papers.flatMap(p=>[...new Set(p.keywords)]));
 $('keyword-chart').innerHTML=keywords.map(([k,n])=>`<button class="keyword-card" data-filter="keyword" data-value="${esc(k)}"><strong>${n}</strong><small>${(n/papers.length*100).toFixed(1)}%</small><span>${esc(k)}</span><i style="width:${n/keywords[0][1]*100}%"></i></button>`).join('');
 $('day-chart').innerHTML=data.dates.map(d=>bar(dateLabel(d),papers.filter(p=>p.date===d).length,papers.length,'day',d)).join('');
 $('format-chart').innerHTML=['Oral Session','Poster Session'].map(f=>bar(formatLabel(f),papers.filter(p=>p.type===f).length,papers.length,'format',f)).join('');
 const affiliations=counts(papers.flatMap(p=>[...new Set(p.authors.map(a=>a.affiliation))])).slice(0,12);
 $('affiliation-chart').innerHTML=affiliations.map(([a,n])=>bar(a,n,affiliations[0][1],'affiliation')).join('');
 $('event-list').innerHTML=data.sessions.filter(s=>!s.papers.length).map(s=>sessionCard(s,true)).join('');
 $('warnings').innerHTML=data.warnings.map(w=>`<li><a href="${esc(sessionMap.get(w.session).source)}" target="_blank" rel="noopener">${esc(w.session)}</a> · ${esc(tr(w.message,'원문에서 구두 발표 2편에 10:15–10:30 시간이 중복 배정되어 있습니다.'))}</li>`).join('');
 renderAuthors();renderSchedule();
}
function sessionCard(s,event=false){
 const warning=data.warnings.find(w=>w.session===s.id);
 return `<article class="session-card"><span class="badge">${esc(s.id)}${s.type?' · '+esc(s.type):''}</span><h3>${esc(s.title)}</h3><p class="session-meta">${dateLabel(s.date)} · ${s.start}–${s.end}</p><p class="session-meta">${esc(s.room)}</p>${warning?`<p class="warning">${tr('Source has duplicate oral time slots.','원문에 구두 발표 시간 중복이 있습니다.')}</p>`:''}${s.people.length?`<details><summary>${tr('Chairs & organisers','좌장 · 조직자')} (${s.people.length})</summary>${s.people.map(a=>`<p><b>${esc(a.role)}:</b> ${esc(a.name)}<br>${esc(a.affiliation)}</p>`).join('')}</details>`:''}<div class="session-bottom">${event?'':`<button data-filter="session" data-value="${esc(s.id)}">${s.papers.length} ${tr('papers →','편 보기 →')}</button>`}<a href="${esc(s.source)}" target="_blank" rel="noopener">${tr('Source ↗','원문 ↗')}</a></div></article>`;
}
function renderSchedule(){
 $('schedule-days').innerHTML=data.dates.map(d=>`<button data-schedule="${d}" aria-pressed="${d===scheduleDay}">${dateLabel(d)} · ${papers.filter(p=>p.date===d).length} ${tr('papers','편')}</button>`).join('');
 $('session-list').innerHTML=data.sessions.filter(s=>s.date===scheduleDay&&s.papers.length).map(s=>sessionCard(s)).join('');
}
function renderAuthors(){
 const q=$('author-search').value.trim().toLocaleLowerCase();
 const authors=[...authorMap.values()].filter(a=>(a.name+' '+[...a.affiliations].join(' ')).toLocaleLowerCase().includes(q)).sort((a,b)=>b.papers.size-a.papers.size||a.name.localeCompare(b.name)).slice(0,30);
 $('author-list').innerHTML=authors.map(a=>`<button class="author-row" data-author="${esc(a.id)}" title="${esc([...a.affiliations].join('; '))}"><span>${esc(a.name)}</span><strong>${a.papers.size}</strong></button>`).join('')||`<p class="muted">${tr('No matching authors.','일치하는 저자가 없습니다.')}</p>`;
}
function tokens(query){return [...query.toLocaleLowerCase().matchAll(/"([^"]+)"|(\S+)/g)].map(m=>m[1]||m[2]);}
function syncURL(){
 const params=new URLSearchParams();
 for(const id of fields)if($(id).value&&!(['scope','sort'].includes(id)&&['all','programme'].includes($(id).value)))params.set(id,$(id).value);
 if($('saved').checked)params.set('saved','1');
 if(authorFilter)params.set('author',authorFilter);
 if(openPaper)params.set('paper',openPaper);
 if(language==='ko')params.set('lang','ko');
 history.replaceState(null,'',location.pathname+(params.size?'?'+params:'')+location.hash);
}
function loadURL(){
 const params=new URLSearchParams(location.search);
 for(const id of fields)if(params.has(id))$(id).value=params.get(id);
 if(!$('scope').value)$('scope').value='all';if(!$('sort').value)$('sort').value='programme';
 $('saved').checked=params.get('saved')==='1';
 authorFilter=authorMap.has(params.get('author'))?params.get('author'):'';
 return params.get('paper');
}
function applyFilters(resetPage=true){
 if(resetPage)page=1;
 const terms=tokens($('q').value),scope=$('scope').value;
 filtered=papers.filter(p=>terms.every(t=>(scope==='all'?p.search:p[scope].toLocaleLowerCase()).includes(t))&&(!$('day').value||p.date===$('day').value)&&(!$('format').value||p.type===$('format').value)&&(!$('keyword').value||p.keywords.includes($('keyword').value))&&(!$('session').value||p.session===$('session').value)&&(!$('affiliation').value||p.authors.some(a=>a.affiliation===$('affiliation').value))&&(!$('room').value||p.room===$('room').value)&&(!authorFilter||p.authors.some(a=>a.id===authorFilter))&&(!$('saved').checked||saved.has(p.id)));
 if($('sort').value==='title')filtered.sort((a,b)=>a.title.localeCompare(b.title));
 page=Math.max(1,Math.min(page,Math.ceil(filtered.length/pageSize)||1));
 renderResults();syncURL();
}
function saveButton(p){return `<button class="save" data-save="${esc(p.id)}" aria-pressed="${saved.has(p.id)}" aria-label="${esc(tr('Save paper ','논문 저장 ')+p.id)}">${saved.has(p.id)?'★':'☆'} ${saved.has(p.id)?tr('Saved','저장됨'):tr('Save','저장')}</button>`;}
function renderResults(){
 $('result-count').textContent=tr(`${filtered.length} / ${papers.length} papers`,`${papers.length}편 중 ${filtered.length}편`);
 $('page-info').textContent=`${page} / ${Math.ceil(filtered.length/pageSize)||1}`;
 $('prev').disabled=page===1;$('next').disabled=page*pageSize>=filtered.length;
 $('author-filter').innerHTML=authorFilter?`${tr('Author','저자')}: <b>${esc(authorMap.get(authorFilter).name)}</b><button data-clear-author>${tr('Clear ×','해제 ×')}</button>`:'';
 $('results').innerHTML=filtered.slice((page-1)*pageSize,page*pageSize).map(p=>`<article class="paper"><div class="paper-meta"><span class="badge">${esc(p.id)}</span><span>${formatLabel(p.type)}</span><span>${dateLabel(p.date)} · ${p.start}–${p.end}</span><span>${esc(p.room)}</span></div><h3><button class="title-button" data-paper="${esc(p.id)}">${esc(p.title)}</button></h3><p class="authors">${esc(p.authors.map(a=>a.name).join(' · '))}</p><div class="paper-session">${esc(p.session)} · ${esc(sessionMap.get(p.session).title)}</div><div class="paper-bottom"><div class="chips">${p.keywords.map(k=>`<button class="chip" data-filter="keyword" data-value="${esc(k)}">${esc(k)}</button>`).join('')}</div>${saveButton(p)}</div></article>`).join('')||`<div class="empty">${tr('No matching papers. Try fewer terms or reset the filters.','검색 결과가 없습니다. 검색어를 줄이거나 필터를 초기화해 보세요.')}</div>`;
}
function choose(field,value){
 HTMLFormElement.prototype.reset.call($('filters'));authorFilter='';$(field).value=value;applyFilters();location.hash='finder';
}
function chooseAuthor(id){
 if($('detail').open)$('detail').close();HTMLFormElement.prototype.reset.call($('filters'));authorFilter=id;applyFilters();location.hash='finder';
}
function details(id){
 const p=papers.find(p=>p.id===id);if(!p)return;
 openPaper=id;
 const s=sessionMap.get(p.session);
 $('detail-body').innerHTML=`<div class="paper-meta"><span class="badge">${esc(p.id)}</span><span>${tr('Paper ID','논문 ID')} ${esc(p.paperId)}</span><span>${formatLabel(p.type)}</span></div><h2 id="detail-title">${esc(p.title)}</h2><p class="muted">${dateLabel(p.date)} · ${p.start}–${p.end} JST<br>${esc(p.room)} · ${esc(s.id)} · ${esc(s.title)}</p>${data.warnings.some(w=>w.session===s.id)?`<p class="warning">${tr('This session contains duplicate oral time slots in the source.','이 세션은 원문에 구두 발표 시간 중복이 있습니다.')}</p>`:''}<div class="detail-actions">${saveButton(p)}<button id="copy-paper">${tr('Copy paper link','논문 링크 복사')}</button><a class="button" href="${esc(p.source)}" target="_blank" rel="noopener">${tr('Official paper entry ↗','공식 논문 항목 ↗')}</a></div><h3>${tr('Authors & affiliations','저자 · 소속')}</h3><ul class="detail-authors">${p.authors.map(a=>`<li><button data-author="${esc(a.id)}">${esc(a.name)}</button><small>${esc(a.affiliation)}</small></li>`).join('')}</ul><h3>${tr('Official keywords','공식 키워드')}</h3><div class="chips">${p.keywords.map(k=>`<button class="chip" data-filter="keyword" data-value="${esc(k)}">${esc(k)}</button>`).join('')}</div><h3 style="margin-top:25px">${tr('Abstract','초록')}</h3><p class="abstract">${esc(p.abstract)}</p><p class="muted">${tr('Title and abstract reproduced from the official programme; original source wording is retained.','제목과 초록은 공식 프로그램의 원문을 그대로 표시합니다.')}</p><p id="detail-feedback" role="status" aria-live="polite"></p>`;
 if(!$('detail').open)$('detail').showModal();syncURL();
}
async function copyLink(paperOnly=false){
 const url=new URL(location.href);
 if(paperOnly){url.search='';url.searchParams.set('paper',openPaper);if(language==='ko')url.searchParams.set('lang','ko');url.hash='finder';}
 const feedback=paperOnly?$('detail-feedback'):$('feedback');
 feedback.innerHTML=`<label>${tr('Share link','공유 링크')}<input class="share-url" readonly aria-label="${tr('Share link','공유 링크')}" value="${esc(url.href)}"></label>`;
 const input=feedback.querySelector('input');input.addEventListener('click',()=>input.select());
 try{await navigator.clipboard.writeText(url.href);feedback.insertAdjacentHTML('afterbegin',`<span>${tr('Link copied.','링크를 복사했습니다.')}</span>`);}
 catch{/* The visible, selectable URL remains available when clipboard permission is unavailable. */}
}
function csvCell(value){let s=String(value??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function exportCSV(){
 const head=['slot','paper_id','title','authors','affiliations','date','start','end','session','room','format','keywords','abstract','source'];
 const rows=filtered.map(p=>[p.id,p.paperId,p.title,p.authors.map(a=>a.name).join('; '),[...new Set(p.authors.map(a=>a.affiliation))].join('; '),p.date,p.start,p.end,p.session,p.room,p.type,p.keywords.join('; '),p.abstract,p.source]);
 const blob=new Blob(['\ufeff'+[head,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='iccas2026-results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 $('feedback').textContent=tr(`Exported ${filtered.length} papers.`,`${filtered.length}편을 내보냈습니다.`);
}
async function init(){
 const response=await fetch('data.json');if(!response.ok)throw new Error('Could not load programme data');data=await response.json();
 sessionMap=new Map(data.sessions.map(s=>[s.id,s]));authorMap=new Map();
 papers=data.papers.map(p=>({...p,search:[p.id,p.paperId,p.title,p.abstract,p.session,sessionMap.get(p.session).title,...p.keywords,...p.authors.flatMap(a=>[a.name,a.affiliation])].join(' ').toLocaleLowerCase()}));
 for(const p of papers)for(const a of p.authors){if(!authorMap.has(a.id))authorMap.set(a.id,{...a,affiliations:new Set(),papers:new Set()});authorMap.get(a.id).affiliations.add(a.affiliation);authorMap.get(a.id).papers.add(p.id);}
 const params=new URLSearchParams(location.search);if(['en','ko'].includes(params.get('lang')))language=params.get('lang');
 appearance();populate();const initialPaper=loadURL();renderOverview();applyFilters();if(initialPaper)details(initialPaper);
 $('filters').addEventListener('submit',e=>e.preventDefault());
 for(const id of fields)$(id).addEventListener(id==='q'?'input':'change',()=>applyFilters());
 $('saved').addEventListener('change',()=>applyFilters());
 $('reset').onclick=()=>{HTMLFormElement.prototype.reset.call($('filters'));authorFilter='';$('feedback').textContent='';applyFilters();};
 $('author-search').addEventListener('input',renderAuthors);
 $('prev').onclick=()=>{page--;applyFilters(false);$('finder').scrollIntoView();};$('next').onclick=()=>{page++;applyFilters(false);$('finder').scrollIntoView();};
 $('export').onclick=exportCSV;$('share').onclick=()=>copyLink();
 $('close').onclick=()=>$('detail').close();
 $('detail').addEventListener('close',()=>{openPaper='';syncURL();});
 $('theme').onclick=()=>{dark=!dark;persist('iccas2026-dark',dark);appearance();};
 $('language').onclick=()=>{language=language==='en'?'ko':'en';persist('iccas2026-language',language);appearance();populate();renderOverview();applyFilters(false);if(openPaper)details(openPaper);};
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.paper)details(b.dataset.paper);
  if(b.dataset.filter){if($('detail').open)$('detail').close();choose(b.dataset.filter,b.dataset.value);}
  if(b.dataset.author)chooseAuthor(b.dataset.author);
  if(b.hasAttribute('data-clear-author')){authorFilter='';applyFilters();}
  if(b.dataset.schedule){scheduleDay=b.dataset.schedule;renderSchedule();}
  if(b.dataset.save){const id=b.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);const ok=persist('iccas2026-saved',[...saved]);applyFilters(false);if(openPaper)details(openPaper);if(!ok)(openPaper?$('detail-feedback'):$('feedback')).textContent=tr('Browser storage unavailable; saved for this visit only.','브라우저 저장소를 사용할 수 없어 이번 방문 동안만 저장합니다.');}
  if(b.id==='copy-paper')copyLink(true);
 });
 const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){for(const a of document.querySelectorAll('nav a'))a.classList.toggle('active',a.hash==='#'+e.target.id);}},{rootMargin:'-20% 0px -60% 0px'});
 document.querySelectorAll('main>section').forEach(s=>observer.observe(s));
}
appearance();
init().catch(error=>{$('result-count').textContent=tr('Unable to load programme.','프로그램을 불러오지 못했습니다.');$('results').innerHTML=`<div class="empty">${tr('Please reload, or download the','새로고침하거나 자료를 내려받으세요:')} <a href="papers.csv">CSV</a>.</div>`;console.error(error);});
