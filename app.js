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
document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const body = `Имя: ${values.get('name')}\nТелефон: ${values.get('phone')}\n\n${values.get('comment') || ''}`;
  const address = `mailto:9031602028@mail.ru?subject=${encodeURIComponent('Обсудим ваше мероприятие')}&body=${encodeURIComponent(body)}`;
  window.location.href = address;
  document.querySelector('#form-status').textContent = 'Подготовлено письмо. Отправьте его в открывшейся почтовой программе. Если она не открылась, напишите на 9031602028@mail.ru или в мессенджер.';
});
