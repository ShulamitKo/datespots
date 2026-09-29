// רינדור demo.html פריים אחרי פריים.
//   node render.mjs preview 1.5,9,22   -> out/pv_<t>.png לבדיקה מהירה
//   node render.mjs full               -> out/frames  (30fps, רקע חי - ל-MP4)
//   node render.mjs gif                -> out/gframes (10fps, רקע סטטי - GIF קטן)
import { chromium } from 'playwright';
import fs from 'fs';

const DIR = new URL('.', import.meta.url).pathname;
const OUT = DIR + 'out/';
const DUR = 33.6;                      // 14 תיבות של 2.4 שנ' (100 BPM)
const mode = process.argv[2];

const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('file://' + DIR + 'demo.html', { waitUntil: 'networkidle' });
await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
if (!(await p.evaluate(() => document.fonts.check('900 50px Heebo')))) console.warn('warning: Heebo font did not load');
await p.evaluate(pos => setPos(pos), JSON.parse(fs.readFileSync(OUT + 'pos.json')));

if (mode === 'preview') {
  for (const t of process.argv[3].split(',').map(Number)) {
    await p.evaluate(t => render(t), t);
    await p.screenshot({ path: `${OUT}pv_${t}.png` });
  }
} else {
  const gif = mode === 'gif';
  if (gif) await p.evaluate(() => setStill(true));
  const fps = gif ? 10 : 30, dir = OUT + (gif ? 'gframes' : 'frames');
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  for (let f = 0; f < fps * DUR; f++) {
    await p.evaluate(t => render(t), f / fps);
    await p.screenshot({ path: `${dir}/f${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 93 });
  }
}
await b.close();
