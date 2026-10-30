// On the Google account chooser, click the configured account (or the only one) so the SSO redirect continues.
(async () => {
  const { email } = await chrome.storage.sync.get({ email: '' });
  const tryClick = () => {
    const tiles = [...document.querySelectorAll('[data-identifier], [data-email]')];
    if (!tiles.length) return false;
    const match = email
      ? tiles.find(t => (t.dataset.identifier || t.dataset.email || '').toLowerCase() === email.toLowerCase())
      : tiles[0];
    if (!match) return false;
    match.click();
    chrome.runtime.sendMessage({ type: 'account-picked' });
    return true;
  };
  if (tryClick()) return;
  const obs = new MutationObserver(() => { if (tryClick()) obs.disconnect(); });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 30000);
})();
