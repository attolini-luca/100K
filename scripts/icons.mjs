// Pubblica le icone personali: legge icons/{uid} da Firestore, scrive icone/<impronta>/ e cancella la richiesta.
import fs from 'node:fs';
import sharp from 'sharp';
import admin from 'firebase-admin';

const raw = (process.env.FIREBASE_SA || '').trim();
if (!raw) { console.log('Manca FIREBASE_SA: niente da fare'); process.exit(0); }
admin.initializeApp({credential: admin.credential.cert(JSON.parse(raw))});
const db = admin.firestore();
const base = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const snap = await db.collection('icons').get();
let n = 0;
for (const d of snap.docs) {
  const {h, png, name} = d.data();
  if (!/^[0-9a-f]{16}$/.test(h || '') || !/^data:image\/(png|jpeg);base64,/.test(png || '')) { await d.ref.delete(); continue; }
  const buf = Buffer.from(png.split(',')[1], 'base64'), dir = `icone/${h}`;
  fs.mkdirSync(dir, {recursive: true});
  await sharp(buf).resize(512, 512).png().toFile(`${dir}/icon-512.png`);
  await sharp(buf).resize(192, 192).png().toFile(`${dir}/icon-192.png`);
  await sharp(buf).resize(180, 180).flatten({background: '#e2ecfa'}).png().toFile(`${dir}/apple-touch-icon.png`);
  const m = {...base, id: `../../?u=${h}`, name: '100K', start_url: '../../#home', scope: '../../',
    icons: [{src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'}, {src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'}, {src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'}]};
  fs.writeFileSync(`${dir}/manifest.json`, JSON.stringify(m, null, 2));
  await d.ref.delete(); n++; console.log('Icona pronta per', name || d.id);
}
console.log(`Fatto: ${n} icone`);
