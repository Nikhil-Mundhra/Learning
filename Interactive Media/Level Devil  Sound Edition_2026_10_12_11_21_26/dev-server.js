const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2'
};

const clients = new Set();

const LIVE_RELOAD = `
<script>
(() => {
  const es = new EventSource('/__reload');
  es.onmessage = event => {
    if (event.data === 'reload') location.reload();
  };
})();
</script>
`;

function broadcast() {
  for (const res of clients) res.write('data: reload\n\n');
}

function inject(html) {
  if (html.includes('/__reload')) return html;
  return html.includes('</body>')
    ? html.replace('</body>', `${LIVE_RELOAD}</body>`)
    : html + LIVE_RELOAD;
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    res.write('retry: 500\n\n');
    res.write('data: ready\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const file = path.join(ROOT, rel);

  if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, 'index.html')) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }

    const ext = path.extname(file).toLowerCase();

    if (ext === '.html') {
      res.writeHead(200, {
        'Content-Type': MIME['.html'],
        'Cache-Control': 'no-store'
      });
      res.end(inject(buf.toString('utf8')));
      return;
    }

    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
});

let timer = null;
fs.watch(ROOT, { recursive: true }, (_event, filename) => {
  if (!filename || filename.startsWith('.') || filename === 'dev-server.js') return;
  clearTimeout(timer);
  timer = setTimeout(broadcast, 120);
});

server.listen(PORT, () => {
  console.log(`Larp Devil dev server  ->  http://localhost:${PORT}`);
  console.log('Watching for changes, reloading on save. Ctrl+C to stop.');
});