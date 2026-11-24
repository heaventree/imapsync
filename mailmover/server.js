'use strict';
// MailMover: a small web front end for the imapsync engine. No dependencies.
// Runs imapsync as a child process, parses its output into progress, and
// streams it to the browser with server-sent events. Put TLS and a login in
// front of it (Dokploy/Traefik).
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PORT = parseInt(process.env.PORT || '8080', 10);
const IMAPSYNC = process.env.IMAPSYNC_BIN || '/usr/bin/imapsync';
const MAX_RUNNING = parseInt(process.env.MAX_RUNNING || '3', 10);
const MAX_LINES = 200000;
const JOB_TTL_MS = 24 * 3600 * 1000;
const PUBLIC = path.join(__dirname, 'public');
const WORK = process.env.WORK_DIR || path.join(os.tmpdir(), 'mailmover');
fs.mkdirSync(WORK, { recursive: true, mode: 0o700 });

const MS = { tenant: process.env.MS_TENANT_ID || '', client: process.env.MS_CLIENT_ID || '', secret: process.env.MS_CLIENT_SECRET || '' };
const msConfigured = () => !!(MS.tenant && MS.client && MS.secret);
const MS_HOST = 'outlook.office365.com';

// App-only token for Microsoft 365 (client credentials). Tokens last about an hour, so fetch one per run.
async function msToken() {
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: MS.client, client_secret: MS.secret, scope: 'https://outlook.office365.com/.default' });
  const r = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(MS.tenant)}/oauth2/v2.0/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(j.error_description ? String(j.error_description).split('\r')[0] : 'Microsoft sign-in failed');
  return j.access_token;
}

const jobs = new Map();

const hhmmss = () => new Date().toISOString().slice(11, 19);

