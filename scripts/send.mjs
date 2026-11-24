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
  scheda:     {at: '21:30', crons: ['30 19,20 * * *']}
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

function message(slot, iso) {
  const w = weekOf(iso), d = dayIdx(iso), p = plan(iso);
  if (slot === 'test') return {title: 'Notifiche attive ✅', body: 'Ciao Luca, da domani alle 6:00 ti scrivo io. Si parte!'};
  if (slot === 'mattina') {
    const extra = [];
    if (w > PLANNED_WEEKS && d === 0) extra.push(`Settimana ${w}: scrivi a Claude per il piano nuovo.`);
    if (w === 4 && d === 0) extra.push('Settimana di scarico: volume giù, recupera bene.');
    if (p.s.some(ss => ss.kind === 'test')) extra.push('Test di soglia: pasto con carboidrati 2-3 ore prima.');
    const today = listOf(iso);
    const body = today ? `Oggi: ${today}.` : (w > PLANNED_WEEKS ? 'Il piano di questa settimana va ancora scritto.' : 'Oggi riposo: rullo, stretching e una camminata.');
    return {title: 'Buongiorno Luca ☀️', body: [body, ...extra].join(' ')};
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
    if (!today) return null;
    return {title: 'Hai compilato la scheda? ✍️', body: `Segna km, carichi e note di oggi: ${today}.`};
  }
  if (slot === 'report') {
    if (d !== 6) return null;
    return {title: 'Report settimanale 📊', body: `Scrivi a Claude km, peso medio e sensazioni: prepariamo la settimana ${w + 1}.`};
  }
  return null;
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
  const msg = message(slot, iso);
  if (!msg) { console.log('Niente da mandare oggi per', slot); return; }
  const raw = (process.env.PUSH_SUBSCRIPTION || '').trim();
  if (!raw || !process.env.VAPID_PRIVATE_KEY) throw new Error('Mancano i segreti PUSH_SUBSCRIPTION o VAPID_PRIVATE_KEY');
  const subs = [].concat(JSON.parse(raw));
  webpush.setVapidDetails('https://attolini-luca.github.io/100k/', VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY.trim());
  const payload = JSON.stringify({...msg, url: SCHEDA, tag: `100k-${slot}`});
  for (const s of subs) {
    const r = await webpush.sendNotification(s, payload, {TTL: 6 * 3600, urgency: 'high'});
    console.log('Inviata', slot, iso, r.statusCode, msg.title);
  }
}
main().catch(e => { console.error(e.body || e.message || e); process.exit(1); });
