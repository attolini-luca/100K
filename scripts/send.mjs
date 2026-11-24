// Invia le notifiche push della scheda 100K. Gira su GitHub Actions (vedi .github/workflows/notifiche.yml).
import webpush from 'web-push';
import { plan, weekOf, dayIdx, addDays, PLANNED_WEEKS } from './plan.mjs';

const SCHEDA = 'https://attolini-luca.github.io/100K/';
const VAPID_PUBLIC = 'BEmX_RHaPOMpPT2WoDBsLhasaYmW-7AWiwcUfRH2XCE8GFwH9Z7OCfQo8FfZVxswyxbVin9-1fZwCB7nguaY3ew';

// orario di ogni notifica (ora di Roma) e cron UTC che la fa partire (inverno + estate)
const SLOTS = {
  mattina:    {at: '06:00', crons: ['0 4,5 * * *']},
  misure:     {at: '06:20', crons: ['20 4,5 * * *']},
  carburante: {at: '18:30', crons: ['30 16,17 * * *']},
  report:     {at: '19:00', crons: ['0 17,18 * * *']},
  scheda:     {at: '21:30', crons: ['30 19,20 * * *']},
  integColazione: {at: '07:30', crons: ['30 5,6 * * *']},
  integPranzo:    {at: '13:00', crons: ['0 11,12 * * *']},
  integPre:       {at: '18:00', crons: ['0 16,17 * * *']}
};

function rome(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(d).map(x => [x.type, x.value]));
  return {date: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute};
}
const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

const label = ss => {
  if (ss.kind === 'strength') return ss.title.split(':')[0];
  if (ss.kind === 'plyo' || ss.kind === 'mobility') return null;
  return ss.title;
};
const training = iso => plan(iso).s.filter(ss => ss.kind !== 'mobility');
const listOf = iso => training(iso).map(label).filter(Boolean).join(' · ');

const FRASI = [
  'Domani non serve motivazione, serve un piano: scrivilo.',
  'Il corpo arriva dove la testa ha già deciso di andare.',
  'Una seduta fatta male vale più di una seduta saltata.',
  'Non devi avere voglia, devi solo iniziare.',
  'Il lungo si costruisce anche con il sonno di stasera.',
  'Ogni serie è un mattone: domani quanti ne metti?',
  'Riposare bene è parte del lavoro, non una pausa dal lavoro.',
  'Chi scrive l\'obiettivo la sera lo trova pronto la mattina.',
  'Piano, ma tutti i giorni.',
  'Il dislivello non si negozia: si sale.',
  'Fai domani una cosa che il te di un mese fa non riusciva a fare.',
  'La prima sfida di domani la vinci quando metti le scarpe.',
  'Un giorno storto non spegne il fuoco, arrendersi sì.',
  'Proteine, sonno e acqua: il resto viene da sé.',
  'Allenati per la persona che vuoi essere al traguardo.',
  'Il fuoco si tiene acceso un ceppo alla volta.',
  'Meglio dieci minuti fatti che un\'ora rimandata.',
  'Scegli una cosa sola da fare benissimo domani.',
  'La zona 2 è noiosa finché non vedi il passo scendere.',
  'Domani conta di più del giorno perfetto che aspetti.'
];
const frase = iso => FRASI[Math.abs(Math.round((Date.parse(iso) - Date.parse('2026-11-23')) / 864e5)) % FRASI.length];

