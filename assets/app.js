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
  const submissionKey = () => window.crypto.randomUUID();
  let requestId = submissionKey();
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
      document.getElementById('contact-email').href = 'mailto:zina.demidova.82@mail.ru?subject=' +
        encodeURIComponent('Консультация: ' + currentTopic) + '&body=' +
        encodeURIComponent('Здравствуйте, Зинаида Алексеевна!\n\nХочу записаться на консультацию.\nМой вопрос: \nУдобное время для связи: ');
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

  const validUrl = value => {
    if (!value) return false;
    try { const url = new URL(value, window.location.origin); return url.protocol === 'https:' || url.origin === window.location.origin; }
    catch { return false; }
  };
  if (validUrl(config.leadEndpoint) && validUrl(config.privacyUrl) && validUrl(config.consentUrl)) {
    form.hidden = false;
    document.getElementById('privacy-link').href = config.privacyUrl;
    document.getElementById('consent-link').href = config.consentUrl;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || form.hidden || !form.reportValidity()) return;
    const fields = new FormData(form);
    const phone = String(fields.get('phone') || '').replace(/\D/g, '');
    status.className = '';
    if (phone.length < 10 || phone.length > 15) {
      status.textContent = 'Проверьте номер телефона: нужно от 10 до 15 цифр.';
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
      const response = await fetch(config.leadEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ requestId, name: String(fields.get('name') || '').trim(), phone, topic: currentTopic,
          consent: fields.get('consent') === 'on', website: String(fields.get('website') || ''),
          page: window.location.pathname, attribution })
      });
      const data = await response.json();
      if (!response.ok || data.accepted !== true || !data.leadId) throw new Error('Delivery not confirmed');
      status.textContent = 'Запрос принят. Юрист свяжется с вами в рабочее время.';
      status.className = 'success';
      form.reset();
      requestId = submissionKey();
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
