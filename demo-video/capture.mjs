// צילומי מצבים של האפליקציה האמיתית לסרטון ההדגמה, ומיקומי הכפתורים שעליהם "לוחצים".
// דורש שרת פיתוח פעיל (ראו build.sh). כל הקריאות ל-Supabase מיורטות ומוחזרות
// מתוך out/spots.json, כך שלא צריך מפתחות ולא נוגעים בנתונים האמיתיים.
import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'url';

const DIR = fileURLToPath(new URL('.', import.meta.url));
const OUT = DIR + 'out/';
const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const SPOT_ID = 'e7069a0b-b49a-4c6c-a0a8-b67e171ec26c';   // "מרפסת ים המלח - קפה בקצה"
const W = 430, H = 932;

const spots = JSON.parse(fs.readFileSync(OUT + 'spots.json'));
const pos = {};
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL' });
await ctx.addInitScript(() => {
  localStorage.setItem('hasSeenAbout', 'true');
  localStorage.setItem('hasSeenTerms', 'true');
});
await ctx.route(/\.supabase\.co\//, r => {
  const u = new URL(r.request().url());
  if (u.pathname.endsWith('/spots')) {
    const id = u.searchParams.get('id');
    const d = id ? spots.filter(s => 'eq.' + s.id === id) : spots;
    return (r.request().headers()['accept'] || '').includes('pgrst.object') ? r.fulfill({ json: d[0] ?? null }) : r.fulfill({ json: d });
  }
  return r.fulfill({ json: [] });
});

const p = await ctx.newPage();
const shot = async (name) => { await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}${name}.png` }); };
const tall = async (name, height) => { await p.setViewportSize({ width: W, height }); await shot(name); await p.setViewportSize({ width: W, height: H }); };
const box = async (name, loc) => { const bb = await loc.boundingBox(); pos[name] = { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }; };

// 1. רשימה
await p.goto(APP + '/'); await p.evaluate(() => localStorage.removeItem('spotFilters')); await p.reload(); await p.waitForTimeout(1500);
await p.getByRole('tab', { name: /רשימה/ }).click();
await shot('s01_list');
await tall('s01_list_tall', 2300);           // הרשימה נגללת בתוך האזור שלה, לכן מגדילים את החלון

// 2. חיפוש - הקלדה הדרגתית
const search = p.getByLabel('חיפוש מקומות');
await box('search', search);
for (const [i, t] of [['a', 'י'], ['b', 'ירו'], ['c', 'ירושלים']]) { await search.fill(t); await shot('s02_search_' + i); }
await search.fill(''); await p.waitForTimeout(400);

// 3. סינון: פתיחה, "טבע", "מתאים לדייט ראשון", סגירה
const filterBtn = p.getByRole('button', { name: 'סינון מורחב' }).first();
await box('filter', filterBtn);
await filterBtn.click(); await shot('s03_filter_open');
const nature = p.getByRole('dialog').getByText('טבע', { exact: true }).first();
await box('nature', nature);
await nature.click(); await shot('s03_filter_nature');
const firstDate = p.getByRole('dialog').getByText('מתאים לדייט ראשון', { exact: true }).first();
await box('firstdate', firstDate);
await firstDate.click(); await shot('s03_filter_both');
await p.keyboard.press('Escape'); await shot('s04_results');

// 4. מפה: מעבר לתצוגת מפה, גלילת הכרטיסים עד המקום, לחיצה עליו (המפה טסה אליו ונפתחת בועה)
const mapTab = p.getByRole('tab', { name: /מפה/ });
await box('maptab', mapTab);
await mapTab.click(); await p.waitForTimeout(300);
// המפה נוצרה כשהייתה מוסתרת (תצוגת רשימה), אז Leaflet לא יודע את הגודל שלה: אירוע resize מסדר את זה,
// ו"רענן מפה" מתאים את התצוגה לתוצאות הסינון
await p.setViewportSize({ width: W, height: H - 1 }); await p.setViewportSize({ width: W, height: H });
await p.getByTitle('רענן מפה בהתאם לחיפוש').click();
await p.waitForTimeout(1500); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500);
await shot('s04_map');
const mapCard = p.locator(`#spot-${SPOT_ID}`);
await mapCard.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
await shot('s04_map_card');
await box('mapcard', mapCard);
await mapCard.click(); await p.waitForTimeout(2000); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500);
await shot('s04_map_popup');
await box('more', p.locator('.leaflet-popup-content button, .leaflet-popup-content a').first());
await p.getByRole('tab', { name: /רשימה/ }).click(); await p.waitForTimeout(500);

// 4. דף מקום. אריחי המפה לא תמיד זמינים בסביבת הרינדור, לכן מסתירים את קופסת המפה
//    בצילום הגלילה (שאר הדף נשאר בדיוק כמו באפליקציה)
const card = p.locator('[id^="spot-"]').first();
await box('card', card);
await card.click(); await p.waitForTimeout(1500);
await shot('s05_spot');
await p.goto(`${APP}/spot/${SPOT_ID}`); await p.waitForTimeout(1500);
await p.locator('.leaflet-container').first().evaluate(el => { el.parentElement.style.display = 'none'; });
await tall('s05_spot_spliced', 1900);

// 5. הוספת מקום
await p.goto(APP + '/'); await p.waitForTimeout(1200);
await p.getByRole('tab', { name: /רשימה/ }).click(); await p.waitForTimeout(300);
const add = p.getByRole('button', { name: 'הוסף מקום' }).first();
await box('add', add);
await add.click(); await p.waitForTimeout(1200);
await shot('s06_add');
await p.getByLabel('שם המקום').fill('תצפית שקיעה בחוף הים');
await p.getByLabel('כתובת', { exact: true }).fill('טיילת, תל אביב');
await shot('s06_add_filled');

await p.evaluate(() => localStorage.removeItem('spotFilters'));
fs.writeFileSync(OUT + 'pos.json', JSON.stringify(pos, null, 1));
console.log('captured; tap positions:', JSON.stringify(pos));
await b.close();