function message(slot, iso) {
  const w = weekOf(iso), d = dayIdx(iso), p = plan(iso);
  if (slot === 'test') return {title: 'Notifiche attive ✅', body: 'Ciao Luca, da domani alle 6:00 ti scrivo io. Si parte!'};
  if (slot === 'testInteg') return {title: 'Integratori della colazione 💊', body: '{colazione}', sup: 'colazione'};
  if (slot === 'mattina') {
    const extra = [];
    if (w > PLANNED_WEEKS && d === 0) extra.push(`Settimana ${w}: scrivi a Claude per il piano nuovo.`);
    if (w === 4 && d === 0) extra.push('Settimana di scarico: volume giù, recupera bene.');
    if (p.s.some(ss => ss.kind === 'test')) extra.push('Test di soglia: pasto con carboidrati 2-3 ore prima.');
    const today = listOf(iso);
    if (p.s.some(ss => ss.id === 'long' || ss.cat === 'q')) extra.push('Per la corsa: {corsa}.');
    const body = today ? `Oggi: ${today}.` : (w > PLANNED_WEEKS ? 'Il piano di questa settimana va ancora scritto.' : 'Oggi riposo: rullo, stretching e una camminata.');
    return {title: 'Buongiorno Luca ☀️', body: ['{proposito}', body, ...extra].join(' ')};
  }
  if (slot === 'misure') {
    if (![0, 2, 4].includes(d)) return null;
    return {title: 'Misurazioni 📏', body: 'Pesati e segna FC a riposo, HRV e sonno nella scheda.'};
  }
  if (slot === 'carburante') {
    const t = plan(addDays(iso, 1)).s;
    const test = t.find(ss => ss.kind === 'test'), q = t.find(ss => ss.cat === 'q'), long = t.find(ss => ss.id === 'long');
    if (test) return {title: 'Carburante per domani 🍝', body: 'Domani test di soglia: cena ricca di carboidrati e a letto presto.'};
    if (long) return {title: 'Carburante per domani 🍝', body: `Domani ${long.title}: cena con carboidrati, prepara gel e acqua, a letto presto.`};
    if (q) return {title: 'Carburante per domani 🍝', body: `Domani ${q.title}: cena con carboidrati e colazione leggera un'ora prima.`};
    return null;
  }
  if (slot === 'scheda') {
    const today = listOf(iso);
    // la sera arriva sempre: integratori della notte e, se ti sei allenato, la scheda da compilare
    const propo = ` ✍️ Scrivi il proposito di domani e ricarichi il Rompighiaccio. «${frase(iso)}»`;
    return {title: 'Prima di dormire 🌙', body: (today ? 'Integratori: {sera}. Segna km, carichi e note di oggi.' : 'Integratori: {sera}.') + propo, sup: 'sera', alt: (today ? 'Segna km, carichi e note di oggi.' : '') + propo};
  }
  const weights = plan(iso).s.some(ss => ss.kind === 'strength' || ss.kind === 'circuit');
  if (slot === 'integColazione') return {title: 'Integratori della colazione 💊', body: '{colazione}', sup: 'colazione'};
  if (slot === 'integPranzo') return {title: 'Integratori del pranzo 💊', body: '{pranzo}', sup: 'pranzo'};
  if (slot === 'integPre') return weights ? {title: 'Tra poco si allena 💪', body: 'Ora: {pre}. Dopo i pesi: {post}.', sup: 'pre'} : null;
  if (slot === 'report') {
    if (d !== 6) return null;
    return {title: 'Report settimanale 📊', body: `Scrivi a Claude km, peso medio e sensazioni: prepariamo la settimana ${w + 1}.`};
  }
  return null;
}

// messaggi per gli invitati: il service worker sul loro telefono completa {oggi}, {segna}, {proposito} e gli integratori
function guestMessage(slot, iso, u) {
  const d = dayIdx(iso), mod = u.mod || {}, days = u.days || {}, nome = u.name || '';
  const propo = ` ✍️ Scrivi il proposito di domani e ricarichi il Rompighiaccio. «${frase(iso)}»`;
  if (slot === 'test') return {title: 'Notifiche attive ✅', body: `Ciao ${nome}, da domani ti scrivo io. Si parte!`};
  if (slot === 'mattina') return {title: `Buongiorno ${nome} ☀️`, body: '{proposito} {oggi}'};
  if (slot === 'misure') return [0, 2, 4].includes(d) ? {title: 'Misurazioni 📏', body: 'Pesati e segna FC a riposo e sonno nell\'app.'} : null;
  if (slot === 'carburante') return mod.run !== false && (days.q || []).includes((d + 1) % 7) ? {title: 'Carburante per domani 🍝', body: 'Domani allenamento intenso: cena con carboidrati e a letto presto.'} : null;
  if (slot === 'scheda') return mod.supp !== false ? {title: 'Prima di dormire 🌙', body: 'Integratori: {sera}. {segna}' + propo.trim(), sup: 'sera', alt: '{segna}' + propo.trim()} : {title: 'Prima di dormire 🌙', body: '{segna}' + propo.trim()};
  if (mod.supp === false) return null;
  if (slot === 'integColazione' || slot === 'testInteg') return {title: 'Integratori della colazione 💊', body: '{colazione}', sup: 'colazione'};
  if (slot === 'integPranzo') return {title: 'Integratori del pranzo 💊', body: '{pranzo}', sup: 'pranzo'};
  if (slot === 'integPre') return (days.str || []).includes(d) ? {title: 'Tra poco si allena 💪', body: 'Ora: {pre}. Dopo i pesi: {post}.', sup: 'pre'} : null;
  return null;
}

