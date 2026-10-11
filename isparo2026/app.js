'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayNames={'2026-11-03':'Tue 03 Nov','2026-11-04':'Wed 04 Nov','2026-11-05':'Thu 05 Nov'};
const rules=[['SLAM & localisation',/slam|locali[sz]|odometry|localizability/i],['Perception & mapping',/perception|vision|visual|imaging|mapping|reconstruction|segmentation|stereo|lidar|optical|depth|sensor fusion/i],['Planning & navigation',/planning|navigation|trajectory|trajectories|path.finding/i],['Learning & AI',/learning|neural|transformer|language.model|vision.language|\bAI\b/i],['Manipulation & assembly',/manipulat|assembly|grasp|robotic arm|toolset/i],['Rendezvous & servicing',/rendezvous|docking|servicing|debris|capture|on.orbit inspection/i],['Locomotion & rovers',/rover|locomotion|legged|quadruped|wheel|terramechanics|traversability/i],['Multi-robot systems',/multi.agent|multi.robot|swarm|constellation|fleet|coordinating|distributed space/i],['Simulation & testbeds',/simulat|digital.twin|testbed|hardware.in|ground.based|ground validation|air.bearing/i],['Control & dynamics',/control|dynamics|MPC|attitude|thruster|momentum|impedance/i],['Human–robot & teleoperation',/human|teleoperat|telerobot|astronaut|haptic/i],['Resources & infrastructure',/ISRU|resource|drill|excavat|mining|infrastructure|manufactur/i]];
let data, rows=[], filtered=[], page=1, saved=new Set(), scheduleDay='2026-11-03';
const pageSize=20, storageKey='isparo2026-saved-v1';
try{const parsed=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(parsed))saved=new Set(parsed);}catch{}
const fields=['query','query2','logic','track','day','room','topic','session','institution','sort'];
const countBy=(values,key)=>Object.entries(values.reduce((out,x)=>{out[x[key]]=(out[x[key]]||0)+1;return out;},{})).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
function choose(field,value){$(field).value=value;page=1;render();$('papers').scrollIntoView({behavior:'smooth'});}
function options(id,values){values.forEach(v=>{const o=document.createElement('option');o.value=typeof v==='string'?v:v[0];o.textContent=typeof v==='string'?v:v[1];$(id).append(o);});}
function syncURL(){const p=new URLSearchParams();fields.forEach(id=>{const v=$(id).value;if(v&&!(id==='logic'&&v==='AND')&&!(id==='sort'&&v==='programme'))p.set(id,v);});if($('saved-only').checked)p.set('saved','1');history.replaceState(null,'',location.pathname+(p.size?'?'+p:'')+location.hash);}
function render(){
 const q=[$('query').value,$('query2').value].map(x=>x.trim().toLocaleLowerCase()).filter(Boolean);
 filtered=rows.filter(t=>{
  const matches=q.map(term=>t.search.includes(term));
  return (!matches.length||($('logic').value==='OR'?matches.some(Boolean):matches.every(Boolean)))&&['track','day','room','session','institution'].every(id=>!$(id).value||t[id==='day'?'date':id]===$(id).value)&&(!$('topic').value||t.topics.includes($('topic').value))&&(!$('saved-only').checked||saved.has(t.id));
 });
 const order=$('sort').value;
 filtered.sort((a,b)=>order==='title'?a.title.localeCompare(b.title):order==='speaker'?a.speaker.localeCompare(b.speaker):a.date.localeCompare(b.date)||a.start.localeCompare(b.start)||a.session.localeCompare(b.session)||a.id.localeCompare(b.id));
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages);
 $('result-count').textContent=`${filtered.length} / ${rows.length} presentations${$('saved-only').checked?' · saved on this device':''}`;
 $('results').innerHTML=filtered.slice((page-1)*pageSize,page*pageSize).map(t=>`<article class="presentation" id="${t.id}"><div><div class="meta"><span class="badge ${t.track==='iSpaRo'?'isparo':''}">${esc(t.track)}</span><span>${dayNames[t.date]} · ${t.start}–${t.end} · Room ${esc(t.room)}</span><span>· ${t.id}</span></div><h3>${esc(t.title)}</h3><p><strong>${esc(t.speaker)}</strong> · ${esc(t.institution)}</p><p class="muted">${t.session} · ${esc(t.sessionTitle)}</p><div>${t.topics.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>${['TS33','TS34','TS35'].includes(t.session)?'<p class="warning">Schedule discrepancy: detailed table and overview differ. Check source PDF.</p>':''}${t.duplicate?'<p class="warning">Duplicate time slot in source — retained as printed.</p>':''}<a class="source-link" href="source/programme.pdf#page=${t.page}" target="_blank" rel="noopener">Programme PDF · page ${t.page} ↗</a></div><button class="save" data-save="${t.id}" aria-label="${saved.has(t.id)?'Unsave':'Save'} ${esc(t.title)}" aria-pressed="${saved.has(t.id)}">${saved.has(t.id)?'★':'☆'}</button></article>`).join('')||'<div class="empty">No presentations match these filters.<br>Try a broader term or reset the filters.</div>';
 $('page-count').textContent=`${page} / ${pages}`;$('prev').disabled=page===1;$('next').disabled=page===pages;syncURL();
}
function renderSchedule(){
 const sessions=data.sessions.filter(s=>s.date===scheduleDay);
 const starts=[...new Set(sessions.map(s=>s.start))];
 $('schedule').innerHTML=starts.map(time=>`<div class="slot-heading">${time}–${sessions.find(s=>s.start===time).end} · CET</div><div class="session-grid">${sessions.filter(s=>s.start===time).map(s=>`<button class="session-card" data-session="${s.id}"><b>${s.id}<span>ROOM ${esc(s.room)}</span></b><span>${esc(s.title)}</span><small>${rows.filter(t=>t.session===s.id).length} presentations${['TS33','TS34','TS35'].includes(s.id)?' · Check source time':''} →</small></button>`).join('')}</div>`).join('');
}
function downloadCSV(){const cols=['id','track','title','speaker','institution','session','date','start','end','room','page'];const cell=v=>'"'+String(v??'').replace(/^[=+@\-]/,"'"+'$&').replace(/"/g,'""')+'"';const csv='\ufeff'+[cols.join(','),...filtered.map(t=>cols.map(k=>cell(t[k])).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='isparo2026-presentations.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const events=[
 ['Keynote I','Matthias Maurer','ESA Astronaut','Wed 04 Nov · 09:00–09:30',5],
 ['Keynote II','Jonathan M. Rogers','Chief – Robotic Systems Technology Branch, NASA Johnson Space Center','Wed 04 Nov · 14:00–14:30',5],
 ['Keynote III','Kazuya Yoshida','Professor and Head of Space Robotics Laboratory, Tohuko University (as printed)','Thu 05 Nov · 09:00–09:30',5],
 ['Keynote IV','Julie Townsend','Robotics Systems Engineer, NASA JPL','Thu 05 Nov · 14:00–14:30',5],
 ['Panel discussion 1','Artificial Intelligence (AI)','Moderator: Sandra Unruh. Panelists: Becky Castano (JPL/NASA), David Rijlaarsdam (Ubotica), Patrick McKeen (MIT), Nico Hochgeschwender (Universität Bremen), Samantha Chapin (U.S. Naval Research Laboratory).','Wed 04 Nov · 11:30–13:00',6],
 ['Panel discussion 2','Act in Space: In-Space Operations and Services (ISOS)','Moderator: Daniel Nölke. Panelists: Thomas Schervan (iBOSS GmbH), Sabrina Andiappane (ClearSpace), Nikhil Balasubramanian (OrbitAID), Stéphanie Behar-Lafenetre (Thales Alenia Space), Tiago Soares (ESA).','Thu 05 Nov · 11:30–13:00',6]
];
async function init(){
 const response=await fetch('data.json');if(!response.ok)throw new Error('Programme data could not be loaded.');data=await response.json();
 const sessions=Object.fromEntries(data.sessions.map(s=>[s.id,s]));
 rows=data.talks.map(t=>({...t,sessionTitle:sessions[t.session].title,topics:rules.filter(([,re])=>re.test(t.title)).map(([name])=>name),duplicate:data.talks.filter(x=>x.session===t.session&&x.start===t.start).length>1,search:[t.title,t.speaker,t.institution,t.session,sessions[t.session].title,t.track,t.room].join(' ').toLocaleLowerCase()}));
 options('room',[...new Set(rows.map(t=>t.room))].sort());options('topic',rules.map(([name])=>name));options('session',data.sessions.map(s=>[s.id,`${s.id} · ${s.title}`]));options('institution',[...new Set(rows.map(t=>t.institution))].sort((a,b)=>a.localeCompare(b)));
 const params=new URLSearchParams(location.search);fields.forEach(id=>{if(params.has(id))$(id).value=params.get(id);});if(!$('logic').value)$('logic').value='AND';if(!$('sort').value)$('sort').value='programme';$('saved-only').checked=params.get('saved')==='1';
 const themeCounts=rules.map(([name])=>[name,rows.filter(t=>t.topics.includes(name)).length]).sort((a,b)=>b[1]-a[1]);
 $('topics').innerHTML=themeCounts.map(([name,count])=>`<button class="topic" data-topic="${esc(name)}"><strong>${count}</strong><span>${esc(name)}</span><i style="width:${count/themeCounts[0][1]*100}%"></i></button>`).join('');
 const institutions=countBy(rows,'institution').slice(0,12);
 $('institution-bars').innerHTML=institutions.map(([name,count])=>`<button class="bar" data-institution="${esc(name)}" title="${esc(name)}"><span class="bar-top"><span>${esc(name)}</span><b>${count}</b></span><div class="bar-track"><div class="bar-fill" style="width:${count/institutions[0][1]*100}%"></div></div></button>`).join('');
 $('event-list').innerHTML=events.map(([type,name,detail,time,p])=>`<article class="event-card"><span class="badge">${type}</span><h3>${esc(name)}</h3><p>${esc(detail)}</p><p><strong>${time}</strong><br>Room P+Q</p><a class="source-link" href="source/programme.pdf#page=${p}" target="_blank" rel="noopener">PDF page ${p} ↗</a></article>`).join('');
 $('workshop-list').innerHTML=data.workshops.map(w=>`<details class="workshop"><summary><span class="badge">${w.id}</span> ${esc(w.title)}<small>Thu 05 Nov · ${w.start}–${w.end} · Room ${w.room}</small></summary><p><strong>Organisers:</strong> ${esc(w.organizers)}</p><p>${esc(w.abstract)}</p><a class="source-link" href="source/programme.pdf#page=${w.page}" target="_blank" rel="noopener">Programme abstract · PDF page ${w.page} ↗</a></details>`).join('');
 $('filters').addEventListener('submit',e=>e.preventDefault());fields.forEach(id=>$(id).addEventListener(['query','query2'].includes(id)?'input':'change',()=>{page=1;render();}));$('saved-only').addEventListener('change',()=>{page=1;render();});$('reset').onclick=()=>{HTMLFormElement.prototype.reset.call($('filters'));page=1;render();};
 $('prev').onclick=()=>{page--;render();$('papers').scrollIntoView();};$('next').onclick=()=>{page++;render();$('papers').scrollIntoView();};$('export').onclick=downloadCSV;
 document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.topic)choose('topic',button.dataset.topic);if(button.dataset.session)choose('session',button.dataset.session);if(button.dataset.institution)choose('institution',button.dataset.institution);if(button.dataset.day){scheduleDay=button.dataset.day;document.querySelectorAll('[data-day]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});renderSchedule();}if(button.dataset.save){const id=button.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem(storageKey,JSON.stringify([...saved]));}catch{}render();}});
 renderSchedule();render();
}
init().catch(error=>{$('results').innerHTML=`<div class="empty">${esc(error.message)} <a href="source/programme.pdf">Open the programme PDF</a>.</div>`;$('result-count').textContent='Unable to load programme';console.error(error);});
