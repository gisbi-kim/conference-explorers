// Regression: chart totals, filter results, CSV values and legacy links agree.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'data.json')));
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, {value:'', checked:false, innerHTML:'', textContent:'', options:[], add(option){this.options.push(option)},remove(i){this.options.splice(i,1)}});
  return elements.get(id);
};
const context = vm.createContext({
  document:{getElementById:element, querySelectorAll:()=>[]},
  localStorage:{getItem:()=>null}, URLSearchParams, Intl, Date, console,
  Option: function(text,value){this.text=text;this.value=value;},
  location:{search:'?affiliation=Korea+Advanced+Institute+of+Science+and+Technology'},
  snapshot, assert
});
const source = fs.readFileSync(path.join(root,'app.js'),'utf8');
vm.runInContext(source.slice(0,source.lastIndexOf('\nappearance();')), context);
vm.runInContext(`
 data=snapshot; papers=data.papers; sessionMap=new Map(data.sessions.map(s=>[s.id,s]));authorMap=new Map();
 renderAuthors=()=>{};renderSchedule=()=>{};
 populate();renderOverview();
 const chart=counts(papers.flatMap(p=>[...new Set(p.authors.map(a=>institution(a.affiliation)))]));
 const kaist=chart.find(([name])=>name==='KAIST');
 const matching=papers.filter(p=>p.authors.some(a=>institution(a.affiliation)==='KAIST'));
 assert.equal(kaist[1],matching.length);
 assert.equal(kaist[1],53);
 assert.equal($('affiliation').options.filter(o=>o.value==='KAIST').length,1);
 assert.equal($('affiliation').options.filter(o=>o.value.includes('Korea Advanced Institute of Science')).length,0);
 assert.equal(($('affiliation-chart').innerHTML.match(/data-value="KAIST"/g)||[]).length,1);
 assert.equal(institution('Korea Institute of Science and Technology'),'Korea Institute of Science and Technology');
 loadURL();assert.equal($('affiliation').value,'KAIST');
 syncURL=()=>{};applyFilters();assert.equal(filtered.length,53);
 assert.equal($('result-count').textContent,'53 / 614 papers');
 const multi=papers.filter(p=>new Set(p.authors.filter(a=>institution(a.affiliation)==='KAIST').map(a=>a.affiliation)).size>1);
 assert.ok(multi.length>0);
 assert.equal(new Set(matching.map(p=>p.id)).size,kaist[1]);
 console.log('PASS: one KAIST option/chart row; '+kaist[1]+' distinct papers; '+multi.length+' mixed-label papers deduplicated; legacy link normalized; KIST stays separate');
 console.log(JSON.stringify(chart.slice(0,12)));
`,context);
