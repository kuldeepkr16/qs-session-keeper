# QuickSight Session Keeper

Chrome extension that keeps the QuickSight console signed in. AWS hard-caps every QuickSight
session at 12 hours; this re-runs your Google SSO login in a background tab every 6 hours so
you never see the signed-out page. Works for any organisation that signs in to QuickSight
through Google Workspace SAML; nothing is hardcoded, you paste your own SSO link once.

## Install (Mac, about 1 minute)

**1. Run the install command.** Open Terminal (Cmd+Space, type "Terminal", Enter) and paste:

```
curl -fsSL https://raw.githubusercontent.com/kuldeepkr16/qs-session-keeper/main/install.sh | bash
```

This downloads the extension to `~/Documents/QuickSightSessionKeeper` and copies that folder
path to your clipboard. Nothing else is changed on your machine.

**2. Open the browser you use for QuickSight.** Use the same browser and profile where you are
already logged in to QuickSight with your work Google account. Chrome, Brave, Edge or any
Chromium browser works.

**3. Open a new tab and go to the extensions page.** Type one of these in the address bar:

```
chrome://extensions
brave://extensions
edge://extensions
```

**4. Turn on Developer mode.** It is a toggle at the top right of the extensions page.

**5. Load the extension folder.** Click **Load unpacked**. In the file dialog press
`Cmd+Shift+G`, paste (`Cmd+V`), press Enter, then click **Select**. The folder path was already
put on your clipboard by step 1.

**6. Paste your QuickSight SSO link.** A settings page opens automatically. Get the link like this:

- Open any Google page (Gmail, Drive) and click the **Google apps** grid icon at the top right.
- Find the **QuickSight** tile. **Right-click** it and choose **Copy clean link**.
- Paste the link into the **Google SSO URL** field on the settings page and click **Save**.

The link looks like `https://accounts.google.com/o/saml2/initsso?idpid=...&spid=...`.

**7. Log in once.** Click **Log in now** on the settings page, or just open QuickSight normally
and sign in. The status box shows **OK** with the next run time.

That's it. From now on the extension renews your QuickSight login every 6 hours in the background.

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
