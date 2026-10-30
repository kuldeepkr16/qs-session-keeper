#!/bin/bash
# One-line installer: downloads the extension from GitHub into ~/Documents/QuickSightSessionKeeper and opens Chrome's extensions page.
set -e
REPO="${QSK_REPO:-kuldeepkr16/qs-session-keeper}"
BRANCH="${QSK_BRANCH:-main}"
DEST="$HOME/Documents/QuickSightSessionKeeper"
TMP="$(mktemp -d)"

echo "Downloading QuickSight Session Keeper..."
curl -fsSL "https://github.com/$REPO/archive/refs/heads/$BRANCH.zip" -o "$TMP/src.zip"
unzip -qo "$TMP/src.zip" -d "$TMP"
SRC="$(find "$TMP" -mindepth 1 -maxdepth 1 -type d | head -1)"

mkdir -p "$DEST"
cp "$SRC"/manifest.json "$SRC"/*.js "$SRC"/options.html "$SRC"/icon.png "$DEST/"
printf '%s' "$DEST" | pbcopy

cat <<MSG

Installed to:  $DEST
(this path is already copied to your clipboard)

Now open your browser (Chrome, Brave, Edge or any Chromium browser) and go to:
  chrome://extensions        (brave://extensions or edge://extensions also work)

  1. Turn on "Developer mode"  (toggle, top right)
  2. Click "Load unpacked"
  3. Press Cmd+Shift+G, paste (Cmd+V), press Enter, then click "Select"
  4. A settings page opens. Paste the QuickSight SSO link and click Save.
     (Get the link from the Google apps grid: right-click the QuickSight tile,
      "Copy link address".)

If the extension is already installed, just click its reload icon instead.
It signs you into QuickSight within a minute and every 6 hours after that.
MSG
