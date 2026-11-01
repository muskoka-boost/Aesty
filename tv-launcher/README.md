# Aesty Home — a launcher for Sony Bravia

A clean, remote-first home screen for Android TV / Google TV, made for a Sony Bravia.
Plain Java, no third-party libraries, ~25 KB APK.

- **Header** — greeting plus a large clock and date
- **Favourites** — your pinned apps, in the order you choose
- **Apps** — every installed app in a six-wide grid. TV apps show their 16:9 banner; other apps
  show their icon on a dark card.
- **System** — Inputs (Sony's TV / HDMI app), Settings, Network
- **Long-press OK** (or press MENU) on any app to add or remove it from Favourites, move it left
  or right, or open App info
- HOME or BACK while on the launcher jumps back to the top
- The app list refreshes on its own when you install or remove apps

## Installing on the TV

A ready-built APK is in `dist/aesty-home.apk`.

### 1. Turn on debugging on the Bravia
1. **Settings → System → About** (on older models: **Settings → Device Preferences → About**),
   scroll to **Build** and press OK on it 7 times until it says you're a developer.
2. **Settings → System → Developer options**: turn on **USB debugging** (on some models it's
   also called **Network debugging** or **ADB debugging**).
3. Note the TV's IP address: **Settings → Network & Internet →** your network.

### 2. Install from a computer on the same Wi-Fi
Install Android platform-tools (`brew install android-platform-tools`, `sudo apt install adb`, or
download it from developer.android.com), then:

```bash
./install.sh 192.168.1.50                  # install and open it
./install.sh 192.168.1.50 --make-default   # also make the remote's HOME button open it
./install.sh 192.168.1.50 --restore        # put the stock home screen back
```

The first time, the TV asks **"Allow USB debugging?"** Tick *Always allow* and choose OK.

### About `--make-default`
Google TV Bravias (2021 and newer) don't let you pick a different home app in Settings. The
remote's HOME button always opens the stock launcher. `--make-default` gets around this by
*disabling* (not deleting) the stock launcher, `com.google.android.apps.tv.launcherx`, or
`com.google.android.tvlauncher` on older models. Things to know:

- You lose the stock home screen's recommendations and Google Assistant suggestions on the home
  screen. Voice search on the remote still works.
- A big system update can turn the stock launcher back on. Run `--make-default` again if that
  happens.
- `--restore` undoes it completely. A factory reset also restores it.

## Building it yourself

Needs JDK 17+ and the Android SDK (platform 35).

```bash
echo "sdk.dir=/path/to/Android/sdk" > local.properties
./gradlew assembleRelease
# → app/build/outputs/apk/release/app-release.apk
```

The release build is signed with your machine's debug key so it installs straight away. If you
rebuild on a different computer, uninstall the old copy first (`adb uninstall design.aesty.tvlauncher`),
because the signatures won't match.

## Code

```
app/src/main/AndroidManifest.xml          HOME + LEANBACK_LAUNCHER intent filters
app/src/main/java/.../MainActivity.java   everything: app loading, rows, tiles, focus, options
app/src/main/res/                         colours, gradient background, focus ring, icons
install.sh                                adb install / make-default / restore helper
```

To change the look, edit `res/values/colors.xml` (the accent is the gold focus ring and row
titles) and `res/drawable/background.xml`. To change the grid width, edit `COLUMNS` in
`MainActivity.java`.
