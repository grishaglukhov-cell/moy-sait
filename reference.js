const YM_ID=109498085,goal=n=>{try{if(window.ym)ym(YM_ID,'reachGoal',n)}catch(e){}};
const unlock=()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open')};
const dialog=document.querySelector('#brief');let opener;
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{opener=button;if(button.dataset.service)dialog.querySelector('textarea').value='Интересует '+button.dataset.service;goal('form_open');dialog.showModal();document.body.classList.add('dialog-open');}));
dialog.querySelector('.close-dialog').addEventListener('click',()=>{dialog.close();unlock()});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){dialog.close();unlock()}}});dialog.addEventListener('close',()=>{unlock();opener?.focus();});dialog.addEventListener('cancel',()=>setTimeout(unlock));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',b===button);});document.querySelectorAll('.case').forEach(card=>card.hidden=button.dataset.filter!=='all'&&card.dataset.niche!==button.dataset.filter);}));
document.querySelectorAll('.lead-form').forEach(form=>form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const button=form.querySelector('[type="submit"]'),status=form.querySelector('.form-status'),data=new FormData(form);const safe=v=>String(v||'').replace(/[<>&]/g,'');button.disabled=true;status.textContent='Отправляем…';const text='Новая заявка — сайт Григория Глухова\nИмя: '+safe(data.get('name'))+'\nКонтакт: '+safe(data.get('contact'))+'\nПроект: '+safe(data.get('message'));try{const response=await fetch("https://grishaglukhov-cell-moy-sait-f46c.twc1.net",{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text}),signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error();const result=await response.json();if(result.ok===false||result.success===false||result.error)throw new Error();goal(form.closest('#promo')?'lead_promo':form.closest('dialog')?'lead_modal':'lead_form');goal('lead');try{localStorage.setItem('gg_lead_sent','1')}catch(e){}status.textContent='Спасибо! Заявка отправлена. Свяжусь с вами по указанному контакту.';form.reset();}catch{status.innerHTML='Не удалось подтвердить отправку. <a href="https://t.me/grigatarget" target="_blank" rel="noopener">Напишите мне в Telegram ↗</a>';}finally{button.disabled=false;}}));
const caseTabs=[...document.querySelectorAll('[data-case]')];
function selectCase(button,focus=false){caseTabs.forEach(tab=>{const active=tab===button;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!active;});if(focus)button.focus();}
caseTabs.forEach((button,index)=>{button.addEventListener('click',()=>selectCase(button));button.addEventListener('keydown',event=>{let next;if(['ArrowDown','ArrowRight'].includes(event.key))next=(index+1)%caseTabs.length;if(['ArrowUp','ArrowLeft'].includes(event.key))next=(index-1+caseTabs.length)%caseTabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=caseTabs.length-1;if(next!==undefined){event.preventDefault();selectCase(caseTabs[next],true);}});});

document.querySelectorAll('a[href^="tel:"]').forEach(a=>a.addEventListener('click',()=>{goal('click_phone');goal('lead_contact')}));
document.querySelectorAll('a[href^="https://t.me/"]').forEach(a=>a.addEventListener('click',()=>{goal('click_telegram');goal('lead_contact')}));
document.querySelectorAll('a[href^="https://vk.com/"]').forEach(a=>a.addEventListener('click',()=>goal('click_vk')));

/* Всплывающее окно со скидкой -------------------------------------------------
   PROMO_DEADLINE — реальная дата окончания акции, например '2026-09-30T23:59:59+03:00'.
   Пока строка пустая, каждому посетителю отсчитывается персональное окно
   PROMO_WINDOW_MS; оно запоминается в браузере, не сбрасывается при обновлении
   страницы и после истечения больше не начинается заново. */
const PROMO_DEADLINE='';
const PROMO_WINDOW_MS=(6*60+23)*60*1000;

(()=>{
const promo=document.querySelector('#promo');
if(!promo||!promo.showModal)return;
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},
          set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const ss={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},
          set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}};

const deadline=(()=>{
  if(PROMO_DEADLINE){const t=Date.parse(PROMO_DEADLINE);if(!isNaN(t))return t}
  const saved=parseInt(ls.get('gg_promo_until'),10);
  if(saved)return saved;
  const t=Date.now()+PROMO_WINDOW_MS;ls.set('gg_promo_until',String(t));return t;
})();

const pad=n=>String(n).padStart(2,'0');
const cell={h:promo.querySelector('[data-t="h"]'),m:promo.querySelector('[data-t="m"]'),s:promo.querySelector('[data-t="s"]')};
let timer;

function left(){return deadline-Date.now()}
function paint(){
  const ms=left();
  if(ms<=0){finish();return}
  const t=Math.floor(ms/1000);
  cell.h.textContent=pad(Math.floor(t/3600));
  cell.m.textContent=pad(Math.floor(t%3600/60));
  cell.s.textContent=pad(t%60);
}
function finish(){
  clearInterval(timer);
  promo.classList.add('is-done');
  if(promo.open)close();
}
function close(){
  promo.close();clearInterval(timer);unlock();
}

function open(){
  if(left()<=0)return;
  if(document.querySelector('dialog[open]'))return false;   // не перебиваем открытую форму
  ss.set('gg_promo_seen','1');
  paint();
  timer=setInterval(paint,1000);
  const t=Math.floor(left()/1000);
  const sr=promo.querySelector('[data-promo-sr]');
  if(sr)sr.textContent='Предложение действует ещё '+Math.floor(t/3600)+' ч '+Math.floor(t%3600/60)+' мин';
  promo.showModal();
  document.body.classList.add('dialog-open');
  goal('promo_open');
  return true;
}

promo.querySelector('.close-dialog').addEventListener('click',close);
promo.addEventListener('click',e=>{
  if(e.target!==promo)return;
  const r=promo.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();
});
promo.addEventListener('close',()=>{clearInterval(timer);unlock()});
promo.addEventListener('cancel',()=>setTimeout(()=>{clearInterval(timer);unlock()}));

// показываем один раз за сессию и только тем, кто ещё не оставил заявку
if(ss.get('gg_promo_seen')||ls.get('gg_lead_sent')||left()<=0)return;

let armed=true;
const fire=()=>{if(!armed)return;if(open()!==false)armed=false};
const byTime=setTimeout(fire,25000);
const byScroll=()=>{
  const h=document.documentElement;
  if((h.scrollTop+innerHeight)/h.scrollHeight>.55)fire();
};
const byExit=e=>{if(e.clientY<=0&&!e.relatedTarget)fire()};
addEventListener('scroll',byScroll,{passive:true});
if(!matchMedia('(hover:none)').matches)document.addEventListener('mouseout',byExit);
addEventListener('pagehide',()=>{clearTimeout(byTime);removeEventListener('scroll',byScroll)});
})();
