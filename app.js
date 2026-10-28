'use strict';
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
menu.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  nav.classList.toggle('open', expanded);
});
nav.addEventListener('click', event => {
  if (event.target.closest('a')) {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  }
});
const dialog = document.querySelector('#lightbox');
const displayedPhoto = document.querySelector('#lightbox-image');
const caption = document.querySelector('#lightbox-caption');
let photos = [], index = 0, activeTrigger;
function showPhoto() {
  const thumbnail = photos[index].querySelector('img');
  displayedPhoto.src = thumbnail.src;
  displayedPhoto.alt = thumbnail.alt;
  caption.textContent = `${thumbnail.alt} · ${index + 1} / ${photos.length}`;
}
function changePhoto(direction) {
  index = (index + direction + photos.length) % photos.length;
  showPhoto();
}
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-gallery]');
  if (!trigger) return;
  const group = trigger.dataset.gallery;
  photos = [...document.querySelectorAll(`.gallery [data-gallery="${group}"]`)];
  index = Number(trigger.dataset.index);
  activeTrigger = trigger;
  showPhoto();
  dialog.showModal();
  document.body.classList.add('modal-open');
});
document.querySelector('#close-lightbox').addEventListener('click', () => dialog.close());
document.querySelector('#previous-photo').addEventListener('click', () => changePhoto(-1));
document.querySelector('#next-photo').addEventListener('click', () => changePhoto(1));
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); changePhoto(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); changePhoto(1); }
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  activeTrigger?.focus();
});
const COUNTER = 113801854;
function goal(name) {
  if (typeof window.ym === 'function') window.ym(COUNTER, 'reachGoal', name);
}
// Заявки уходят в MAX через max-relay (ветка max-relay в moy-sait, Timeweb app 247551).
const LEAD_ENDPOINT = 'https://grishaglukhov-cell-moy-sait-f46c.twc1.net';

// Скидка 20% действует 10 часов с первого визита; дедлайн хранится в браузере,
// поэтому перезагрузка страницы не сбрасывает таймер.
const OFFER_KEY = 'shelest_offer_deadline';
const OFFER_MS = 10 * 60 * 60 * 1000;
let offerDeadline = Date.now() + OFFER_MS;
try {
  const saved = Number(localStorage.getItem(OFFER_KEY));
  if (saved > 0) offerDeadline = saved;
  else localStorage.setItem(OFFER_KEY, String(offerDeadline));
} catch {}
const offerActive = () => offerDeadline - Date.now() > 0;

async function sendLead(form, source) {
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled || !form.reportValidity()) return false;
  const data = new FormData(form);
  // Боты заполняют скрытое поле — делаем вид, что всё прошло.
  if (String(data.get('website') || '')) return true;
  const digits = String(data.get('phone')).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) { status.textContent = 'Проверьте номер телефона: нужно от 10 до 15 цифр.'; return false; }
  const phone = digits.length === 10 ? '7' + digits : digits.replace(/^8(?=\d{10}$)/, '7');
  const params = new URLSearchParams(location.search);
  const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid']
    .filter(key => params.get(key)).map(key => key + '=' + params.get(key).slice(0, 200)).join(', ');
  // Relay шлёт текст в MAX как HTML, поэтому пользовательский ввод экранируем.
  const safe = value => String(value || '').trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '—';
  const text = 'Новая заявка — Татьяна Шелест (eventagentstvomsk.ru)' +
    '\nИмя: ' + safe(data.get('name')) +
    '\nТелефон: +' + phone +
    (data.has('comment') ? '\nО мероприятии: ' + safe(data.get('comment')) : '') +
    '\nФорма: ' + source +
    (offerActive() ? '\nСкидка 20%: да (успел до конца таймера)' : '') +
    (utm ? '\nМетки: ' + safe(utm) : '');
  button.disabled = true;
  status.textContent = 'Отправляем заявку…';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal: controller.signal });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error('Delivery not confirmed');
    goal('form_submit');
    form.reset();
    status.textContent = '';
    return true;
  } catch {
    const wa = 'https://wa.me/79031602028?text=' + encodeURIComponent('Здравствуйте! Хочу обсудить мероприятие.\nИмя: ' + data.get('name') + '\nТелефон: +' + phone);
    status.innerHTML = 'Не удалось отправить заявку. Данные остались в форме — попробуйте ещё раз, позвоните <a href="tel:+79031602028">+7 (903) 160-20-28</a> или <a href="' + wa + '" target="_blank" rel="noopener">напишите в WhatsApp</a>.';
    return false;
  } finally {
    clearTimeout(timer);
    button.disabled = false;
  }
}

function showSuccess(form, success) {
  form.hidden = true;
  success.hidden = false;
  success.focus({ preventScroll: true });
}

const contactForm = document.querySelector('#contact-form');
const contactSuccess = document.querySelector('#contact-success');
contactForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (await sendLead(contactForm, 'форма внизу страницы')) {
    showSuccess(contactForm, contactSuccess);
    contactSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

// Всплывающее окно заявки со скидкой — открывается кнопками в первых блоках.
const leadModal = document.querySelector('#lead-modal');
const leadForm = document.querySelector('#lead-form');
const leadSuccess = document.querySelector('#lead-success');
const offer = document.querySelector('#offer');
const timerParts = { h: offer.querySelector('[data-t="h"]'), m: offer.querySelector('[data-t="m"]'), s: offer.querySelector('[data-t="s"]') };
let leadSource = '';
let tick;
function renderTimer() {
  const left = offerDeadline - Date.now();
  if (left <= 0) {
    offer.hidden = true;
    leadSuccess.querySelector('[data-offer-note]').hidden = true;
    clearInterval(tick);
    return;
  }
  const total = Math.floor(left / 1000);
  const pad = n => String(n).padStart(2, '0');
  timerParts.h.textContent = pad(Math.floor(total / 3600));
  timerParts.m.textContent = pad(Math.floor(total % 3600 / 60));
  timerParts.s.textContent = pad(total % 60);
}
document.querySelectorAll('[data-lead-open]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  leadSource = 'всплывающее окно (кнопка «' + link.dataset.leadOpen + '»)';
  renderTimer();
  clearInterval(tick);
  if (offerActive()) tick = setInterval(renderTimer, 1000);
  leadModal.showModal();
  document.body.classList.add('modal-open');
  goal('popup_open');
}));
leadModal.querySelector('.lead-modal-close').addEventListener('click', () => leadModal.close());
leadModal.addEventListener('click', event => { if (event.target === leadModal) leadModal.close(); });
leadModal.addEventListener('close', () => {
  clearInterval(tick);
  document.body.classList.remove('modal-open');
});
leadForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (await sendLead(leadForm, leadSource)) {
    goal('popup_submit');
    showSuccess(leadForm, leadSuccess);
  }
});
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href.startsWith('tel:')) goal('click_phone');
  else if (href.includes('wa.me')) goal('click_whatsapp');
  else if (href.includes('t.me')) goal('click_telegram');
  else if (href.startsWith('mailto:')) goal('click_email');
});
