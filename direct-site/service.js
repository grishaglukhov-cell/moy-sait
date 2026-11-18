const leadSourceKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'];
let leadSource={};
try {const query=new URLSearchParams(location.search);leadSource=JSON.parse(sessionStorage.getItem('greklama_lead_source')||'{}');if(leadSourceKeys.some(k=>query.has(k))){leadSource={};for(const k of leadSourceKeys)if(query.has(k))leadSource[k]=query.get(k).slice(0,250);sessionStorage.setItem('greklama_lead_source',JSON.stringify(leadSource));}}catch(_){leadSource={};}
document.querySelectorAll('.lead-form').forEach(form=>{
 const phone=form.querySelector('[name="phone"]'),button=form.querySelector('[type="submit"]'),status=form.querySelector('.form-status');
 let submitting=false,submitted=false;
 phone.addEventListener('input',()=>phone.setCustomValidity(''));
 form.querySelector('[name="name"]').addEventListener('input',event=>event.target.setCustomValidity(''));
 form.addEventListener('input',()=>{if(submitted){submitted=false;button.disabled=false;button.textContent='Отправить заявку';status.textContent='';}});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(submitting||submitted)return;
  const data=new FormData(form),name=String(data.get('name')||'').trim(),number=String(data.get('phone')||'').trim(),email=String(data.get('email')||'').trim();
  if(number.replace(/\D/g,'').length<10){phone.setCustomValidity('Укажите телефон с кодом города или оператора');form.reportValidity();return;}
  if(!name){form.querySelector('[name="name"]').setCustomValidity('Укажите ваше имя');form.reportValidity();return;}
  if(!form.reportValidity())return;
  const safe=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const text=['Новая заявка — greklama.ru','Имя: '+name,'Телефон: '+number,email?'Почта: '+email:'','Запрос: '+form.dataset.context,'Страница: '+location.origin+location.pathname,...leadSourceKeys.filter(k=>leadSource[k]).map(k=>k+': '+leadSource[k])].filter(Boolean).map(safe).join('\n');
  submitting=true;button.disabled=true;button.textContent='Отправляем…';status.textContent='Отправляем заявку. Пожалуйста, подождите.';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try {
   const response=await fetch('https://grishaglukhov-cell-moy-sait-f46c.twc1.net',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text}),signal:controller.signal});
   if(!response.ok)throw new Error('send_failed');const result=await response.json();if(result.ok!==true)throw new Error('not_confirmed');
   submitted=true;form.reset();button.textContent='Заявка отправлена';status.textContent='Спасибо! Заявка отправлена. Григорий свяжется с вами по указанному контакту.';
   try{if(typeof window.ym==='function'){window.ym(109498085,'reachGoal','lead');window.ym(109498085,'reachGoal','lead_form',{form_id:form.id});}}catch(_){}
  }catch(_){
   status.replaceChildren(document.createTextNode('Не удалось подтвердить отправку. '));const fallback=document.createElement('a');fallback.href='https://t.me/grigatarget';fallback.target='_blank';fallback.rel='noopener';fallback.textContent='Напишите Григорию в Telegram';status.append(fallback,document.createTextNode(' или позвоните +7 (912) 016-87-71.'));button.textContent='Повторить отправку';
  }finally{clearTimeout(timer);submitting=false;button.disabled=submitted;}
 });
});
