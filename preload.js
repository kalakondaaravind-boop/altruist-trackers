'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const inv = (c, ...a) => ipcRenderer.invoke(c, ...a);
contextBridge.exposeInMainWorld('desk', {
  loadAll: () => inv('db:load'),
  put: (col, id, doc) => inv('db:put', col, id, doc),
  del: (col, id) => inv('db:del', col, id),
  setMeta: m => inv('db:meta', m),
  saveFile: (name, data) => inv('file:save', name, data),
  exportBackup: () => inv('backup:export'),
  importBackup: () => inv('backup:import'),
  safetyBackup: label => inv('backup:safety', label),
  openBackupFolder: () => inv('backup:open'),
  checkUpdates: () => inv('app:update'),
  info: () => inv('app:info')
});
