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
document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const comment = (values.get('comment') || '').trim();
  const text = `Здравствуйте! Хочу обсудить мероприятие.\nИмя: ${values.get('name')}\nТелефон: ${values.get('phone')}` + (comment ? `\n${comment}` : '');
  goal('form_submit');
  window.open(`https://wa.me/79031602028?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  document.querySelector('#form-status').textContent = 'Открыли WhatsApp с вашим сообщением — нажмите «Отправить». Если не открылся, позвоните: +7 (903) 160-20-28.';
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
