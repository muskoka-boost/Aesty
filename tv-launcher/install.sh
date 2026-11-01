#!/usr/bin/env bash
# Install Aesty Home on a Sony Bravia (or any Android TV / Google TV) over the network.
#
#   ./install.sh <tv-ip>                 install / update the launcher
#   ./install.sh <tv-ip> --make-default  also make it what the remote's HOME button opens
#   ./install.sh <tv-ip> --restore       put the stock Sony/Google home screen back
#
# Needs adb (Android platform-tools) on your computer and Developer options + USB/Network
# debugging turned on on the TV — see README.md.
set -euo pipefail

TV_IP="${1:-}"
MODE="${2:-}"
if [[ -z "$TV_IP" ]]; then
  echo "usage: $0 <tv-ip> [--make-default|--restore]" >&2
  exit 1
fi

HERE="$(cd "$(dirname "$0")" && pwd)"
APK="$HERE/dist/aesty-home.apk"
PKG="design.aesty.tvlauncher"
TARGET="$TV_IP:5555"

# Stock home screens: Google TV (2021+ Bravias) and the older Android TV launcher.
STOCK_LAUNCHERS=(com.google.android.apps.tv.launcherx com.google.android.tvlauncher)

command -v adb >/dev/null || { echo "adb not found — install Android platform-tools first." >&2; exit 1; }

echo "Connecting to $TARGET … (accept the 'Allow USB debugging?' prompt on the TV the first time)"
adb connect "$TARGET"
adb -s "$TARGET" wait-for-device

installed() { adb -s "$TARGET" shell pm list packages "$1" | grep -qx "package:$1"; }

case "$MODE" in
  --restore)
    for p in "${STOCK_LAUNCHERS[@]}"; do
      if installed "$p"; then
        echo "Re-enabling $p"
        adb -s "$TARGET" shell pm enable "$p" || true
      fi
    done
    adb -s "$TARGET" shell input keyevent KEYCODE_HOME
    echo "Stock home screen restored. (Aesty Home is still installed; uninstall with: adb uninstall $PKG)"
    exit 0
    ;;
esac

echo "Installing $APK"
adb -s "$TARGET" install -r "$APK"

if [[ "$MODE" == "--make-default" ]]; then
  for p in "${STOCK_LAUNCHERS[@]}"; do
    if installed "$p"; then
      echo "Disabling stock home screen $p (undo any time with: $0 $TV_IP --restore)"
      adb -s "$TARGET" shell pm disable-user --user 0 "$p"
    fi
  done
  adb -s "$TARGET" shell cmd package set-home-activity "$PKG/.MainActivity" 2>/dev/null || true
  adb -s "$TARGET" shell input keyevent KEYCODE_HOME
  echo "Done — press HOME on the remote."
else
  adb -s "$TARGET" shell am start -n "$PKG/.MainActivity"
  echo "Installed and opened. Run with --make-default to make the HOME button open it."
fi
