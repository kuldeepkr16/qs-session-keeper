// Service worker: opens the SSO URL on a timer, waits for QuickSight to load, closes the tab.
importScripts('config.js');
const DEFAULTS = QS_DEFAULTS;
const ALARM = 'qs-relogin';
const TIMEOUT_ALARM = 'qs-timeout';
const QS_HOST = /(^|\.)(quicksight\.aws\.amazon\.com|amazonquick\.com|quicksuite\.aws)$/;

const cfg = () => chrome.storage.sync.get(DEFAULTS);
const safeHost = (u) => { try { return new URL(u).hostname; } catch (_) { return ''; } };
const setStatus = (status) => chrome.storage.local.set({ lastStatus: { ...status, at: new Date().toISOString() } });

// First run is due at lastSuccess + interval, so reloading the extension or saving settings never triggers a login.
async function schedule() {
  const c = await cfg();
  await chrome.alarms.clear(ALARM);
  if (!c.ssoUrl) return;
  const periodMin = Number(c.intervalHours) * 60;
  const { lastSuccess = 0 } = await chrome.storage.local.get('lastSuccess');
  const dueIn = (lastSuccess + periodMin * 60000 - Date.now()) / 60000;
  chrome.alarms.create(ALARM, { delayInMinutes: Math.max(1, dueIn), periodInMinutes: periodMin });
}

async function relogin() {
  const c = await cfg();
  if (!c.ssoUrl) return setStatus({ ok: false, msg: 'No SSO URL configured' });
  const { tabId: existing, startedAt = 0 } = await chrome.storage.session.get(['tabId', 'startedAt']);
  if (existing && Date.now() - startedAt < Number(c.timeoutSec) * 1000) return setStatus({ ok: null, msg: 'Login already in progress' });
  if (existing) { try { await chrome.tabs.remove(existing); } catch (_) {} }
  // Snapshot open QuickSight tabs first: the new login invalidates their session, so we restore them afterwards.
  const openTabs = (await chrome.tabs.query({})).filter(t => t.url && QS_HOST.test(safeHost(t.url)));
  const restoreTabs = openTabs.map(t => ({ id: t.id, url: t.url, active: t.active }));
  const tab = await chrome.tabs.create({ url: c.ssoUrl, active: false });
  await chrome.storage.session.set({ tabId: tab.id, startedAt: Date.now(), restoreTabs });
  chrome.alarms.create(TIMEOUT_ALARM, { delayInMinutes: Math.max(0.5, Number(c.timeoutSec) / 60) });
  setStatus({ ok: null, msg: 'Login in progress' });
}

async function finish(ok, msg) {
  const { tabId, restoreTabs = [] } = await chrome.storage.session.get(['tabId', 'restoreTabs']);
  if (!tabId) return;
  await chrome.storage.session.remove(['tabId', 'startedAt', 'restoreTabs', 'landed']);
  chrome.alarms.clear(TIMEOUT_ALARM);
  if (tabId) { try { await chrome.tabs.remove(tabId); } catch (_) {} }
  if (ok) {
    await chrome.storage.local.set({ lastSuccess: Date.now() });
    await schedule();
    // Active tabs are not touched mid-work; they are restored once the user switches away from them.
    const deferred = restoreTabs.filter(t => t.active);
    if (deferred.length) await chrome.storage.session.set({ deferred });
    for (const t of restoreTabs.filter(t => !t.active)) { try { await chrome.tabs.update(t.id, { url: t.url }); } catch (_) {} }
  }
  setStatus({ ok, msg });
  if (!ok) chrome.notifications.create({ type: 'basic', iconUrl: 'icon.png', title: 'QuickSight Session Keeper', message: msg });
}

// Success = the SSO tab has landed on a QuickSight page; give it a few seconds to set cookies, then close.
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  const { tabId: watched } = await chrome.storage.session.get('tabId');
  if (tabId !== watched || info.status !== 'complete' || !tab.url) return;
  const host = safeHost(tab.url);
  if (host && QS_HOST.test(host) && !/\/signin|\/login/i.test(tab.url)) {
    const { landed } = await chrome.storage.session.get('landed');
    if (landed) return;
    await chrome.storage.session.set({ landed: true });
    setTimeout(() => finish(true, 'Logged in at ' + new Date().toLocaleString()), 5000);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const { deferred = [] } = await chrome.storage.session.get('deferred');
  if (!deferred.length) return;
  const stillActive = new Set((await chrome.tabs.query({ active: true })).map(t => t.id));
  const remaining = [];
  for (const t of deferred) {
    if (stillActive.has(t.id)) { remaining.push(t); continue; }
    try { await chrome.tabs.update(t.id, { url: t.url }); } catch (_) {}
  }
  await chrome.storage.session.set({ deferred: remaining });
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { deferred = [] } = await chrome.storage.session.get('deferred');
  if (deferred.some(t => t.id === tabId)) await chrome.storage.session.set({ deferred: deferred.filter(t => t.id !== tabId) });
  const { tabId: watched } = await chrome.storage.session.get('tabId');
  if (tabId === watched) { await chrome.storage.session.remove(['tabId', 'startedAt', 'restoreTabs', 'landed']); chrome.alarms.clear(TIMEOUT_ALARM); }
});

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) relogin();
  if (a.name === TIMEOUT_ALARM) finish(false, 'Login did not complete in time. Google probably asked for a password or 2FA. Log in manually once.');
});

chrome.runtime.onMessage.addListener((m, _s, reply) => {
  if (m.type === 'relogin-now') { relogin().then(() => reply({ ok: true })); return true; }
  if (m.type === 'account-picked') { setStatus({ ok: null, msg: 'Picked Google account, waiting for QuickSight' }); }
});

// On first install open the settings page so the user pastes the SSO URL straight away.
chrome.runtime.onInstalled.addListener(async () => {
  const c = await cfg();
  if (!c.ssoUrl) chrome.runtime.openOptionsPage();
  schedule();
});
chrome.runtime.onStartup.addListener(schedule);
chrome.storage.onChanged.addListener((changes, area) => { if (area === 'sync') schedule(); });
