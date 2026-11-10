const maxChannelUrl = 'https://max.ru/channel_grigatarget';
for (const link of document.querySelectorAll('.max-link')) link.href = maxChannelUrl;

// Track an outbound click, not a channel subscription.
document.addEventListener('click', function(event) {
  const link = event.target.closest('a.max-link');
  if (!link || typeof window.ym !== 'function') return;
  const params = { placement: ['hero', 'middle', 'footer'][Array.from(document.querySelectorAll('.max-link')).indexOf(link)] || 'other' };
  if (event.defaultPrevented) { window.ym(109498085, 'reachGoal', 'max_channel_click', params); return; }
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    window.ym(109498085, 'reachGoal', 'max_channel_click', params);
    return;
  }
  event.preventDefault();
  let navigated = false;
  const go = function() { if (!navigated) { navigated = true; window.location.assign(link.href); } };
  const timer = window.setTimeout(go, 500);
  try { window.ym(109498085, 'reachGoal', 'max_channel_click', params, function() { window.clearTimeout(timer); go(); }); }
  catch (_) { window.clearTimeout(timer); go(); }
});
