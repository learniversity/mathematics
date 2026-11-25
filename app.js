const main=document.querySelector('#main');
const theme=document.querySelector('#theme');
let curriculum;
try{document.documentElement.dataset.theme=localStorage.getItem('math-theme')==='dark'?'dark':'light'}catch{}
theme.textContent=document.documentElement.dataset.theme==='dark'?'Light mode':'Dark mode';
theme.onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;theme.textContent=next==='dark'?'Light mode':'Dark mode';try{localStorage.setItem('math-theme',next)}catch{}};
let renderId=0;
async function render(){
 const request=++renderId;
 const [page='home',id]=location.hash.slice(1).split('/');
 const route=page||'home';
 document.querySelectorAll('nav a').forEach(a=>{if(a.hash==='#'+(route==='lesson'||route==='level'?'learn':route))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 main.replaceChildren();
 if(!curriculum){main.textContent='Loading library…';try{const res=await fetch('data/curriculum.json');if(!res.ok)throw Error('Index unavailable');curriculum=await res.json()}catch{if(request===renderId)main.textContent='Unable to load the library. Please refresh to try again.';return}if(request!==renderId)return;main.replaceChildren()}
 const levels=curriculum.levels, topics=curriculum.topics;
 if(route==='home'||route==='learn'){
 main.innerHTML=route==='home'?'<div class="hero"><p class="muted">THE LEARNIVERSITY LIBRARY</p><h1>Mathematics for everyone.</h1><p>From counting and addition to advanced mathematics. Explore definitions, formulas, worked examples and exercises at your own pace.</p><p class="formula">1 + 1 = 2 &nbsp; · &nbsp; a² + b² = c²</p><a href="#learn">Explore the library →</a></div><h2>Learning levels</h2>':'<h1>Learn mathematics</h1><p class="muted">Choose a level or search the published lessons.</p>';
 const search=document.createElement('input');search.id='search';search.type='search';search.placeholder='Search topics';search.setAttribute('aria-label','Search topics');main.append(search);
 const grid=document.createElement('div');grid.className='grid';main.append(grid);
 const draw=()=>{grid.replaceChildren();const q=search.value.trim().toLowerCase();for(const item of q?topics.filter(t=>t.title.toLowerCase().includes(q)):levels){const a=document.createElement('a');a.className='tile';a.href=q?'#lesson/'+item.id:'#level/'+item.id;const h=document.createElement('h3');h.textContent=item.title;const p=document.createElement('p');const count=topics.filter(t=>t.level===item.id).length;p.textContent=q?levels.find(l=>l.id===item.level).title:count?count+' published lessons':'Planned · Coming later';a.append(h,p);grid.append(a)}if(!grid.children.length)grid.textContent='No matching topics.'};search.oninput=draw;draw();return
 }
 if(route==='level'||route==='practice'||route==='formulas'){
 const level=levels.find(l=>l.id===id);const heading=document.createElement('h1');heading.textContent=route==='level'?(level?.title||'Unknown level'):route==='practice'?'Practice':'Formulas';main.append(heading);
 const list=route==='level'?topics.filter(t=>t.level===id):topics;
 if(!list.length){main.append('Lessons are not published for this level yet.');return}
 for(const t of list){const a=document.createElement('a');a.className='tile';a.href='#lesson/'+t.id+(route==='practice'?'/practice':route==='formulas'?'/formulas':'');a.textContent=t.title+' · '+levels.find(l=>l.id===t.level).title;main.append(a)}
 return
 }
 if(route==='lesson'){
 const t=topics.find(t=>t.id===id);if(!t){main.textContent='Lesson not found.';return}
 main.textContent='Loading lesson…';let d;try{const res=await fetch(t.path);if(!res.ok)throw Error();d=await res.json()}catch{if(request===renderId)main.textContent='Unable to load this lesson. Please try again.';return}if(request!==renderId)return;main.replaceChildren();
 const layout=document.createElement('div');layout.className='layout';const aside=document.createElement('aside');const article=document.createElement('article');layout.append(aside,article);main.append(layout);
 const back=document.createElement('a');back.href='#level/'+t.level;back.textContent='← '+levels.find(l=>l.id===t.level).title;aside.append(back);
 for(const s of topics.filter(s=>s.level===t.level)){const a=document.createElement('a');a.href='#lesson/'+s.id;a.textContent=s.title;if(s.id===id)a.setAttribute('aria-current','page');aside.append(a)}
 const h=document.createElement('h1');h.textContent=d.title;article.append(h);
 const intro=document.createElement('p');intro.textContent=d.introduction;article.append(intro);
 for(const [title,value] of [['Definition',d.definition],['Symbols',d.symbols],['Formulas',d.formulas],['Rules & Properties',d.rules],['Examples',d.examples],['Common Mistakes',d.commonMistakes],['Exercises',d.exercises],['Summary',d.summary]]){
 if(!value||(Array.isArray(value)&&!value.length))continue;
 const section=document.createElement('section');section.id=title.toLowerCase().replaceAll(' ','-');const heading=document.createElement('h2');heading.textContent=title;section.append(heading);article.append(section);
 if(title==='Exercises'){
 const form=document.createElement('form');const fields=[];for(const [i,q] of value.entries()){const row=document.createElement('div');row.className='question';const label=document.createElement('label');label.htmlFor='answer-'+i;label.textContent=(i+1)+'. '+q.question;const input=document.createElement('input');input.id=label.htmlFor;input.required=true;input.autocomplete='off';input.type='text';if(q.type==='numeric')input.inputMode='decimal';const status=document.createElement('span');status.className='feedback';status.setAttribute('aria-live','polite');const detail=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Solution';const p=document.createElement('p');p.textContent=q.solution||String(q.answer);detail.append(summary,p);row.append(label,input,status,detail);form.append(row);fields.push({q,input,status,detail})}
 const actions=document.createElement('div');actions.className='actions';const check=document.createElement('button');check.className='primary';check.type='submit';check.textContent='Check answers';const reset=document.createElement('button');reset.type='reset';reset.textContent='Reset';const score=document.createElement('p');score.setAttribute('aria-live','polite');actions.append(check,reset);form.append(actions,score);form.onsubmit=e=>{e.preventDefault();let correct=0;for(const {q,input,status} of fields){const v=input.value.trim();const ok=v!==''&&(q.type==='numeric'?Number.isFinite(Number(v))&&Number(v)===q.answer:v===String(q.answer));status.textContent=ok?'Correct':'Try again';if(ok)correct++}score.textContent='Score: '+correct+' / '+fields.length};form.onreset=()=>{fields.forEach(f=>{f.status.textContent='';f.detail.open=false});score.textContent=''};form.oninput=()=>{fields.forEach(f=>f.status.textContent='');score.textContent=''};section.append(form);continue
 }
 if(typeof value==='string'){const p=document.createElement('p');p.textContent=value;section.append(p);continue}
 for(const [i,v] of value.entries()){const block=document.createElement('div');block.className=title==='Formulas'?'formula':'example';if(typeof v==='string'){block.textContent=v}else if(title==='Examples'){const q=document.createElement('h3');q.textContent='Example '+(i+1);const p=document.createElement('p');p.textContent=v.question;block.append(q,p);for(const step of v.steps||[]){const s=document.createElement('p');s.textContent=step;block.append(s)}const a=document.createElement('strong');a.textContent='Answer: '+v.answer;block.append(a)}else{const strong=document.createElement('strong');strong.textContent=v.expression||v.symbol||v.title||'';const p=document.createElement('p');p.textContent=v.description||v.meaning||'';block.append(strong,p)}section.append(block)}
 }
 const related=document.createElement('section');const rh=document.createElement('h2');rh.textContent='Related topics';related.append(rh);for(const key of d.relatedTopics||[]){const item=topics.find(x=>x.id===key);if(item){const p=document.createElement('p');const a=document.createElement('a');a.href='#lesson/'+key;a.textContent=item.title;p.append(a);related.append(p)}}if(related.children.length>1)article.append(related);
 const target=location.hash.split('/')[2];if(target)document.getElementById(target==='practice'?'exercises':target)?.scrollIntoView();return
 }
 if(route==='about'){main.innerHTML='<h1>About Mathematics</h1><p>Learniversity is an independent learning library. Our lessons use original explanations, examples and exercises based on established mathematics. The learning levels are a suggested progression, not an official national syllabus.</p><p>Free to read. No login required. New lessons will be added progressively.</p>';return}
 main.textContent='Page not found. Use the navigation to return to the library.';
}
window.addEventListener('hashchange',()=>{window.scrollTo(0,0);render()});render();
