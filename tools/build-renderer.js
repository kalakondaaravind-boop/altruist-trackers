// Joins renderer/*.html + renderer/*.js into the single page the app loads (src/index.html).
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'renderer');
const files = fs.readdirSync(dir).sort();
const head = files.filter(f => f.endsWith('.html')).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const js = files.filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const out = head.replace(/\s*$/, '') + '\n' + js.replace(/\n<\/script>[\s\S]*$/, '') + '\n</script></body></html>\n';
fs.writeFileSync(path.join(__dirname, '..', 'src', 'index.html'), out);
console.log('built src/index.html', out.length, 'bytes');
