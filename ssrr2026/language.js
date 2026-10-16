'use strict';
(() => {
 const dictionary = new Map(Object.entries(window.SSRR_KO).map(([en,ko])=>[en.trim(),ko.trim()]));
 const originals = new WeakMap();
 let language = 'en';
 try { if(localStorage.getItem('ssrr2026-language')==='ko') language='ko'; } catch {}
 function translate(value) {
  if(language==='en') return value;
  const text=value.trim();
  let result=dictionary.get(text);
  if(result===undefined){
   if(/^\d+ \/ \d+ papers$/.test(text)) result=text.replace(' papers','편');
   else if(/^\d+ papers →$/.test(text)) result=text.replace(' papers','편');
   else if(text.startsWith('Author filter: ')) result='저자 필터: '+text.slice(15);
   else if(text.endsWith(' Save')) result=text.slice(0,-5)+' 저장';
   else if(text==='No title-derived tags') result='제목 기반 태그 없음';
  }
  return result===undefined?value:value.replace(text,result);
 }
 function updateValue(node,key,value,set) {
  let record=originals.get(node);
  if(!record){record={};originals.set(node,record);}
  if(!record[key]||value!==record[key].shown) record[key]={english:value,shown:value};
  const next=translate(record[key].english);
  record[key].shown=next;
  if(next!==value)set(next);
 }
 function applyLanguage(){
  observer.disconnect();
  document.documentElement.lang=language;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  for(let node=walker.nextNode();node;node=walker.nextNode()){
   if(node.parentElement.closest('script,style,code,[data-language]'))continue;
   updateValue(node,'text',node.nodeValue,value=>node.nodeValue=value);
  }
  document.querySelectorAll('[placeholder],[aria-label]').forEach(el=>{
   if(el.matches('.language-switch,[data-language]'))return;
   for(const attr of ['placeholder','aria-label'])if(el.hasAttribute(attr))updateValue(el,attr,el.getAttribute(attr),value=>el.setAttribute(attr,value));
  });
  document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label']});
 }
 const observer=new MutationObserver(applyLanguage);
 document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{
  language=button.dataset.language;
  try{localStorage.setItem('ssrr2026-language',language);}catch{}
  applyLanguage();
 }));
 applyLanguage();
})();
