/* Desktop shim: gives the tracker the same small storage + download API it was written against,
   backed by the app's own local data file (through the preload bridge). */
(function () {
  var d = window.desk; if (!d) return;
  var col = function (n) { return { doc: function (id) { return { set: function (v) { return d.put(n, id, v); }, delete: function () { return d.del(n, id); } }; }, onSnapshot: function () {} }; };
  var db = { collection: col, doc: function () { return { set: function (v) { return d.setMeta(v); }, onSnapshot: function () {} }; }, loadAll: function () { return d.loadAll(); } };
  var dl = { save: function (o) { return d.saveFile(o.filename, o.data).then(function (r) { if (r && r.canceled) { throw { code: 'declined' }; } return r; }); } };
  window.claude = { use: function (n) { return Promise.resolve(n === 'db' ? db : n === 'downloads' ? dl : null); } };
})();
