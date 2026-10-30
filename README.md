# QuickSight Session Keeper

Chrome extension that keeps the QuickSight console signed in. AWS hard-caps every QuickSight
session at 12 hours; this re-runs your Google SSO login in a background tab every 6 hours so
you never see the signed-out page. Works for any organisation that signs in to QuickSight
through Google Workspace SAML; nothing is hardcoded, you paste your own SSO link once.

## Install (Mac, about 30 seconds)

Paste this in Terminal:

```
curl -fsSL https://raw.githubusercontent.com/kuldeepkr16/qs-session-keeper/main/install.sh | bash
```

It downloads the extension to `~/Documents/QuickSightSessionKeeper` and copies that path to your
clipboard. Then open your browser (Chrome, Brave, Edge or any Chromium browser) and go to
`chrome://extensions` (or `brave://extensions`, `edge://extensions`):

1. Turn on **Developer mode** (toggle, top right).
2. Click **Load unpacked**.
3. Press `Cmd+Shift+G`, paste, Enter, **Select**.
4. A settings page opens. Paste your organisation's QuickSight SSO link and click **Save**.
   Get the link from the Google apps grid: right-click the QuickSight tile, **Copy link address**.
   It looks like `https://accounts.google.com/o/saml2/initsso?idpid=...&spid=...`.

Done. It signs you in within a minute and every 6 hours after that.

## Update

Run the same command again, then click the reload icon on the extension card.

## Notes

- You must be signed in to your work Google account in that Chrome profile. If not, the first
  run fails with a notification; log in to QuickSight manually once and it takes over.
- If a personal Gmail is also signed in, click the extension icon and enter your work email once.
- Click the extension icon any time to see the last run and the next run time.
- Anyone at the keyboard of a signed-in laptop has QuickSight access. Lock your screen.

## How it works

Every 6 hours the extension opens the Google SSO link for QuickSight in a background tab,
clicks through the account chooser if needed, waits for QuickSight to load, and closes the tab.
Open QuickSight tabs are sent back to their original URL; the tab you are working in is
restored only after you switch away from it.
