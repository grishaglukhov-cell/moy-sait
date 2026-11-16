'use strict';
const COUNTER = 113801854;
const LEAD_ENDPOINT = 'https://grishaglukhov-cell-moy-sait-f46c.twc1.net';
const safe = value => String(value || '').trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function goal(name) { if (typeof window.ym === 'function') window.ym(COUNTER, 'reachGoal', name); }
const form = document.querySelector('#request-form');
let requestId;
form.addEventListener('input', () => { requestId = undefined; });
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type=submit]');
  const status = document.querySelector('#status');
  if (button.disabled || !form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  const params = new URLSearchParams(location.search);
  data.utm = Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'].filter(key => params.has(key)).map(key => [key, params.get(key).slice(0,200)]));
  const digits = data.phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    status.className = 'error';
    status.textContent = 'Проверьте номер телефона: нужно от 10 до 15 цифр.';
    return;
  }
  if (data.website) return;
  requestId ||= crypto.randomUUID();
  const phone = digits.length === 10 ? '7' + digits : digits.replace(/^8(?=\d{10}$)/, '7');
  const text = 'Новая заявка — Новогодний корпоратив | Татьяна Шелест' +
    '\nИмя: ' + safe(data.name) + '\nТелефон: +' + phone +
    '\nИсточник: https://newyear.eventagentstvomsk.ru' + '\nНомер заявки: ' + requestId +
    (Object.keys(data.utm).length ? '\nМетки: ' + Object.entries(data.utm).map(([key,value]) => key + '=' + safe(value)).join(', ') : '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);
  button.disabled = true;
  status.className = '';
  status.textContent = 'Отправляем заявку…';
  try {
    const response = await fetch(LEAD_ENDPOINT, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({text}), signal: controller.signal
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error('Delivery not confirmed');
    goal('lead');
    goal('form_submit');
    status.className = 'success';
    status.textContent = 'Спасибо! Заявка доставлена в MAX. Татьяна свяжется с вами по указанному телефону.';
    form.reset();
    requestId = undefined;
  } catch {
    status.className = 'error';
    status.textContent = 'Не удалось подтвердить доставку. Данные остались в форме. Попробуйте ещё раз или позвоните +7 (903) 160-20-28.';
  } finally {
    clearTimeout(timer);
    button.disabled = false;
  }
});

const workDialog = document.querySelector('#work-gallery');
const fullImage = document.querySelector('#work-full-image');
const workCaption = document.querySelector('#work-caption');
let albumPhotos = [], albumIndex = 0, galleryTrigger;
function renderWorkPhoto() {
  const thumbnail = albumPhotos[albumIndex].querySelector('img');
  fullImage.src = thumbnail.src;
  fullImage.alt = thumbnail.alt;
  workCaption.textContent = `${thumbnail.alt} · ${albumIndex + 1} / ${albumPhotos.length}`;
}
function stepWorkPhoto(step) {
  albumIndex = (albumIndex + step + albumPhotos.length) % albumPhotos.length;
  renderWorkPhoto();
}
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-album]');
  if (!trigger) return;
  galleryTrigger = trigger;
  albumPhotos = [...document.querySelectorAll(`.work-thumbs [data-album="${trigger.dataset.album}"]`)];
  albumIndex = Number(trigger.dataset.index);
  renderWorkPhoto();
  workDialog.showModal();
  document.body.classList.add('gallery-open');
});
workDialog.querySelector('.work-close').addEventListener('click', () => workDialog.close());
workDialog.querySelector('.work-prev').addEventListener('click', () => stepWorkPhoto(-1));
workDialog.querySelector('.work-next').addEventListener('click', () => stepWorkPhoto(1));
workDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); stepWorkPhoto(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); stepWorkPhoto(1); }
});
workDialog.addEventListener('click', event => { if (event.target === workDialog) workDialog.close(); });
workDialog.addEventListener('close', () => {
  document.body.classList.remove('gallery-open');
  galleryTrigger?.focus();
});

// Same contact and conversion goals as the main event agency website.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href.startsWith('tel:')) goal('click_phone');
  else if (href.includes('wa.me')) goal('click_whatsapp');
  else if (href.includes('t.me')) goal('click_telegram');
  else if (href.startsWith('mailto:')) goal('click_email');
  else if (href === '#request') goal('popup_open');
});
