
const WP='https://www.bacau.net/wp-json/wp/v2/posts?per_page=30&_embed=1';
const RSS='https://www.bacau.net/feed/';
const PROXY='https://api.allorigins.win/raw?url=';
let posts=[], activeCat='all', query='', lastUpdate=0, loading=false;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const strip=s=>{const d=document.createElement('div');d.innerHTML=s||'';return (d.textContent||'').trim()};
const esc=s=>(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const saved=()=>JSON.parse(localStorage.getItem('bacau_saved')||'[]');
const setSaved=v=>localStorage.setItem('bacau_saved',JSON.stringify(v));
function timeAgo(v){const d=new Date(v),s=(Date.now()-d)/1000;if(!isFinite(s))return '';if(s<3600)return `${Math.max(1,Math.floor(s/60))} min`;if(s<86400)return `${Math.floor(s/3600)} ore`;if(s<172800)return 'Ieri';return d.toLocaleDateString('ro-RO',{day:'numeric',month:'short'});}
function fromWP(a){return a.map(p=>({id:String(p.id),title:strip(p.title?.rendered),url:p.link,date:p.date,excerpt:strip(p.excerpt?.rendered).slice(0,190),content:p.content?.rendered||'',cat:(p._embedded?.['wp:term']?.[0]?.[0]?.name||'Bacău'),image:p._embedded?.['wp:featuredmedia']?.[0]?.source_url||''}));}
function fromRSS(xml){const doc=new DOMParser().parseFromString(xml,'text/xml');return [...doc.querySelectorAll('item')].map((x,i)=>({id:x.querySelector('guid')?.textContent||String(i),title:x.querySelector('title')?.textContent||'',url:x.querySelector('link')?.textContent||'',date:x.querySelector('pubDate')?.textContent||'',excerpt:strip(x.querySelector('description')?.textContent||'').slice(0,190),cat:x.querySelector('category')?.textContent||'Bacău',image:(x.querySelector('enclosure')?.getAttribute('url')||'')}));}
async function load(silent=false){
 if(loading) return;
 loading=true;
 if(!silent) $('#status').textContent='Se încarcă știrile…';
 try{let r=await fetch(WP+'&_='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;posts=fromWP(await r.json());}
 catch(e){try{let r=await fetch(PROXY+encodeURIComponent(RSS),{cache:'no-store'});if(!r.ok)throw 0;posts=fromRSS(await r.text());}catch(e2){posts=JSON.parse(localStorage.getItem('bacau_cache')||'[]');}}
 if(posts.length)localStorage.setItem('bacau_cache',JSON.stringify(posts));
 lastUpdate=Date.now();
 loading=false;
 $('#status').textContent=posts.length?`Actualizat ${new Date(lastUpdate).toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})}`:'Nu am putut încărca feedul.';
 render();
}
function card(p){
 const ids=saved(), on=ids.some(x=>x.id===p.id);
 return `<article class="card">${p.image?`<img class="hero" src="${esc(p.image)}" loading="lazy" alt="">`:''}<div class="body"><div class="meta"><span class="cat">${esc(p.cat)}</span><span>•</span><span>${esc(timeAgo(p.date))}</span></div><h2 class="title">${esc(p.title)}</h2>${p.excerpt?`<p class="excerpt">${esc(p.excerpt)}</p>`:''}<div class="actions"><a class="open read" href="#" data-id="${esc(p.id)}">Citește articolul</a><button class="save" data-id="${esc(p.id)}" aria-label="Salvează">${on?'♥':'♡'}</button></div></div></article>`;
}
function render(){
 let a=posts.filter(p=>(activeCat==='all'||p.cat.toLowerCase().includes(activeCat))&&(!query||(p.title+' '+p.excerpt).toLowerCase().includes(query)));
 $('#feed').innerHTML=a.length?a.map(card).join(''):'<div class="empty">Nicio știre găsită.</div>';
 bindSave();
}
function renderSaved(){const a=saved();$('#savedFeed').innerHTML=a.length?a.map(card).join(''):'<div class="empty">Nu ai salvat încă articole.</div>';bindSave();}
function bindSave(){$$('.read').forEach(a=>a.onclick=e=>{e.preventDefault();openReader(a.dataset.id);});$$('.save').forEach(b=>b.onclick=()=>{let a=saved(),p=posts.find(x=>x.id===b.dataset.id)||a.find(x=>x.id===b.dataset.id);if(a.some(x=>x.id===b.dataset.id))a=a.filter(x=>x.id!==b.dataset.id);else if(p)a.unshift(p);setSaved(a);render();renderSaved();});}
$('#searchBtn').onclick=()=>{$('#searchBox').classList.toggle('hidden');if(!$('#searchBox').classList.contains('hidden'))$('#searchInput').focus();}
$('#searchInput').oninput=e=>{query=e.target.value.trim().toLowerCase();render();}
$$('.chip').forEach(b=>b.onclick=()=>{$$('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeCat=b.dataset.cat;render();});
$$('[data-view]').forEach(b=>b.onclick=()=>{const v=b.dataset.view;setView(v);if(v==='saved')renderSaved();});


let readerPost=null;
function cleanArticle(html){
 const d=document.createElement('div'); d.innerHTML=html||'';
 d.querySelectorAll('script,style,iframe,ins,form,noscript,.adsbygoogle,[class*="advert"],[id*="advert"],[class*="ad-"],[id*="ad-"]').forEach(x=>x.remove());
 d.querySelectorAll('a').forEach(a=>{a.target='_blank';a.rel='noopener'});
 return d.innerHTML;
}
function setView(v){
 $('#homeView').classList.toggle('hidden',v!=='home');
 $('#savedView').classList.toggle('hidden',v!=='saved');
 $('#aboutView').classList.toggle('hidden',v!=='about');
 $('#readerView').classList.toggle('hidden',v!=='reader');
 $$('.tab').forEach(x=>x.classList.toggle('active',x.dataset.view===v));
}
async function openReader(id){
 let p=posts.find(x=>x.id===id)||saved().find(x=>x.id===id); if(!p)return;
 readerPost=p; setView('reader'); window.scrollTo(0,0);
 $('#readerContent').innerHTML='<div class="readerLoading">Se încarcă articolul…</div>';
 let full=p;
 if(!p.content){
   const detailURL='https://www.bacau.net/wp-json/wp/v2/posts/'+encodeURIComponent(id)+'?_embed=1&_='+Date.now();
   try{
     let r=await fetch(detailURL,{cache:'no-store'});
     if(!r.ok) throw new Error('direct');
     let x=await r.json(); full=fromWP([x])[0]; readerPost=full;
   }catch(e){
     try{
       let r=await fetch(PROXY+encodeURIComponent(detailURL),{cache:'no-store'});
       if(!r.ok) throw new Error('proxy');
       let x=await r.json(); full=fromWP([x])[0]; readerPost=full;
     }catch(e2){}
   }
 }
 let content=cleanArticle(full.content||'');
 if(!content) content='<p>'+esc(full.excerpt||'Conținutul integral nu este disponibil prin API-ul public.')+'</p><p class="readerNotice">Conținutul integral nu a fost furnizat de API-ul public pentru acest articol.</p>';
 $('#readerContent').innerHTML=`<article class="readerArticle">${full.image?`<img class="readerHero" src="${esc(full.image)}" alt="">`:''}<div class="readerBody"><div class="readerMeta">${esc(full.cat)} · ${esc(timeAgo(full.date))}</div><h1 class="readerTitle">${esc(full.title)}</h1><div class="readerText">${content}</div><a class="readerSource" href="${esc(full.url)}" target="_blank" rel="noopener">Vezi originalul pe Bacău.NET ↗</a></div></article>`;
 updateReaderSave();
}
function updateReaderSave(){if(!readerPost)return;$('#readerSave').textContent=saved().some(x=>x.id===readerPost.id)?'♥':'♡'}
$('#readerBack').onclick=()=>{setView('home');window.scrollTo(0,0)};
$('#readerSave').onclick=()=>{if(!readerPost)return;let a=saved();a=a.some(x=>x.id===readerPost.id)?a.filter(x=>x.id!==readerPost.id):[readerPost,...a];setSaved(a);updateReaderSave()};
$('#readerShare').onclick=async()=>{if(!readerPost)return;try{if(navigator.share)await navigator.share({title:readerPost.title,url:readerPost.url});else window.open(readerPost.url,'_blank')}catch(e){}};

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load(true)});
window.addEventListener('focus',()=>{if(Date.now()-lastUpdate>15000)load(true)});
setInterval(()=>{if(document.visibilityState==='visible')load(true)},60000);
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
load();
