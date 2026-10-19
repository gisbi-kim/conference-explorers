/* Safe abstract markup: text commands outside math, KaTeX inside delimiters. */
(function(root){
'use strict';
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function decode(s){for(let i=0;i<3;i++){const next=s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(m,k)=>{const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};if(k[0]!=='#')return named[k.toLowerCase()]||m;const n=k[1].toLowerCase()==='x'?parseInt(k.slice(2),16):+k.slice(1);return n>0&&n<=0x10ffff?String.fromCodePoint(n):m;});if(next===s)break;s=next;}return s;}
function group(s,start){if(s[start]!=='{')return null;let depth=1;for(let i=start+1;i<s.length;i++){if(s[i]==='\\'){i++;continue;}if(s[i]==='{')depth++;if(s[i]==='}'&&!--depth)return {text:s.slice(start+1,i),end:i+1};}return null;}
function render(source,issues=[]){
 const s=decode(String(source||'')), macros={'\\mbox':'\\text{#1}','\\KL':'\\operatorname{KL}','\\polylog':'\\operatorname{polylog}','\\textdegree':'{}^\\circ','\\textasciitilde':'\\sim','\\ReLU':'\\operatorname{ReLU}','\\eps':'\\epsilon','\\diag':'\\operatorname{diag}'};
 function math(tex,display){
  tex=tex.replace(/\\\*/g,'*');
  if(tex.includes('$')&&!/\\(?:text|mbox)/.test(tex))tex=tex.replace(/\$/g,'');

  try{if(!root.katex)throw Error('Math renderer unavailable');return root.katex.renderToString(tex,{displayMode:display,throwOnError:true,trust:false,strict:'ignore',maxExpand:1000,maxSize:10,macros});}
  catch(e){
   if(root.katex&&tex.includes('\\\\')){try{return root.katex.renderToString(tex.replace(/\\\\/g,'\\'),{displayMode:display,throwOnError:true,trust:false,strict:'ignore',maxExpand:1000,maxSize:10,macros});}catch{}}
   issues.push({tex,message:e.message});return '<code class="math-fallback" title="Original formula">'+escapeHTML(tex)+'</code>';}
 }
 function inline(s,depth=0){
  if(depth>40)return escapeHTML(s);
  let out='',i=0;
  while(i<s.length){
   const tail=s.slice(i);
   const delim=tail.startsWith('$$')?['$$','$$',true]:tail.startsWith('\\[')?['\\[','\\]',true]:tail.startsWith('\\(')?['\\(','\\)',false]:s[i]==='$'?['$','$',false]:null;
   if(delim){let end=i+delim[0].length,braces=0;for(;end<s.length;end++){if(s.startsWith(delim[1],end)&&braces===0)break;if(s[end]==='{')braces++;if(s[end]==='}')braces--;if(s[end]==='\\'&&!s.startsWith(delim[1],end))end++;}if(end<s.length){out+=math(s.slice(i+delim[0].length,end),delim[2]);i=end+delim[1].length;continue;}}
   const environment=tail.match(/^\\begin\{(align\*?|equation\*?|gather\*?)\}/);
   if(environment){const close='\\end{'+environment[1]+'}',end=s.indexOf(close,i);if(end>=0){out+=math(s.slice(i,end+close.length),true);i=end+close.length;continue;}}
   const color=tail.match(/^\\textcolor(?:\[[^\]]*\])?\s*/);
   if(color){const name=group(s,i+color[0].length),body=name&&group(s,name.end);if(body){out+=inline(body.text,depth+1);i=body.end;continue;}}
   const reference=tail.match(/^\\(citep|citet|cite|ref|cref|footnote|acroinit)\s*/);
   if(reference){const g=group(s,i+reference[0].length);if(g){out+=(reference[1]==='acroinit'?'<strong>':'[')+inline(g.text,depth+1)+(reference[1]==='acroinit'?'</strong>':']');i=g.end;continue;}}
   const ding=tail.match(/^\\ding\{(18[2-9]|19[01])\}/);if(ding){out+=String.fromCodePoint(0x2460+Number(ding[1])-182);i+=ding[0].length;continue;}
   const simple=tail.match(/^\\(eg|ie|etc|textemdash|textdegree|textasciitilde|faGithub|ttimes|CoT)\b(?:\{\})?/);
   if(simple){out+=({eg:'e.g.',ie:'i.e.',etc:'etc.',textemdash:'—',textdegree:'°',textasciitilde:'~',faGithub:'',ttimes:'×',CoT:'CoT'})[simple[1]];i+=simple[0].length;continue;}
   const endAbstract=tail.match(/^\\end\{abstract\}/);if(endAbstract){i+=endAbstract[0].length;continue;}
   // Recover math written without delimiters only when a complete parenthesized expression is recognizable.
   if(s[i]==='('){let level=1,end=i+1;for(;end<s.length&&level;end++){if(s[end]==='(')level++;if(s[end]===')')level--;}const body=s.slice(i+1,end-1);if(!level&&/\\(?:sqrt|frac|mathcal|Theta|Omega|kappa|zeta|top|theta|varepsilon)\b/.test(body)&&!/\b(?:the|and|where|with|for)\b/.test(body)){out+='('+math(body,false)+')';i=end;continue;}}
   const bare=tail.match(/^\\(sqrt|frac|mathbb|mathcal|mathrm|mathbf|hat|tilde|Theta|Omega|log|times|varepsilon|top|theta|chi|tau|eta|ge|leq|mid|sigma|Gamma)\b/);
   if(bare&&root.katex){let end=i+bare[0].length;while(s[end]==='{'){const g=group(s,end);if(!g)break;end=g.end;}try{out+=root.katex.renderToString(s.slice(i,end),{trust:false,throwOnError:true,strict:'ignore',maxSize:10,maxExpand:1000});i=end;continue;}catch{}}
   if(s[i]==='{'){const g=group(s,i);if(g&&/^\s*\\/.test(g.text)){out+=inline(g.text,depth+1);i=g.end;continue;}}
const cmd=tail.match(/^\\(textbf|textit|emph|texttt|textsf|textrm|textnormal|textsc|underline|textsuperscript|textsubscript|mbox|text|url|href)\s*/);
   if(cmd){const g=group(s,i+cmd[0].length);if(g){
    const tags={textbf:'strong',textit:'em',emph:'em',texttt:'code',textsc:'span',underline:'u',textsuperscript:'sup',textsubscript:'sub'};
    if(cmd[1]==='url'||cmd[1]==='href'){const label=cmd[1]==='href'?group(s,g.end):null;out+=/^https?:\/\//i.test(g.text)?'<a href="'+escapeHTML(g.text)+'" target="_blank" rel="noopener noreferrer">'+inline(label?label.text:g.text,depth+1)+'</a>':inline(label?label.text:g.text,depth+1);i=label?label.end:g.end;continue;}
    const tag=tags[cmd[1]]||'span';out+='<'+tag+'>'+inline(g.text,depth+1)+'</'+tag+'>';i=g.end;continue;
   }}
   const legacy=tail.match(/^\{\\(bf|it|em|tt|sc)\s+/);
   if(legacy){const g=group(s,i);if(g){const tag={bf:'strong',it:'em',em:'em',tt:'code',sc:'span'}[legacy[1]];out+='<'+tag+'>'+inline(g.text.replace(/^\\\w+\s+/,''),depth+1)+'</'+tag+'>';i=g.end;continue;}}
   if(tail.startsWith('**')){const end=s.indexOf('**',i+2);if(end>i+2){out+='<strong>'+inline(s.slice(i+2,end),depth+1)+'</strong>';i=end+2;continue;}}
   if(s[i]==='*'&&s[i+1]&&!/\s/.test(s[i+1])){const end=s.indexOf('*',i+1);if(end>i+1){out+='<em>'+inline(s.slice(i+1,end),depth+1)+'</em>';i=end+1;continue;}}
   const escaped=tail.match(/^\\([%&#_$ {}])/);if(escaped){out+=escapeHTML(escaped[1]);i+=2;continue;}
   const spacing=tail.match(/^\\(?:,|;|!|quad\b|qquad\b|smallskip\b|noindent\b)/);if(spacing){out+=' ';i+=spacing[0].length;continue;}
   if(tail.startsWith('\\\\')){out+='<br>';i+=2;continue;}
   const unknown=tail.match(/^\\[a-zA-Z]+(?:\{\})?/);
   if(unknown){out+='<code class="source-macro" title="Macro definition missing from source">'+escapeHTML(unknown[0])+'</code>';i+=unknown[0].length;continue;}
   out+=escapeHTML(s[i++]);
  }
  return out;
 }
 return inline(s);
}
root.AbstractMarkup={render,decode};
})(typeof window==='undefined'?globalThis:window);
