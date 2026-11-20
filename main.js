'use strict';
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('./store');

/* Fixed data location so installs and updates never move or touch the data. */
app.setPath('userData', path.join(app.getPath('appData'), 'Altruist Trackers'));
if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

let win = null, store = null, closing = false, manualCheck = false, autoUpdater = null;
const V = () => app.getVersion();
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- window ---------- */
function winState() {
  const f = path.join(app.getPath('userData'), 'window.json');
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return { width: 1440, height: 900 }; }
}
function saveWinState() {
  if (!win || win.isDestroyed()) return;
  try {
    const b = win.getNormalBounds();
    fs.writeFileSync(path.join(app.getPath('userData'), 'window.json'), JSON.stringify({ ...b, max: win.isMaximized() }));
  } catch (e) {}
}
function createWindow() {
  const s = winState();
  win = new BrowserWindow({
    width: s.width || 1440, height: s.height || 900, x: s.x, y: s.y, minWidth: 1000, minHeight: 640,
    title: 'Altruist Trackers', icon: path.join(__dirname, 'build', 'icon.ico'), backgroundColor: '#eef4fc', show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, devTools: !app.isPackaged }
  });
  if (s.max) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); } });
  win.on('close', async e => {
    saveWinState();
    if (closing) return;
    e.preventDefault(); closing = true;
    await flushRenderer();
    store.flushSync();
    win.destroy();
  });
}
/* Ask the page to write any pending edits before we export, import, update or quit. */
async function flushRenderer() {
  if (!win || win.isDestroyed()) return;
  try {
    await Promise.race([
      win.webContents.executeJavaScript('window.__flushNow ? window.__flushNow() : null'),
      new Promise(r => setTimeout(r, 4000))
    ]);
  } catch (e) {}
}

