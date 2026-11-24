// Copia del piano della scheda (settimane 0-4). Generato dalla pagina della scheda.
const DAY_MS = 864e5, START = Date.UTC(2026, 10, 23);
const DAYS = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const DSHORT = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
const MONTHS = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const PLANNED_WEEKS = 4;
const toMs = iso => Date.parse(iso + 'T00:00:00Z');
const isoOf = ms => new Date(ms).toISOString().slice(0, 10);
const localToday = () => { const d = new Date(); return isoOf(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); };
const addDays = (iso, n) => isoOf(toMs(iso) + n * DAY_MS);
const offs = iso => Math.round((toMs(iso) - START) / DAY_MS);
const weekOf = iso => Math.floor(offs(iso) / 7);
const dayIdx = iso => ((offs(iso) % 7) + 7) % 7;
const weekStart = w => isoOf(START + w * 7 * DAY_MS);
const dnum = iso => new Date(toMs(iso)).getUTCDate();
const nice = iso => { const d = new Date(toMs(iso)); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]; };
const short = iso => { const d = new Date(toMs(iso)); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()].slice(0, 3); };
const num = v => { if (v === '' || v == null) return null; const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const fmt = (n, d = 1) => n == null ? '–' : (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('it-IT');
const SESS = {
  push: {t: 'Push', d: 'petto, spalle, tricipiti', ex: ['panca','military','inclMan','dip','alzate','pushdown','finPush'], min: 60},
  pull: {t: 'Pull', d: 'stacco, dorso, bicipiti', ex: ['stacco','trazioni','remBil','latStretta','facePull','curlBil','finPull'], min: 60},
  lower: {t: 'Lower', d: 'squat e gambe', ex: ['squat','bulgari','stepup','nordic','polpacci','soleo','tibiali'], min: 55},
  upper: {t: 'Upper e core', d: 'ipertrofia, core, accessori gambe', ex: ['inclMan2','remMan','spinteSp','latLarga','croci','alzate2','curlMan','french','pallof','plankLat','deadbug','copenhagen','farmer'], min: 65}
};

/* ================= piano ================= */
const Z2 = 'Z2: 140-152 bpm. Se sfori, cammini finché torni a 145.';
const run = (id, slot, min, km, title, extra, ic) => ({id, slot, kind: 'run', cat: 'run', ic: ic || 'shoe', title: title || `Corsa facile ${min}'`, planMin: min, planKm: km, target: `${min}' in zona 2 · circa ${fmt(km)} km`, steps: [Z2].concat(extra || [])});
const strength = (key, slot, w) => ({id: key, slot, kind: 'strength', cat: 'str', ic: 'dumbbell', title: `${SESS[key].t}: ${SESS[key].d}`, planMin: SESS[key].min, sess: key,
  target: w === 1 ? 'Carichi leggeri: 3 ripetizioni in riserva per trovare i pesi' : w === 4 ? 'Scarico: metà delle serie, stessi carichi' : 'RPE 8: 1-2 ripetizioni in riserva. Tutte le serie al massimo? Prossima volta +2,5 kg', half: w === 4});
const mob = (id, slot, min, t) => ({id, slot, kind: 'mobility', cat: 'mob', ic: 'leaf', title: t || `Mobilità ${min}'`, planMin: min, target: '60-90" per posizione e per lato',
  items: ['Rullo su quadricipiti, polpacci, glutei','Couch stretch','90/90 per le anche','Piccione','Caviglia al muro','Polpaccio e soleo al gradino','Open book e gatto-mucca','Femorali con elastico']});
const PLYO12 = [['pogo','Pogo jumps 3 × 20'],['skip','Skip A 3 × 20 m'],['box','Salti sul box 3 × 5'],['lungo','Salto in lungo da fermo 3 × 4']];
const PLYO34 = [['pogo','Pogo jumps 3 × 25'],['skip','Skip A 3 × 20 m'],['box','Salti sul box 4 × 5'],['lungo','Salto in lungo da fermo 3 × 4'],['mono','Saltelli su una gamba 3 × 8 per gamba'],['bound','Bounding 3 × 20 m']];
const QUAL = {
  1: {t: 'Salite 8 × 45"', km: 7, min: 45, steps: ["15' di riscaldamento in Z1-Z2", '8 × 45" in salita al 6-8%, sforzo 9 su 10', 'Recupero scendendo camminando (circa 1\'30")', "10' di defaticamento in Z1"]},
  2: {t: "Soglia 3 × 8'", km: 8, min: 55, steps: ["15' di riscaldamento e 4 allunghi da 20\"", "3 × 8' in Z4 (161-171 bpm), circa 6:00-6:10/km", "2' di corsa lentissima tra una e l'altra", "10' di defaticamento"]},
  3: {t: '6 × 800 m', km: 8.5, min: 55, steps: ["15' di riscaldamento e 4 allunghi", '6 × 800 m in piano a ritmo 5 km (circa 5:35-5:45/km)', "Recupero 2' camminando o al trotto", "10' di defaticamento"]},
  4: {t: "40' Z2 + 6 allunghi", km: 6.5, min: 45, steps: ["40' in Z2", '6 allunghi da 20" in progressione', "1' di camminata tra uno e l'altro"]}
};
const CIRC = {
  1: {g: 4, rec: "2'", list: ['500 m remo','15 wall ball','250 m SkiErg','12 calorie di bike'], min: 30},
  2: {g: 4, rec: "2'", list: ['500 m SkiErg','20 wall ball','500 m remo'], min: 32},
  3: {g: 5, rec: "1'30\"", list: ['500 m remo','15 wall ball','300 m SkiErg','10 burpee'], min: 35},
  4: {g: 3, rec: "2'", list: ['500 m remo','10 wall ball','250 m SkiErg'], min: 20}
};
const Z2MIN = {1: [40,45,30,30,85], 2: [40,50,35,35,95], 3: [45,55,35,40,105], 4: [35,40,30,0,75]};
const Z2KM = {1: [6,6.5,4.5,4.5,12], 2: [6,7,5,5,13.5], 3: [6.5,8,5,6,14], 4: [5,6,4.5,0,11]};
const STAIR = {1: 15, 2: 20, 3: 25, 4: 15};
function plan(iso) {
  const w = weekOf(iso), d = dayIdx(iso);
  if (w < 0) return {w, d, note: 'Il piano parte lunedì 23 novembre 2026.', s: []};
  if (w === 0) {
    const s = [
      [{id: 'test1', slot: 'Pomeriggio', kind: 'test', cat: 'q', ic: 'watch', title: 'Primo test di soglia', planMin: 30, planKm: 4.7, target: 'Falsato da digiuno e trail del mattino: si rifà giovedì', steps: []}],
      [Object.assign(strength('push', 'Sera', 2), {target: 'Solo parte alta, niente gambe. Carichi leggeri per prendere le misure'})],
      [run('z2', 'Mattina', 35, 5, "Corsa facile 30-40'"), mob('mob', 'Sera', 15)],
      [{id: 'test', slot: 'Pomeriggio', kind: 'test', cat: 'q', ic: 'watch', title: "Test di soglia 30'", planMin: 55, planKm: 8, target: 'Pasto con carboidrati 2-3 ore prima, gambe fresche',
        steps: ["15' di riscaldamento e 3-4 allunghi", "30' regolari: parti a 6:00-6:10/km, poi aumenta", 'Al minuto 10 premi "giro" sull\'orologio', "10' di defaticamento", 'Segna la FC media degli ultimi 20 minuti']}],
      [mob('mob', 'Giornata', 30, "Riposo e mobilità 30'")],
      [run('long', 'Mattina', 70, 10, "Lungo facile 60-75'", ['Su sterrato: cammina le salite se sfori 152'], 'mountain')],
      []
    ][d];
    return {w, d, s, note: d === 6 ? 'Riposo o camminata.' : ''};
  }
  if (w > PLANNED_WEEKS) return {w, d, s: [], note: `La settimana ${w} la scriviamo insieme in base ai dati delle prime quattro.`};
  const zm = Z2MIN[w], zk = Z2KM[w], q = QUAL[w], c = CIRC[w];
  const days = [
    [run('z2', 'Mattina', zm[0], zk[0]), strength('push', 'Sera', w)],
    [run('z2', 'Mattina', zm[1], zk[1]), strength('pull', 'Sera', w)],
    [{id: 'qual', slot: 'Mattina', kind: 'run', cat: 'q', ic: 'bolt', title: q.t, planMin: q.min, planKm: q.km, target: `Seduta di qualità · circa ${fmt(q.km)} km`, steps: q.steps},
     {id: 'plyo', slot: 'Sera', kind: 'plyo', cat: 'mob', ic: 'feet', title: 'Pliometria', planMin: 15, target: 'Prima della Lower: 60-80 contatti, recupero completo', items: w <= 2 ? PLYO12 : PLYO34}, strength('lower', 'Sera', w)],
    [run('z2', 'Mattina', zm[2], zk[2]), {id: 'circ', slot: 'Sera', kind: 'circuit', cat: 'circ', ic: 'flame', title: `Hybrid circuit · ${c.g} giri`, planMin: c.min, target: `Recupero ${c.rec} tra i giri · sforzo 7 su 10`,
      steps: c.list.concat(["Prima: 5' di bike facile e 5' di mobilità", 'Wall ball da 6 kg a 3 m'])}, mob('mob', 'Sera', 10, "Mobilità 10'")],
    (zm[3] ? [run('z2', 'Mattina', zm[3], zk[3])] : []).concat([strength('upper', 'Sera', w), {id: 'stair', slot: 'Sera', kind: 'stair', cat: 'stair', ic: 'stairs', title: `StairMaster ${STAIR[w]}'`, planMin: STAIR[w], target: 'In zona 2, 140-152 bpm, dopo l\'upper', steps: []}]),
    [run('long', 'Mattina', zm[4], zk[4], `Lungo ${Math.floor(zm[4] / 60)}h${String(zm[4] % 60).padStart(2, '0')}'`, [w === 3 ? 'Su sterrato con 300-400 m di dislivello' : 'Su sterrato o collina', 'Dal minuto 45 mangia qualcosa ogni 40 minuti'], 'mountain')],
    [mob('mob', 'Giornata', 35, "Off: rullo e stretching")]
  ];
  return {w, d, s: days[d], note: d === 6 ? 'Giornata libera, come nei programmi di Nick Bare.' : ''};
}

export { plan, weekOf, dayIdx, addDays, nice, DAYS, PLANNED_WEEKS, fmt };
