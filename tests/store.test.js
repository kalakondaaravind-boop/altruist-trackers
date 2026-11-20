'use strict';
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path');
const Store = require('../store');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'trk-'));

// 1. data survives a restart (new Store on the same folder)
let dir = tmp(), s = new Store(dir);
assert.strictEqual(s.all().initialized, false);
s.put('records', 'r1', { id: 'r1', client: 'A', vendor: 'V' }); s.put('commercials', 'c1', { id: 'c1', client: 'A' }); s.put('ai', 'a1', { id: 'a1', client: 'B' });
s.setMeta({ people: ['X'], ccols: { rfp: [], comm: [], ai: [] } }); s.flushSync();
let s2 = new Store(dir);
assert.deepStrictEqual(s2.counts(), { rfp: 1, commercials: 1, ai: 1 });
assert.strictEqual(s2.all().records[0].vendor, 'V');

// 2. delete persists and stays initialised (so sample data is not re-seeded)
s2.del('records', 'r1'); s2.del('commercials', 'c1'); s2.del('ai', 'a1'); s2.flushSync();
assert.strictEqual(new Store(dir).all().initialized, true);
assert.strictEqual(new Store(dir).counts().rfp, 0);

// 3. backup round-trip: export from one store, import into a fresh one
dir = tmp(); s = new Store(dir);
s.put('records', 'r1', { id: 'r1', client: 'Org', value: 1900000000 }); s.put('ai', 'a1', { id: 'a1', client: 'C', custom: { k: 5 } }); s.setMeta({ people: ['P'], hid: { rfp: ['x'] } });
const bk = JSON.parse(JSON.stringify(s.toBackup('1.0.0')));
const fresh = new Store(tmp());
assert.deepStrictEqual(Store.check(bk), { ok: true, counts: { rfp: 1, commercials: 0, ai: 1 } });
fresh.replaceAll(bk); fresh.flushSync();
assert.strictEqual(new Store(fresh.dir).all().records[0].value, 1900000000);
assert.deepStrictEqual(new Store(fresh.dir).all().meta.people, ['P']);
assert.deepStrictEqual(new Store(fresh.dir).all().ai[0].custom, { k: 5 });

// 4. bad / newer backups are refused
assert.strictEqual(Store.check({}).ok, false);
assert.strictEqual(Store.check({ app: 'altruist-trackers', schema: 99, data: {} }).ok, false);
assert.strictEqual(Store.check({ app: 'altruist-trackers', schema: 1, data: { records: [{ nope: 1 }], commercials: [], ai: [] } }).ok, false);

// 5. a damaged data file is recovered from the last good copy
dir = tmp(); s = new Store(dir); s.put('records', 'r1', { id: 'r1', client: 'Keep' }); s.flushSync(); s.put('records', 'r2', { id: 'r2', client: 'Keep2' }); s.flushSync();
fs.writeFileSync(path.join(dir, 'trackers-data.json'), '{ broken');
const rec = new Store(dir);
assert.ok(rec.notes.includes('recovered-from-copy')); assert.ok(rec.counts().rfp >= 1);

// 6. snapshots and daily auto-backup are written, empty stores are not backed up
dir = tmp(); s = new Store(dir); assert.strictEqual(s.snapshot('x'), null); assert.strictEqual(s.autoBackup(), null);
s.put('records', 'r1', { id: 'r1' }); assert.ok(s.snapshot('before-update')); assert.ok(s.autoBackup()); assert.strictEqual(s.autoBackup(), null);
assert.ok(fs.readdirSync(path.join(dir, 'backups')).length >= 2);
console.log('store tests passed');
