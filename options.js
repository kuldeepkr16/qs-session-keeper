const DEFAULTS = QS_DEFAULTS;
const $ = (id) => document.getElementById(id);

async function load() {
  const c = await chrome.storage.sync.get(DEFAULTS);
  for (const k of Object.keys(DEFAULTS)) $(k).value = c[k];
  renderStatus();
}

async function renderStatus() {
  const { lastStatus } = await chrome.storage.local.get('lastStatus');
  const alarm = await chrome.alarms.get('qs-relogin');
  let text = lastStatus ? `${lastStatus.ok === false ? 'FAILED' : lastStatus.ok ? 'OK' : '...'} ${lastStatus.msg}\n(${new Date(lastStatus.at).toLocaleString()})` : 'No runs yet.';
  if (alarm) text += `\nNext run: ${new Date(alarm.scheduledTime).toLocaleString()}`;
  $('status').textContent = text;
}

$('save').onclick = async () => {
  await chrome.storage.sync.set({
    ssoUrl: $('ssoUrl').value.trim(),
    email: $('email').value.trim(),
    intervalHours: Number($('intervalHours').value) || 6,
    timeoutSec: Number($('timeoutSec').value) || 120,
  });
  $('status').textContent = 'Saved. Timer rescheduled.';
  setTimeout(renderStatus, 500);
};

$('now').onclick = () => chrome.runtime.sendMessage({ type: 'relogin-now' }, () => setTimeout(renderStatus, 1500));

chrome.storage.onChanged.addListener(renderStatus);
load();
