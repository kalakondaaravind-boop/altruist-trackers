# Altruist Trackers (Windows app)

RFP evaluation, Commercials tracker and AI Solutions tracker for Altruist BPM, as a Windows desktop app.

* **All data is stored inside the app's own data folder on the PC** (`%APPDATA%\Altruist Trackers`). Nothing is sent anywhere.
* **Updates never touch the data.** The installer only replaces program files. New fields added in future versions are filled with defaults on existing records, and a schema-version / migration hook in `store.js` handles any structural change. A backup copy is saved automatically before every update.
* **Backup and restore:** `File → Export backup…` / `Import backup…` (also in the sidebar). Import replaces current data after a confirmation, and saves a safety copy of the current data first.
* **Automatic safety copies** are kept in `%APPDATA%\Altruist Trackers\backups` (one per day, plus before updates, imports and "Delete all data").
* **Excel / CSV exports and bulk upload** work as before and are saved through a normal Windows Save dialog.

## Install

Download `Altruist-Trackers-Setup-x.y.z.exe` from the repository's **Releases** page and run it (no admin rights needed).
The app checks for updates on start (and under *Help → Check for updates…*). When an update is downloaded it asks to restart.

## Releasing a new version

1. Change the app (see layout below) and raise `"version"` in `package.json` (e.g. `1.0.1`).
2. Commit and push to `main`.
3. GitHub Actions (`Build Windows app`) builds the installer and publishes it as Release `v1.0.1`. Installed apps pick it up automatically.

Pushes that do not change the version simply rebuild the same release.

> Auto-update reads the Releases of this repository, so the repository needs to be **public** (it contains no data, only code). For a private repository the updater needs an access token and is not set up here.

## Layout

| Path | What it is |
| --- | --- |
| `main.js` | Electron main process: window, menu, backups, updates, file dialogs |
| `store.js` | Local data store (atomic writes, recovery copy, schema version, backups) |
| `preload.js`, `src/shim.js` | Safe bridge between the page and the main process |
| `renderer/*` | The tracker UI source (`01-head.html` styles, `02…05` scripts). `npm run build:renderer` joins them into `src/index.html` |
| `tests/` | Store tests (`npm test`) |

Local run: `npm install`, then `npm start`. Local installer: `npm run dist` (Windows).

## Changing stored data in a future version

Add a function to `MIGRATIONS` in `store.js` (keyed by the old schema number) and raise `SCHEMA`. It runs once on first launch of the new version, after an automatic backup.
