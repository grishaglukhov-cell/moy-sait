'use strict';
const dialog = document.getElementById('document-dialog');
const documentImage = document.getElementById('document-image');
document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', () => {
    documentImage.src = button.dataset.image;
    documentImage.alt = button.querySelector('img').alt;
    dialog.showModal();
  });
});
dialog.querySelector('button').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if(event.target === dialog) { const box = dialog.getBoundingClientRect(); if(event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => { document.getElementById('topic').value = link.dataset.service; }));
document.getElementById('more-reviews').addEventListener('click', event => {
  const hidden = [...document.querySelectorAll('.review[hidden]')];
  hidden.slice(0,6).forEach(card => card.hidden = false);
  if (hidden.length <= 6) event.currentTarget.hidden = true;
});

// Заявки уходят в MAX через max-relay (ветка max-relay в moy-sait, Timeweb app 247551).
const LEAD_ENDPOINT = 'https://grishaglukhov-cell-moy-sait-f46c.twc1.net';
// Номер счётчика Яндекс.Метрики (null — Метрика не грузится, цели не шлются).
const METRIKA_ID = 113207324;

if (METRIKA_ID) {
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
  ym(METRIKA_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
}
const track = goal => { if (METRIKA_ID && window.ym) ym(METRIKA_ID, 'reachGoal', goal); };

document.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href') || '';
  if (href.startsWith('tel:')) { track('click_phone'); track('lead_contact'); }
  else if (href.includes('wa.me')) { track('click_whatsapp'); track('lead_contact'); }
  else if (href.includes('t.me')) { track('click_telegram'); track('lead_contact'); }
  else if (href.startsWith('mailto:')) track('click_email');
});

// Отправка заявки в MAX. Общая для нижней формы (#contact-form) и всплывающего окна (#lead-form).
async function sendLead(form, source) {
  const formStatus = form.querySelector('.form-status');
  const data = new FormData(form);
  // Боты заполняют скрытое поле — делаем вид, что всё прошло, чтобы не повторяли.
  if (String(data.get('website') || '')) { form.reset(); return true; }
  const digits = String(data.get('phone')).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) { formStatus.textContent = 'Проверьте номер телефона: нужно от 10 до 15 цифр.'; return false; }
  const phone = digits.length === 10 ? '7' + digits : digits.replace(/^8(?=\d{10}$)/, '7');
  const params = new URLSearchParams(location.search);
  const utm = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid']
    .filter(key => params.get(key)).map(key => key + '=' + params.get(key).slice(0, 200)).join(', ');
  // Relay шлёт текст в MAX как HTML, поэтому пользовательский ввод экранируем.
  const safe = value => String(value || '').trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '—';
  const text = 'Новая заявка — сайт «Ваше право» (vashepravo-sochi.ru)' +
    '\nИмя: ' + safe(data.get('name')) +
    '\nТелефон: +' + phone +
    '\nНаправление: ' + safe(data.get('topic')) +
    '\nСитуация: ' + safe(data.get('question')) +
    '\nФорма: ' + source +
    (utm ? '\nМетки: ' + safe(utm) : '');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  formStatus.textContent = 'Отправляем заявку…';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal: controller.signal });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error('Delivery not confirmed');
    form.reset();
    formStatus.textContent = '';
    track('lead');
    return true;
  } catch {
    formStatus.textContent = 'Не удалось отправить заявку. Данные остались в форме — попробуйте ещё раз или позвоните: +7 (918) 207-09-86.';
    return false;
  } finally {
    clearTimeout(timer); button.disabled = false;
  }
}

const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (contactForm.querySelector('button[type="submit"]').disabled || !contactForm.reportValidity()) return;
  if (await sendLead(contactForm, 'форма внизу страницы')) {
    contactForm.querySelector('.form-status').textContent = 'Заявка принята. Юрист перезвонит в рабочее время (Пн–Пт, 10:00–17:00).';
    track('lead_form');
  }
});

// Всплывающее окно с заявкой: открывается любой кнопкой, ведущей на #consultation.
const leadDialog = document.getElementById('lead-dialog');
const leadForm = document.getElementById('lead-form');
const leadSuccess = leadDialog.querySelector('.lead-success');
const leadTitle = document.getElementById('lead-title');
function openLead(topic) {
  leadForm.hidden = false;
  leadSuccess.hidden = true;
  document.getElementById('lead-topic').value = topic || 'Нужна консультация';
  leadTitle.textContent = topic ? 'Консультация: ' + topic.toLowerCase() : 'Оставьте заявку на консультацию';
  leadDialog.showModal();
  track('form_open');
}
document.querySelectorAll('a[href="#consultation"]').forEach(link => link.addEventListener('click', event => {
  if (typeof leadDialog.showModal !== 'function') return; // старый браузер — просто прокрутка к форме внизу
  event.preventDefault();
  openLead(link.dataset.service);
}));
leadDialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => leadDialog.close()));
leadDialog.addEventListener('click', event => { if (event.target === leadDialog) leadDialog.close(); });
leadForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (leadForm.querySelector('button[type="submit"]').disabled || !leadForm.reportValidity()) return;
  if (await sendLead(leadForm, 'всплывающее окно')) {
    leadForm.hidden = true;
    leadSuccess.hidden = false;
    track('lead_modal');
  }
});
