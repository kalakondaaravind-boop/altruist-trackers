'use strict';
/* Local data store. Everything lives in one JSON file inside the app's data folder
   (%APPDATA%\Altruist Trackers). The folder is never touched by installs or updates. */
const fs = require('fs');
const path = require('path');

const SCHEMA = 1;                       // bump when the stored shape changes, then add a migration below
const COLS = ['records', 'commercials', 'ai'];
const MIGRATIONS = {
  // 1: d => { ...transform d.records etc...; return d }   (runs when upgrading from schema 1 to 2)
};

class Store {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'trackers-data.json');
    this.bak = this.file + '.bak';
    this.backupDir = path.join(dir, 'backups');
    fs.mkdirSync(this.backupDir, { recursive: true });
    this.timer = null;
    this.notes = [];                    // things worth telling the user (recovery etc.)
    this.d = this.load();
  }
  empty() { return { schema: SCHEMA, initialized: false, records: {}, commercials: {}, ai: {}, meta: null }; }
  read(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } }
  valid(d) { return d && typeof d === 'object' && Number.isInteger(d.schema) && COLS.every(c => d[c] && typeof d[c] === 'object'); }
  load() {
    let d = this.read(this.file);
    if (!this.valid(d)) {
      if (fs.existsSync(this.file)) {
        try { fs.copyFileSync(this.file, this.file + '.corrupt-' + Date.now()); } catch (e) {}
        const b = this.read(this.bak);
        if (this.valid(b)) { d = b; this.notes.push('recovered-from-copy'); }
      }
    }
    if (!this.valid(d)) return this.empty();
    if (d.schema < SCHEMA) {
      this.d = d; this.snapshot('pre-migration-v' + d.schema);
      while (d.schema < SCHEMA) { const m = MIGRATIONS[d.schema]; if (m) d = m(d) || d; d.schema++; }
      this.d = d; this.writeNow();
    }
    return d;
  }
  all() {
    const arr = c => Object.values(this.d[c]);
    return { initialized: !!this.d.initialized, records: arr('records'), commercials: arr('commercials'), ai: arr('ai'), meta: this.d.meta };
  }
  put(col, id, doc) { if (!COLS.includes(col)) throw new Error('bad collection'); this.d[col][id] = doc; this.d.initialized = true; this.dirty(); }
  del(col, id) { if (!COLS.includes(col)) throw new Error('bad collection'); delete this.d[col][id]; this.dirty(); }
  setMeta(m) { this.d.meta = m; this.d.initialized = true; this.dirty(); }
  dirty() { clearTimeout(this.timer); this.timer = setTimeout(() => this.writeNow(), 250); }
  writeNow() {
    clearTimeout(this.timer); this.timer = null;
    const tmp = this.file + '.tmp';
    const fd = fs.openSync(tmp, 'w');
    try { fs.writeFileSync(fd, JSON.stringify(this.d)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    if (fs.existsSync(this.file)) { try { fs.copyFileSync(this.file, this.bak); } catch (e) {} }
    fs.renameSync(tmp, this.file);
  }
  flushSync() { if (this.timer) this.writeNow(); }

  /* ----- backups ----- */
  counts() { return { rfp: Object.keys(this.d.records).length, commercials: Object.keys(this.d.commercials).length, ai: Object.keys(this.d.ai).length }; }
  toBackup(appVersion) {
    const a = this.all();
    return { app: 'altruist-trackers', backupVersion: 1, schema: SCHEMA, appVersion: appVersion || '', exportedAt: new Date().toISOString(), data: { records: a.records, commercials: a.commercials, ai: a.ai, meta: a.meta } };
  }
  static check(o) {
    if (!o || o.app !== 'altruist-trackers' || !o.data) return { ok: false, err: 'This file is not an Altruist Trackers backup.' };
    if (o.schema > SCHEMA) return { ok: false, err: 'This backup was made by a newer version of the app. Update the app first, then import it.' };
    const x = o.data;
    if (![x.records, x.commercials, x.ai].every(Array.isArray)) return { ok: false, err: 'The backup file is incomplete or damaged.' };
    if (![...x.records, ...x.commercials, ...x.ai].every(r => r && typeof r.id === 'string' && r.id)) return { ok: false, err: 'The backup contains records without an id.' };
    return { ok: true, counts: { rfp: x.records.length, commercials: x.commercials.length, ai: x.ai.length } };
  }
  replaceAll(o) {
    const c = Store.check(o); if (!c.ok) throw new Error(c.err);
    const d = this.empty(); d.initialized = true;
    o.data.records.forEach(r => d.records[r.id] = r);
    o.data.commercials.forEach(r => d.commercials[r.id] = r);
    o.data.ai.forEach(r => d.ai[r.id] = r);
    d.meta = o.data.meta || null;
    this.d = d; this.writeNow();
  }
  snapshot(label, appVersion) {
    try {
      const n = this.counts(); if (!n.rfp && !n.commercials && !n.ai && !this.d.meta) return null;
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const f = path.join(this.backupDir, `${label}-${ts}.json`);
      fs.writeFileSync(f, JSON.stringify(this.toBackup(appVersion)));
      this.prune(); return f;
    } catch (e) { return null; }
  }
  autoBackup(appVersion) {
    const day = new Date().toISOString().slice(0, 10), f = path.join(this.backupDir, `auto-${day}.json`);
    if (fs.existsSync(f)) return null;
    const n = this.counts(); if (!n.rfp && !n.commercials && !n.ai) return null;
    try { fs.writeFileSync(f, JSON.stringify(this.toBackup(appVersion))); this.prune(); return f; } catch (e) { return null; }
  }
  prune(keep = 60) {
    try {
      const fs2 = fs.readdirSync(this.backupDir).filter(n => n.endsWith('.json')).map(n => ({ n, t: fs.statSync(path.join(this.backupDir, n)).mtimeMs })).sort((a, b) => b.t - a.t);
      fs2.slice(keep).forEach(x => fs.unlinkSync(path.join(this.backupDir, x.n)));
    } catch (e) {}
  }
}
Store.SCHEMA = SCHEMA;
module.exports = Store;
