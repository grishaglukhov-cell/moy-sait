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
document.getElementById('contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if(!form.reportValidity()) return;
  const data = new FormData(form);
  const text = `Здравствуйте! Меня зовут ${data.get('name')}.\nТелефон: ${data.get('phone')}\nНаправление: ${data.get('topic')}\n\n${data.get('question') || 'Хочу записаться на консультацию.'}`;
  window.location.href = `mailto:zina.demidova.82@mail.ru?subject=${encodeURIComponent('Запрос на консультацию — Ваше Право')}&body=${encodeURIComponent(text)}`;
  document.getElementById('form-status').textContent = 'Письмо подготовлено для почтового приложения. Если оно не открылось, позвоните по номеру +7 (918) 207-09-86 или напишите в WhatsApp.';
});
