(() => {
  'use strict';
  const config = window.VP_CONFIG || {};
  // Carry only campaign identifiers across internal pages, never arbitrary query parameters.
  const campaignKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'];
  const currentParams = new URLSearchParams(window.location.search);
  document.querySelectorAll('a[href^="/"]').forEach(link => {
    const next = new URL(link.getAttribute('href'), window.location.origin);
    campaignKeys.forEach(key => {
      const value = currentParams.get(key);
      if (value) next.searchParams.set(key, value.slice(0, 300));
    });
    link.href = next.pathname + next.search + next.hash;
  });

  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  function closeMenu() {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  const dialog = document.getElementById('contact-dialog');
  let lastTrigger;
  let currentTopic = 'Консультация';
  let pending = false;
  const form = document.getElementById('lead-form');
  const status = document.getElementById('form-status');
  function track(name) {
    // Configure the approved Metrika loader separately; no tracker is loaded in the private preview.
    if (config.metrikaId && typeof window.ym === 'function') {
      window.ym(config.metrikaId, 'reachGoal', name);
    }
  }
  document.querySelectorAll('[data-event]').forEach(link => {
    link.addEventListener('click', () => track(link.dataset.event));
  });
  document.querySelectorAll('[data-contact]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      lastTrigger = trigger;
      currentTopic = trigger.dataset.contact || 'Консультация';
      document.getElementById('contact-topic').textContent = currentTopic;
      closeMenu();
      dialog.showModal();
      document.body.classList.add('modal-open');
      track('contact_open');
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    lastTrigger?.focus({ preventScroll: true });
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    const fields = new FormData(form);
    const phone = String(fields.get('phone') || '').replace(/\D/g, '');
    status.className = '';
    if (phone.length < 10 || phone.length > 15) {
      status.textContent = 'Проверьте номер телефона: нужно от 10 до 15 цифр.';
      status.className = 'error';
      return;
    }
    // Bots fill the hidden field; pretend success so they do not retry.
    if (String(fields.get('website') || '')) {
      status.textContent = 'Запрос принят. Юрист свяжется с вами в рабочее время.';
      status.className = 'success';
      form.reset();
      return;
    }
    if (!config.leadEndpoint) {
      status.textContent = 'Форма пока не подключена. Позвоните, пожалуйста: +7 918 207-09-86.';
      status.className = 'error';
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const attribution = {};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'].forEach(key => {
      const value = params.get(key); if (value) attribution[key] = value.slice(0,300);
    });
    pending = true;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Отправляем запрос…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      // The relay forwards this text to MAX with format: html, so user input is escaped.
      const safe = value => String(value || '').trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '—';
      const utm = Object.entries(attribution).map(([key, value]) => key + '=' + value).join(', ');
      const text = 'Новая заявка — сайт «Ваше право»' +
        '\nИмя: ' + safe(fields.get('name')) +
        '\nТелефон: +' + (phone.length === 10 ? '7' + phone : phone.replace(/^8(?=\d{10}$)/, '7')) +
        '\nВопрос: ' + safe(fields.get('question')) +
        '\nТема: ' + safe(currentTopic) +
        '\nСтраница: ' + safe(window.location.pathname) +
        (utm ? '\nМетки: ' + safe(utm) : '');
      const response = await fetch(config.leadEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      if (!response.ok || data.ok !== true) throw new Error('Delivery not confirmed');
      status.textContent = 'Запрос принят. Юрист свяжется с вами в рабочее время.';
      status.className = 'success';
      form.reset();
      track('lead_accepted');
    } catch {
      status.textContent = 'Не удалось подтвердить отправку. Данные сохранены в форме. Попробуйте ещё раз или позвоните: +7 918 207-09-86.';
      status.className = 'error';
    } finally {
      clearTimeout(timer);
      pending = false;
      submit.disabled = false;
    }
  });
})();