// iscrizioni salvate dall'app in Firestore (serve il segreto FIREBASE_SA, la chiave dell'account di servizio)
async function firestoreSubs() {
  const raw = (process.env.FIREBASE_SA || '').trim();
  if (!raw) return {list: [], del: async () => {}};
  const admin = (await import('firebase-admin')).default;
  admin.initializeApp({credential: admin.credential.cert(JSON.parse(raw))});
  const db = admin.firestore(), snap = await db.collection('push').get();
  const list = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(u => u.sub).map(u => { try { return {...u, sub: JSON.parse(u.sub)}; } catch (e) { return null; } }).filter(Boolean);
  return {list, del: id => db.collection('push').doc(id).delete()};
}

async function main() {
  const now = rome();
  let slot = process.env.SLOT || '';
  const iso = process.env.DATE || now.date;
  if (!slot) {
    slot = Object.keys(SLOTS).find(k => SLOTS[k].crons.includes(process.env.SCHEDULE || '')) || '';
    if (!slot) { console.log('Nessuna notifica per', process.env.SCHEDULE); return; }
    const late = now.min - toMin(SLOTS[slot].at);
    if (late < 0 || late >= 45) { console.log(`Ora di Roma non corrisponde a ${slot} (${late} min): salto`); return; }
  }
  if (!process.env.VAPID_PRIVATE_KEY) throw new Error('Manca il segreto VAPID_PRIVATE_KEY');
  webpush.setVapidDetails('https://attolini-luca.github.io/100k/', VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY.trim());
  const fs = await firestoreSubs(), seen = new Set(), targets = [];
  for (const u of fs.list) { if (seen.has(u.sub.endpoint)) continue; seen.add(u.sub.endpoint); targets.push(u); }
  const raw = (process.env.PUSH_SUBSCRIPTION || '').trim();
  if (raw) for (const s of [].concat(JSON.parse(raw))) if (!seen.has(s.endpoint)) { seen.add(s.endpoint); targets.push({id: null, owner: true, name: 'Luca', sub: s}); }
  if (!targets.length) throw new Error('Nessun iscritto: manca PUSH_SUBSCRIPTION e Firestore è vuoto');
  let sent = 0;
  for (const u of targets) {
    const msg = u.owner ? message(slot, iso) : guestMessage(slot, iso, u);
    if (!msg) { console.log('Niente oggi per', u.name, slot); continue; }
    const payload = JSON.stringify({...msg, url: SCHEDA + (msg.sup ? '#cibo' : ''), tag: `100k-${slot}`});
    try { const r = await webpush.sendNotification(u.sub, payload, {TTL: 6 * 3600, urgency: 'high'}); sent++; console.log('Inviata', slot, iso, u.name, r.statusCode); }
    catch (e) {
      if ((e.statusCode === 404 || e.statusCode === 410) && u.id) { await fs.del(u.id); console.log('Iscrizione scaduta, tolta:', u.name); }
      else console.error('Errore per', u.name, e.statusCode || '', e.body || e.message);
    }
  }
  console.log(`Fatto: ${sent} su ${targets.length}`);
}
main().catch(e => { console.error(e.body || e.message || e); process.exit(1); });