// Master log: one JSON line per event on stdout (Dokploy shows it; read it with docker logs). Never passwords, tokens or mail content;
// email addresses are cut to their domain and IP addresses are hashed.
const log = (ev, o) => console.log(JSON.stringify(Object.assign({ t: new Date().toISOString(), ev }, o)));
const domainOf = (e) => String(e || '').split('@').pop().toLowerCase().slice(0, 100);
const scrub = (t) => String(t || '').replace(/[A-Za-z0-9._%+-]+@/g, '***@').replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_.-]+/g, 'MASKED').slice(0, 300);
const ipHash = (req) => crypto.createHash('sha256').update('mm' + String((req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')).split(',')[0].trim()).digest('hex').slice(0, 8);
let clientLogs = 0; setInterval(() => { clientLogs = 0; }, 60000).unref();

function validHost(h) {
  return typeof h === 'string' && /^[A-Za-z0-9]([A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/.test(h);
}
function validUser(u) {
  return typeof u === 'string' && u.length > 0 && u.length < 256 && !u.startsWith('-') && !/[\r\n\0]/.test(u);
}
function validPass(p) {
  return typeof p === 'string' && p.length > 0 && p.length < 512 && !/[\r\n\0]/.test(p);
}

// Extra imapsync parameters: only a safe allowlist (never anything that reads files, runs commands or changes paths).
const EXTRA_OK = {
  '--exclude': 1, '--include': 1, '--folder': 1, '--folderrec': 1, '--folderlast': 1, '--folderfirst': 1,
  '--maxsize': 1, '--minsize': 1, '--maxage': 1, '--minage': 1, '--skipsize': 0, '--nofoldersizes': 0,
  '--nofoldersizesatend': 0, '--useuid': 0, '--nosyncacls': 0, '--syncacls': 0, '--noabletosearch': 0,
  '--prefix1': 1, '--prefix2': 1, '--sep1': 1, '--sep2': 1, '--nosyncinternaldates': 0, '--skipcrossduplicates': 0,
  '--regextrans2': 1, '--maxmessagespersecond': 1, '--maxbytespersecond': 1, '--buffersize': 1, '--delete2duplicates': 0,
  '--skipemptyfolders': 0, '--addheader': 0, '--noresyncflags': 0, '--subscribed': 0
};
function parseExtra(text) {
  const toks = [];
  String(text || '').replace(/"([^"]*)"|'([^']*)'|(\S+)/g, (_, a, b, c) => { toks.push(a !== undefined ? a : b !== undefined ? b : c); return ''; });
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (!(t in EXTRA_OK)) throw new Error('The option ' + t.slice(0, 40) + ' is not allowed here.');
    out.push(t);
    if (EXTRA_OK[t]) {
      const v = toks[++i];
      if (v === undefined || /[\0\r\n]/.test(v) || v.length > 300) throw new Error(t + ' needs a value.');
      out.push(v);
    }
  }
  if (out.length > 40) throw new Error('Too many extra parameters.');
  return out;
}
const validFolder = (f) => f === '' || (typeof f === 'string' && f.length < 200 && !/[\0\r\n]/.test(f) && !f.startsWith('-'));
const humanSize = (n) => n >= 1073741824 ? (n / 1073741824).toFixed(1) + ' GB' : n >= 1048576 ? Math.round(n / 1048576) + ' MB' : n >= 1024 ? Math.round(n / 1024) + ' KB' : n + ' B';
const MODES = { sync: 1, dry: 1, check: 1, sizes: 1, folders: 1 };

function classify(line) {
  if (/^Err |failure|^Host\d: failed/i.test(line)) return 'err';
  if (/success login|Detected 0 errors|sync looks good/i.test(line)) return 'ok';
  if (/^(warning|Warn)/i.test(line) || /\bWarning\b/.test(line)) return 'warn';
  if (/^msg /.test(line)) return 'msg';
  if (/^(Folder\s+\d+\/\d+|Transfer ended|Messages transferred|Folders synced|Detected|Exiting|\+\+\+\+ (Looping|Statistics|End))/.test(line)) return 'key';
  return 'raw';
}

function friendly(line) {
  let m;
  if ((m = line.match(/^Folder\s+(\d+)\/(\d+)\s+\[(.*?)\]/))) return `Folder ${m[1]} of ${m[2]}: ${m[3]}`;
  if ((m = line.match(/^Host(\d): success login on \[(.*?)\]/))) return `${m[1] === '1' ? 'Source' : 'Destination'}: signed in to ${m[2]}`;
  if ((m = line.match(/^Host(\d) failure: (.*)$/))) return `${m[1] === '1' ? 'Source' : 'Destination'}: ${m[2]}`;
  if ((m = line.match(/^Host1 Nb messages:\s+(\d+) messages/))) return `Source has ${m[1]} messages`;
  if ((m = line.match(/^Messages transferred\s+: (\d+)/))) return `Messages transferred: ${m[1]}`;
  return line;
}

function newJob(input) {
  const id = crypto.randomBytes(16).toString('hex');
  const dir = path.join(WORK, id);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const job = {
    id, dir, mode: input.mode, dry: input.mode === 'dry',
    status: 'starting', lines: [], clients: new Set(), proc: null, paused: false,
    created: Date.now(), folders: new Map(), current: null, startedAt: Date.now(),
    stats: { mode: input.mode, total: 0, left: null, done: 0, folder: '', folderIdx: 0, folderCount: 0, speed: 0, etaSeconds: null, errors: 0, hint: '', code: null, source: input.user1, dest: input.user2 },
    dirty: false, timer: null
  };
  jobs.set(id, job);
  return job;
}

function push(job, raw) {
  if (job.lines.length >= MAX_LINES) return;
  const text = raw.replace(/\r$/, '').replace(/(--oauthaccesstoken\d\s+)\S+/g, '$1MASKED').replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_.-]+/g, 'MASKED');
  if (text === '') return;
  const k = classify(text);
  const entry = { t: hhmmss(), k, m: k === 'raw' || k === 'msg' ? text : friendly(text) };
  job.lines.push(entry);
  const s = job.stats;
  let m;
  if (!s.total && (m = text.match(/^Host1 Nb messages:\s+(\d+) messages/))) s.total = parseInt(m[1], 10);
  if ((m = text.match(/ETA: .*?\s(\d+) s\s+(\d+)\/(\d+) msgs left/))) {
    s.etaSeconds = parseInt(m[1], 10); s.left = parseInt(m[2], 10); s.total = parseInt(m[3], 10) || s.total;
    s.done = Math.max(0, s.total - s.left);
  }
  if ((m = text.match(/^Folder\s+\[(.*?)\]\s+Size:\s+(\d+)\s+Messages:\s+(\d+)/))) {
    const f = job.folders.get(m[1]) || { name: m[1], status: 'queued' };
    f.size = humanSize(+m[2]); f.msgs = +m[3]; job.folders.set(m[1], f);
  }
  if ((m = text.match(/^Folder\s+(\d+)\/(\d+)\s+\[(.*?)\]/))) {
    s.folderIdx = +m[1]; s.folderCount = +m[2]; s.folder = m[3];
    if (job.current && job.folders.has(job.current)) job.folders.get(job.current).status = 'done';
    const f = job.folders.get(m[3]) || { name: m[3] };
    f.status = 'copying'; job.folders.set(m[3], f); job.current = m[3];
  }
  if (/^msg /.test(text)) {
    if ((m = text.match(/(\d+(?:\.\d+)?) msgs\/s/))) s.speed = parseFloat(m[1]);
  }
  if ((m = text.match(/^Messages transferred\s+: (\d+)/))) s.moved = parseInt(m[1], 10);
  if (k === 'err') { s.errors += 1; if ((job.errLogged = (job.errLogged || 0) + 1) <= 10) log('run_error_line', { id: job.id.slice(0, 8), line: scrub(text) }); }
  if (/Basic authentication is disabled/.test(text)) s.hint = 'Microsoft 365 no longer accepts passwords for IMAP. This mailbox needs a Microsoft login token instead.';
  if (/Could not connect|Connection refused|timed out/i.test(text) && !s.hint) s.hint = 'Could not reach a server. Check the server name and that it accepts IMAP connections (port 993).';
  job.dirty = true;
  schedule(job);
  send(job, 'line', job.lines.length - 1, entry);
}

function send(job, event, id, data) {
  const msg = (id !== null ? `id: ${id}\n` : '') + `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of job.clients) res.write(msg);
}

function state(job) {
  return { status: job.status, paused: job.paused, mode: job.mode, dry: job.dry, stats: job.stats, lineCount: job.lines.length, folders: Array.from(job.folders.values()).slice(0, 500) };
}

function schedule(job) {
  if (job.timer) return;
  job.timer = setTimeout(() => { job.timer = null; flush(job); }, 250);
}
function flush(job) {
  if (job.clients.size) send(job, 'state', null, state(job));
  job.dirty = false;
}

function runningCount() {
  let n = 0;
  for (const j of jobs.values()) if (j.status === 'running' || j.status === 'starting') n++;
  return n;
}

function startJob(input) {
  const job = newJob(input);
  const p1 = path.join(job.dir, 'p1'), p2 = path.join(job.dir, 'p2');
  fs.writeFileSync(p2, input.pass2 + '\n', { mode: 0o600 });
  const src = input.token ? ['--oauthaccesstoken1', input.token] : (fs.writeFileSync(p1, input.pass1 + '\n', { mode: 0o600 }), ['--passfile1', p1]);
  const args = [
    '--host1', input.host1, '--user1', input.user1, ...src,
    '--host2', input.host2, '--user2', input.user2, '--passfile2', p2,
    '--nolog', '--nomodulesversion', '--noid', '--tmpdir', job.dir, '--pidfile', path.join(job.dir, 'pid')
  ];
  if (input.mode === 'check') args.push('--justlogin');
  if (input.mode === 'dry') args.push('--dry');
  if (input.mode === 'sizes') args.push('--justfoldersizes');
  if (input.mode === 'folders') args.push('--justfolders');
  if (input.automap) args.push('--automap');
  if (input.move) args.push('--delete1', '--expunge1');
  if (input.strict) args.push('--delete2', '--expunge2');
  if (input.sub1) args.push('--subfolder1', input.sub1);
  if (input.sub2) args.push('--subfolder2', input.sub2);
  args.push(...input.extra);
  const proc = spawn(IMAPSYNC, args, { cwd: job.dir, stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: process.env.PATH, HOME: job.dir, LANG: 'C.UTF-8' } });
  job.proc = proc;
  job.status = 'running';
  let buf = '';
  const onData = (chunk) => {
    buf += chunk.toString('utf8');
    let i;
    while ((i = buf.indexOf('\n')) >= 0) { push(job, buf.slice(0, i)); buf = buf.slice(i + 1); }
  };
  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);
  proc.on('error', (e) => { push(job, 'Err could not start the MailMover engine: ' + e.message); finish(job, -1, null); });
  proc.on('close', (code, sig) => { if (buf) push(job, buf); buf = ''; finish(job, code, sig); });
  return job;
}

function finish(job, code, sig) {
  if (['done', 'failed', 'stopped'].includes(job.status)) return;
  job.stats.code = code;
  if (code === 0) for (const f of job.folders.values()) if (f.status === 'copying') f.status = 'done';
  if (job.stopRequested) job.status = 'stopped';
  else if (code === 0) job.status = 'done';
  else {
    job.status = 'failed';
    if (code === 161 && !job.stats.hint) job.stats.hint = 'The source login failed. Check the email and password.';
    if (code === 162 && !job.stats.hint) job.stats.hint = 'The destination login failed. Check the email and password.';
  }
  log('run_end', { id: job.id.slice(0, 8), mode: job.mode, status: job.status, code, sig: sig || null, secs: Math.round((Date.now() - job.startedAt) / 1000), total: job.stats.total, done: job.stats.done, moved: job.stats.moved == null ? null : job.stats.moved, errors: job.stats.errors, hint: job.stats.hint || null, folders: job.folders.size });
  for (const f of ['p1', 'p2']) fs.rm(path.join(job.dir, f), { force: true }, () => {});
  fs.rm(job.dir, { recursive: true, force: true }, () => {});
  if (job.timer) { clearTimeout(job.timer); job.timer = null; }
  flush(job);
}

function readBody(req, limit = 20000) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', (c) => { n += c.length; if (n > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

const json = (res, code, obj) => { res.mmErr = obj && obj.error; res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };

const SEO = require('./seo');
const SEO_IMG = require('./seo-assets');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (req.method === 'POST' && (p === '/api/run' || p === '/api/test')) {
      const b = await readBody(req);
      res.on('finish', () => { if (res.statusCode >= 400) log('run_reject', { status: res.statusCode, why: res.mmErr, mode: b.mode || (p === '/api/test' ? 'check' : null), h1: String(b.host1 || '').slice(0, 80), h2: String(b.host2 || '').slice(0, 80), ip: ipHash(req) }); });
      const input = {
        mode: p === '/api/test' ? 'check' : (MODES[b.mode] ? b.mode : (b.dry === false ? 'sync' : 'dry')),
        host1: String(b.host1 || '').trim(), user1: String(b.user1 || '').trim(), pass1: b.pass1,
        host2: String(b.host2 || '').trim(), user2: String(b.user2 || '').trim(), pass2: b.pass2,
        automap: b.automap !== false, move: !!b.move, strict: !!b.strict,
        sub1: String(b.sub1 || '').trim(), sub2: String(b.sub2 || '').trim()
      };
      try { input.extra = parseExtra(b.extra); } catch (e) { return json(res, 400, { error: e.message }); }
      if (!validFolder(input.sub1) || !validFolder(input.sub2)) return json(res, 400, { error: 'That sub-folder name is not valid.' });
      if (!validHost(input.host1) || !validHost(input.host2)) return json(res, 400, { error: 'Enter valid server names, like imap.example.com.' });
      if (!validUser(input.user1) || !validUser(input.user2)) return json(res, 400, { error: 'Enter both email addresses.' });
      const viaMs = input.host1.toLowerCase() === MS_HOST && !input.pass1;
      if (viaMs && !msConfigured()) return json(res, 400, { error: 'Microsoft 365 needs a company login, which is not set up on this server yet.' });
      if ((!viaMs && !validPass(input.pass1)) || !validPass(input.pass2)) return json(res, 400, { error: 'Enter both passwords.' });
      if (runningCount() >= MAX_RUNNING) return json(res, 429, { error: 'The server is busy with other transfers. Try again in a few minutes.' });
      if (viaMs) {
        try { input.token = await msToken(); } catch (e) { return json(res, 502, { error: 'Could not sign in to Microsoft 365: ' + e.message }); }
      }
      const job = startJob(input);
      log('run_start', { id: job.id.slice(0, 8), mode: input.mode, h1: input.host1, h2: input.host2, d1: domainOf(input.user1), d2: domainOf(input.user2), move: input.move, strict: input.strict, extra: input.extra.length, sub: !!(input.sub1 || input.sub2), viaMs, ip: ipHash(req) });
      return json(res, 200, { id: job.id });
    }
    if (req.method === 'POST' && p === '/api/clientlog') {
      const b = await readBody(req, 4000);
      if (++clientLogs <= 20) log('client_error', { page: String(b.page || '').slice(0, 60), msg: scrub(b.msg), src: String(b.src || '').slice(0, 80), line: +b.line || 0, ua: String(req.headers['user-agent'] || '').slice(0, 80) });
      res.writeHead(204); return res.end();
    }
    if (req.method === 'GET' && p === '/api/config') return json(res, 200, { m365: msConfigured(), running: runningCount(), max: MAX_RUNNING });
    let m = p.match(/^\/api\/jobs\/([0-9a-f]{32})\/(stream|stop|pause|log)$/);
    if (m) {
      const job = jobs.get(m[1]);
      if (!job) return json(res, 404, { error: 'Transfer not found. It may have expired.' });
      if (m[2] === 'stream') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        const last = parseInt(req.headers['last-event-id'] || url.searchParams.get('from') || '-1', 10);
        res.write(`retry: 2000\n\n`);
        for (let i = Math.max(0, last + 1); i < job.lines.length; i++) res.write(`id: ${i}\nevent: line\ndata: ${JSON.stringify(job.lines[i])}\n\n`);
        res.write(`event: state\ndata: ${JSON.stringify(state(job))}\n\n`);
        job.clients.add(res);
        const ka = setInterval(() => res.write(': ka\n\n'), 20000);
        req.on('close', () => { clearInterval(ka); job.clients.delete(res); });
        return;
      }
      if (m[2] === 'log') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': 'attachment; filename="mailmover-log.txt"' });
        return res.end(job.lines.map((l) => `${l.t} ${l.m}`).join('\n') + '\n');
      }
      if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
      if (job.status !== 'running') return json(res, 409, { error: 'Not running.' });
      if (m[2] === 'stop') { job.stopRequested = true; job.proc.kill('SIGTERM'); return json(res, 200, { ok: true }); }
      if (m[2] === 'pause') { job.paused = !job.paused; job.proc.kill('SIGUSR1'); flush(job); return json(res, 200, { paused: job.paused }); }
    }
    if (req.method === 'GET' && p === '/healthz') return json(res, 200, { ok: true });
    if (req.method === 'GET' && SEO_IMG[p]) { res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' }); return res.end(SEO_IMG[p]); }
    if (req.method === 'GET' && p === '/robots.txt') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }); return res.end(SEO.robots()); }
    if (req.method === 'GET' && p === '/sitemap.xml') { res.writeHead(200, { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' }); return res.end(SEO.sitemap()); }
    if (req.method === 'GET' && p === '/llms.txt') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }); return res.end(SEO.llms()); }
    if (req.method === 'GET') {
      const LEGAL = { '/terms': 'terms.html', '/privacy': 'privacy.html', '/security': 'security.html', '/acceptable-use': 'acceptable-use.html', '/legal': 'legal.html' };
      const rel = p === '/' ? 'index.html' : (LEGAL[p.replace(/\/+$/, '')] || p.replace(/^\/+/, ''));
      const file = path.normalize(path.join(PUBLIC, rel));
      if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(404); return res.end('Not found'); }
      return fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        // the layout switcher (Rail / Console / Advanced) is added to the main page without editing it
        // the Legal menu (Terms, Privacy, Security...) is added to both app pages the same way
        const LM = '<script src="/legal-menu.js"></script>';
        const DK = '<link id="mm-dark" rel="stylesheet" href="/dark.css" media="(prefers-color-scheme: dark)"><script src="/theme.js"></script>';
        const out = rel === 'index.html' ? data.toString().replace('Extra imapsync parameters', 'Extra MailMover parameters').replace('</head>', '<style>body[data-layout=console] #modebar #w-extra{flex:1;min-width:0;flex-direction:row;align-items:center;gap:10px;white-space:nowrap}</style>' + DK + '</head>').replace('</body>', '<script src="/switch.js"></script><script src="/pw-eye.js"></script><script src="/presets.js"></script><script src="/live.js"></script>' + LM + '</body>') : rel === 'advanced.html' ? data.toString().replace('</head>', '<link rel="stylesheet" href="/advanced-fit.css">' + DK + '</head>').replace('</body>', '<script src="/advanced-fit.js"></script><script src="/presets.js"></script><script src="/live.js"></script>' + LM + '</body>') : /^(terms|privacy|security|acceptable-use|legal)\.html$/.test(rel) ? data.toString().replace('</head>', DK + '</head>') : data;
        const sk = Object.keys(SEO.PAGES).find(k => SEO.PAGES[k].file === rel);
        res.end(path.extname(file) === '.html' && (sk || rel === 'advanced.html') ? SEO.decorate(out.toString(), sk || '/', rel === 'advanced.html') : out);
      });
    }
    res.writeHead(404); res.end('Not found');
  } catch (e) {
    log('server_error', { path: p, msg: scrub(e && e.message) });
    if (!res.headersSent) json(res, 400, { error: 'Bad request.' });
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [id, j] of jobs) if (!['running', 'starting'].includes(j.status) && now - j.created > JOB_TTL_MS) jobs.delete(id);
}, 600000).unref();

process.on('SIGTERM', () => { for (const j of jobs.values()) if (j.proc && j.status === 'running') j.proc.kill('SIGTERM'); process.exit(0); });
server.listen(PORT, '0.0.0.0', () => { console.log('MailMover listening on ' + PORT); log('server_start', { port: PORT, max: MAX_RUNNING, m365: msConfigured() }); });
