const SCHEDA = 'https://attolini-luca.github.io/100K/';
const NOMI = {colazione: 'colazione', pranzo: 'pranzo', pre: 'prima dei pesi', sera: 'sera'};
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
// l'app salva qui quali integratori prendi in ogni momento della giornata
async function suppMap() {
  try { const c = await caches.open('100k-cfg'); const r = await c.match('supp.json'); return r ? await r.json() : null; } catch (e) { return null; }
}
const list = a => a && a.length ? a.join(', ') : null;
async function propo() {
  try { const c = await caches.open('100k-cfg'); const r = await c.match('proposito.json'); return r ? await r.json() : {}; } catch (e) { return {}; }
}
const oggi = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
async function piano() {
  try { const c = await caches.open('100k-cfg'); const r = await c.match('piano.json'); return r ? await r.json() : null; } catch (e) { return null; }
}
async function show(d) {
  let body = d.body || '';
  if (/\{(oggi|segna)\}/.test(body)) {
    const p = await piano(), t = p ? p[oggi()] : null;
    body = body.replace('{oggi}', p ? (t ? `Oggi: ${t}.` : 'Oggi riposo: una camminata e un po\' di mobilità.') : 'Apri l\'app per vedere cosa ti aspetta oggi.')
      .replace('{segna}', t ? 'Segna carichi, km e note di oggi. ' : '');
  }
  if (body.includes('{proposito}')) { const p = (await propo())[oggi()]; body = body.replace('{proposito}', p ? `Il tuo proposito: “${p}”.` : '').trim(); }
  const actions = [];
  if (/\{\w+\}/.test(body)) {
    const m = await suppMap();
    if (d.sup && m && !list(m[d.sup])) { if (!d.alt) return; body = d.alt.trim(); d.sup = ''; } // nessun integratore in quel momento
    if (m && !list(m.corsa)) body = body.replace(/ ?Per la corsa: \{corsa\}\./, '');
    body = body.replace(/\{(\w+)\}/g, (x, k) => (m && list(m[k])) || (k === 'post' ? 'creatina e shake' : k === 'corsa' ? 'elettroliti' : 'apri l\'app per vederli'))
      .replace(/ Dopo i pesi: apri l'app per vederli\./, '');
  }
  const opt = {body, icon: 'icon-192.png', badge: 'badge-96.png', tag: d.tag || '100k', renotify: true, vibrate: [80, 40, 80], data: {url: d.url || SCHEDA, sup: d.sup || ''}};
  if (d.sup) { opt.requireInteraction = true; opt.vibrate = [300, 150, 300, 150, 300]; opt.actions = [{action: 'presi', title: 'Presi ✓'}, {action: 'apri', title: 'Apri'}]; }
  return self.registration.showNotification(d.title || '100K', opt);
}
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {body: e.data ? e.data.text() : ''}; }
  e.waitUntil(show(d));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const data = e.notification.data || {};
  const url = data.sup ? SCHEDA + '#cibo' + (e.action === 'presi' ? '?presi=' + data.sup : '') : (data.url || SCHEDA);
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    for (const c of all) if (c.url.startsWith(SCHEDA)) { await c.focus(); try { await c.navigate(url); } catch (err) { c.postMessage({go: url}); } return; }
    await self.clients.openWindow(url);
  })());
});