/* ---------- backups ---------- */
const stamp = () => today();
async function exportBackup() {
  await flushRenderer(); store.flushSync();
  const r = await dialog.showSaveDialog(win, { title: 'Export backup', defaultPath: path.join(app.getPath('documents'), `Altruist-Trackers-Backup-${stamp()}.json`), filters: [{ name: 'Altruist Trackers backup', extensions: ['json'] }] });
  if (r.canceled || !r.filePath) return { canceled: true };
  fs.writeFileSync(r.filePath, JSON.stringify(store.toBackup(V()), null, 1));
  const n = store.counts();
  dialog.showMessageBox(win, { type: 'info', title: 'Backup saved', message: 'Backup saved.', detail: `${r.filePath}\n\n${n.rfp} RFPs, ${n.commercials} commercials rows, ${n.ai} AI solutions.\nKeep this file somewhere safe. Use File → Import backup to restore it.` });
  return { ok: true, path: r.filePath };
}
async function importBackup() {
  await flushRenderer(); store.flushSync();
  const r = await dialog.showOpenDialog(win, { title: 'Import backup', properties: ['openFile'], filters: [{ name: 'Altruist Trackers backup', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  let o;
  try { o = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8')); } catch (e) { dialog.showMessageBox(win, { type: 'error', title: 'Import backup', message: 'That file could not be read.', detail: 'It is not a valid backup file.' }); return { error: true }; }
  const c = Store.check(o);
  if (!c.ok) { dialog.showMessageBox(win, { type: 'error', title: 'Import backup', message: 'Backup not imported.', detail: c.err }); return { error: true }; }
  const when = o.exportedAt ? new Date(o.exportedAt).toLocaleString('en-GB') : 'unknown date';
  const cur = store.counts();
  const q = await dialog.showMessageBox(win, {
    type: 'warning', title: 'Import backup', buttons: ['Replace my data with this backup', 'Cancel'], defaultId: 1, cancelId: 1, noLink: true,
    message: 'Replace all current data with this backup?',
    detail: `Backup made ${when}:\n${c.counts.rfp} RFPs, ${c.counts.commercials} commercials rows, ${c.counts.ai} AI solutions.\n\nCurrent data:\n${cur.rfp} RFPs, ${cur.commercials} commercials rows, ${cur.ai} AI solutions.\n\nA safety copy of your current data is saved first, so you can undo this from the backup folder.`
  });
  if (q.response !== 0) return { canceled: true };
  store.snapshot('before-import', V());
  store.replaceAll(o);
  win.webContents.reload();
  return { ok: true };
}

/* ---------- IPC ---------- */
ipcMain.handle('db:load', () => ({ ...store.all(), notes: store.notes }));
ipcMain.handle('db:put', (e, c, id, d) => { store.put(c, id, d); return true; });
ipcMain.handle('db:del', (e, c, id) => { store.del(c, id); return true; });
ipcMain.handle('db:meta', (e, m) => { store.setMeta(m); return true; });
ipcMain.handle('file:save', async (e, name, data) => {
  const safe = String(name || 'export').replace(/[\\/:*?"<>|]/g, '_');
  const ext = path.extname(safe).slice(1) || '*';
  const r = await dialog.showSaveDialog(win, { title: 'Save file', defaultPath: path.join(app.getPath('documents'), safe), filters: [{ name: ext.toUpperCase() + ' file', extensions: [ext] }] });
  if (r.canceled || !r.filePath) return { canceled: true };
  fs.writeFileSync(r.filePath, typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data));
  return { ok: true, path: r.filePath };
});
ipcMain.handle('backup:export', exportBackup);
ipcMain.handle('backup:import', importBackup);
ipcMain.handle('backup:safety', (e, label) => { store.flushSync(); return store.snapshot(String(label || 'manual').replace(/[^a-z0-9-]/gi, ''), V()); });
ipcMain.handle('backup:open', () => shell.openPath(store.backupDir));
ipcMain.handle('app:info', () => ({ version: V(), dataDir: app.getPath('userData'), backupDir: store.backupDir, packaged: app.isPackaged }));
ipcMain.handle('app:update', () => checkUpdates(true));

/* ---------- updates (GitHub Releases) ---------- */
function setupUpdater() {
  if (!app.isPackaged) return;
  try { autoUpdater = require('electron-updater').autoUpdater; } catch (e) { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-available', i => { if (manualCheck) dialog.showMessageBox(win, { type: 'info', title: 'Update', message: `Version ${i.version} found. Downloading in the background…` }); });
  autoUpdater.on('update-not-available', () => { if (manualCheck) { manualCheck = false; dialog.showMessageBox(win, { type: 'info', title: 'Updates', message: 'You are on the latest version.', detail: `Version ${V()}` }); } });
  autoUpdater.on('error', err => { if (manualCheck) { manualCheck = false; dialog.showMessageBox(win, { type: 'warning', title: 'Updates', message: 'Could not check for updates.', detail: String(err && err.message || err).slice(0, 300) }); } });
  autoUpdater.on('update-downloaded', async i => {
    manualCheck = false;
    store.flushSync(); store.snapshot('before-update-to-' + i.version, V());
    const r = await dialog.showMessageBox(win, { type: 'info', title: 'Update ready', buttons: ['Restart and update', 'Later'], defaultId: 0, cancelId: 1, noLink: true, message: `Version ${i.version} is ready to install.`, detail: 'Your data stays on this computer and is not affected. A backup copy has been saved.' });
    if (r.response === 0) { await flushRenderer(); store.flushSync(); closing = true; setImmediate(() => autoUpdater.quitAndInstall()); }
  });
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 8000);
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 6 * 3600 * 1000);
}
async function checkUpdates(manual) {
  if (!app.isPackaged || !autoUpdater) { dialog.showMessageBox(win, { type: 'info', title: 'Updates', message: 'Updates are available in the installed app.' }); return; }
  manualCheck = !!manual;
  try { await autoUpdater.checkForUpdates(); } catch (e) { /* reported by the error event */ }
}

/* ---------- menu ---------- */
function buildMenu() {
  const t = [
    { label: '&File', submenu: [
      { label: 'Export backup…', accelerator: 'CmdOrCtrl+Shift+E', click: () => exportBackup() },
      { label: 'Import backup…', accelerator: 'CmdOrCtrl+Shift+I', click: () => importBackup() },
      { type: 'separator' },
      { label: 'Open backup folder', click: () => shell.openPath(store.backupDir) },
      { type: 'separator' }, { role: 'quit', label: 'Exit' } ] },
    { label: '&View', submenu: [{ role: 'reload', label: 'Reload' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { label: '&Help', submenu: [
      { label: 'Check for updates…', click: () => checkUpdates(true) },
      { label: 'About Altruist Trackers', click: () => dialog.showMessageBox(win, { type: 'info', title: 'About', message: 'Altruist Trackers', detail: `Version ${V()}\nAltruist Technologies Private Limited\n\nAll data is stored on this computer only:\n${app.getPath('userData')}` }) } ] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(t));
}

/* ---------- lifecycle ---------- */
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  store = new Store(app.getPath('userData'));
  store.autoBackup(V());
  buildMenu(); createWindow(); setupUpdater();
  if (store.notes.includes('recovered-from-copy')) dialog.showMessageBox(win, { type: 'info', title: 'Data recovered', message: 'Your data file was damaged and has been restored from the last good copy.', detail: 'Recent changes made just before the problem may be missing. Check your data, or import a backup from File → Import backup.' });
});
app.on('before-quit', () => { if (store) store.flushSync(); });
app.on('window-all-closed', () => app.quit());
