// scene.js: DateSpots reel built on real screenshots of the app (shots/*.jpg, captured at 390x844 css, 3x).
// A phone rises in, taps happen on the real screens, the screen zooms to what matters, then the logo end card.
(() => {
  'use strict';
  const SW = 390, SH = 844, K = 1.6;            // phone screen in css px, and its scale on the 1080 canvas
  const PX = W / 2, PY = 470 + SH * K / 2;     // phone centre on the canvas
  const BX = window.SHOT_BOXES;                // tap targets measured in the real app (css px, top left)
  const ctr = k => [BX[k][0] + BX[k][2] / 2 - SW / 2, BX[k][1] + BX[k][3] / 2 - SH / 2];   // centre, relative to screen centre
  const io = (t, a, z = 1e9, dist = 36) => { const r = rise(t, a, dist); return { o: r.o * (1 - sp(t, z, 28)), y: r.y }; };

  scene('main', 0, DUR, { bg: C.PAPER }, (root) => {
    // ---------- end card flood (behind everything) ----------
    const disc = box(root, W / 2, 580, 100, 100, { background: C.PINK, borderRadius: '50%' });
    const T_END = 14.0;
    const discR = track(0, [[T_END + 0.15, 34, 9, 1]]);

    // ---------- hook ----------
    const hookG = grp(root, W / 2, 900);
    const HO = { font: F.D, weight: 900 };
    const hs = fit('איפה יוצאים', HO, 840, 230);
    const l1 = row(hookG, ['איפה', 'יוצאים'], Object.assign({ size: hs, y: -110, color: C.INK }, HO));
    const l2 = row(hookG, ['הערב?'], Object.assign({ size: hs, y: 110, color: C.PINK }, HO));
    const hook = [[l1[0].g, 0.15], [l1[1].g, 0.42], [l2[0].g, 0.9]];
    sfx(0.15, 'pop', 0.6); sfx(0.42, 'pop', 0.55); sfx(0.9, 'hit', 0.8);

    // ---------- captions above the phone ----------
    const CO = { font: F.D, weight: 900, color: C.INK };
    const CAPS = [
      ['כל המקומות לדייט', 2.3, 4.3],
      ['חיפוש מהיר', 4.45, 6.45],
      ['רק מה שמתאים לכם', 6.6, 10.25],
      ['כל הפרטים מראש', 10.4, T_END - 0.1],
    ];
    const cs = Math.min(...CAPS.map(c => fit(c[0], CO, 840, 112)));
    const caps = CAPS.map(([s, a, z]) => ({ g: txt(root, s, Object.assign({ size: cs, x: W / 2, y: 345 }, CO)), a, z }));

    // ---------- phone ----------
    const phone = grp(root, PX, PY);
    const shadow = box(phone, 0, 40, SW * K + 40, SH * K + 40, { background: 'rgba(70,20,40,0.22)', borderRadius: '66px', filter: 'blur(40px)' });
    const body = box(phone, 0, 0, SW * K + 36, SH * K + 36, { background: C.INK, borderRadius: '62px' });
    const screen = box(phone, 0, 0, SW * K, SH * K, { overflow: 'hidden', borderRadius: '46px', background: C.WHITE });
    const inner = grp(screen, SW * K / 2, SH * K / 2);        // zoom group, origin = screen centre
    const img = (name) => {
      const el = document.createElement('img'); el.src = 'shots/' + name + '.jpg';
      Object.assign(el.style, { position: 'absolute', left: -SW * K / 2 + 'px', top: -SH * K / 2 + 'px', width: SW * K + 'px', height: SH * K + 'px' });
      inner.appendChild(el); PRELOAD.push(el.decode().catch(() => console.error('missing shot ' + name))); return el;
    };

    // screens and when each one is on top (a = in, slide = page navigation)
    const T_TAP_SEARCH = 3.9, T_TYPE = 4.25, CPS = 7.5;
    const Q = 'ירושלים';
    const T_TAP_FILTER = 6.6, T_TAP_FIRST = 7.85, T_TAP_CLOSE = 8.95, T_TAP_CARD = 10.15;
    const SCR = [];
    const add = (name, a, slide = 0) => SCR.push({ el: img(name), a, slide });
    add('home', 0);
    for (let i = 1; i <= Q.length; i++) add('search' + i, T_TYPE + (i - 1) / CPS);
    add('filter0', T_TAP_FILTER + 0.12, 1);
    add('filter1', T_TAP_FIRST + 0.06);
    add('results', T_TAP_CLOSE + 0.12, 1);
    add('spot', T_TAP_CARD + 0.14, 1);
    for (let i = 0; i < Q.length; i++) sfx(T_TYPE + i / CPS, 'key', 0.5);

    // taps: a soft ring on the real screen
    const TAPS = [[T_TAP_SEARCH, ctr('search')], [T_TAP_FILTER, ctr('filterBtn')], [T_TAP_FIRST, ctr('firstDate')],
      [T_TAP_CLOSE, ctr('close')], [T_TAP_CARD, ctr('card')]];
    const taps = TAPS.map(([T, [x, y]]) => {
      const g = grp(inner, x * K, y * K);
      const dot = box(g, 0, 0, 78, 78, { background: 'rgba(11,11,11,0.28)', borderRadius: '50%' });
      const ring = box(g, 0, 0, 78, 78, { border: '5px solid rgba(11,11,11,0.45)', borderRadius: '50%', boxSizing: 'border-box' });
      sfx(T, 'click', 0.85);
      return { T, g, dot, ring };
    });

    // zoom inside the screen: [zoom, focus x, focus y] in css px from the screen centre
    const fS = ctr('search'), fN = ctr('notes'), fC = ctr('card'), fF = ctr('firstDate');
    const Z = track([1, 0, 0], [
      [3.5, [1.32, 185, fS[1]], 8, 0.95],
      [6.2, [1, 185, fS[1]], 8, 0.95],
      [7.2, [1.18, 170, fF[1]], 8, 0.95],
      [8.6, [1, 170, fF[1]], 9, 0.95],
      [9.5, [1.22, 185, fC[1]], 8, 0.95],
      [10.2, [1, 185, fC[1]], 10, 0.95],
      [11.1, [1.1, 190, -420], 7, 0.95],
      [12.4, [1.16, 190, -420], 6, 0.97],
    ]);

    // phone in and out
    const PY_ = track(1500, [[1.95, 0, 10, 0.86], [T_END, 1700, 9, 1]]);
    sfx(1.95, 'swish', 0.45);

    // ---------- end card ----------
    const end = grp(root, W / 2, 910);
    const logoBg = box(end, 0, -330, 300, 300, { background: C.WHITE, borderRadius: '50%' });
    const logo = grp(end, 0, -330);
    const ls = svgEl('svg', logo, { viewBox: '0 0 512 512', width: 300, height: 300 });
    ls.style.cssText = 'position:absolute;left:-150px;top:-150px;overflow:visible';
    svgEl('path', ls, { d: 'M372 164C354.5 164 338.5 171 326 183.5C313.5 171 297.5 164 280 164C244.5 164 216 192.5 216 228C216 272.5 259.5 308.5 326 368C392.5 308.5 436 272.5 436 228C436 192.5 407.5 164 372 164Z', fill: C.PINK });
    svgEl('path', ls, { d: 'M186 144C141.5 144 106 179.5 106 224C106 280.5 186 368 186 368C186 368 266 280.5 266 224C266 179.5 230.5 144 186 144ZM186 254C169.5 254 156 240.5 156 224C156 207.5 169.5 194 186 194C202.5 194 216 207.5 216 224C216 240.5 202.5 254 186 254Z', fill: C.PINK });
    const NO = { font: F.LAT, weight: 900, dir: 'ltr', color: C.WHITE };
    const ns = fit('DateSpots', NO, 740, 200);
    const name = txt(end, 'DateSpots', Object.assign({ size: ns, y: -85 }, NO));
    const nameFrom = Math.min(1.25, (W - 40) / (measure('DateSpots', Object.assign({ size: ns }, NO)).w * 1.04));
    const EO = { font: F.D, weight: 900, color: C.WHITE };
    const es = Math.min(fit('המקום המושלם', EO, 760, 120), fit('לדייט הבא שלכם', EO, 760, 120));
    const e1 = row(end, ['המקום', 'המושלם'], Object.assign({ size: es, y: 85 }, EO));
    const e2 = row(end, ['לדייט', 'הבא', 'שלכם'], Object.assign({ size: es, y: 85 + es * 1.22 }, EO));
    const T_LOGO = T_END + 0.35, T_NAME = T_END + 0.85, T_TAG = T_END + 1.35, T_URL = T_END + 1.9;
    const endWords = [...e1, ...e2].map((w, i) => [w.g, T_TAG + i * 0.06]);
    const url = grp(end, 0, 420);
    const UO = { font: F.RUBIK, weight: 700, size: 58, color: C.INK, dir: 'ltr' };
    box(url, 0, 0, measure('datespots.vercel.app', UO).w + 100, 116, { background: C.WHITE, borderRadius: '58px' });
    txt(url, 'datespots.vercel.app', UO);
    sfx(T_END + 0.15, 'sub', 0.55); sfx(T_LOGO, 'sparkle', 0.7); sfx(T_NAME, 'impact', 0.8); sfx(T_TAG, 'pop', 0.5); sfx(T_URL, 'tick', 0.6);

    return t => {
      // hook
      const hOut = sp(t, 1.95, 22);
      hook.forEach(([g, a]) => { const k = io(t, a, 1.93, 50); tf(g, { o: k.o, y: k.y - 260 * hOut }); });
      tf(hookG, { s: (1 - 0.3 * hOut) * (1 + 0.08 * seg(t, 0.9, 2)) });

      // captions
      caps.forEach(c => { const k = io(t, c.a, c.z, 40); tf(c.g, { o: k.o, y: k.y, s: 1 + 0.03 * seg(t, c.a, c.z) }); });

      // phone
      const py = PY_(t);
      tf(phone, { y: py, s: 1 + 0.03 * seg(t, 2, T_END), o: py > 1690 ? 0 : 1 });

      // screens: the latest one whose time has come is on top; page changes slide in
      SCR.forEach((s, i) => {
        const next = SCR[i + 1];
        const onTop = t >= s.a && (!next || t < next.a + (next.slide ? 0.2 : 0));
        if (!onTop) { tf(s.el, { o: 0 }); return; }
        const k = s.slide ? S_(t - s.a) : 1;
        tf(s.el, { o: s.slide ? clamp(k * 1.6, 0, 1) : 1, x: s.slide ? -60 * K * (1 - k) : 0 });
        s.el.style.zIndex = i;
      });

      // zoom
      const [z, fx, fy] = Z(t);
      const zz = z * (1 + 0.02 * Math.sin(t * 0.7));
      tf(inner, { x: fx * K * (1 - zz), y: fy * K * (1 - zz), s: zz });

      // taps
      taps.forEach(tp => {
        const u = t - tp.T;
        if (u < -0.12 || u > 0.55) { tf(tp.g, { o: 0 }); return; }
        const inK = sp(t, tp.T - 0.12, 30);
        tf(tp.dot, { s: 0.7 + 0.3 * inK - 0.15 * sp(t, tp.T, 40, 0.6), o: inK * (1 - seg(t, tp.T + 0.15, tp.T + 0.45)) });
        tf(tp.ring, { s: 1 + 0.9 * E.o3(seg(t, tp.T, tp.T + 0.45)), o: u > 0 ? 1 - seg(t, tp.T, tp.T + 0.45) : 0 });
        tf(tp.g, { o: 1 });
      });

      // end card
      const dr = discR(t);
      tf(disc, { s: dr, o: dr > 0.01 ? 1 : 0 });
      const lk = sp(t, T_LOGO, 24, 0.6);
      const lo = clamp((t - T_LOGO) / 0.08, 0, 1);
      tf(logoBg, { s: 0.55 + 0.45 * lk, o: lo }); tf(logo, { s: 0.55 + 0.45 * sp(t, T_LOGO + 0.08, 24, 0.6), o: lo });
      const sl = slam(t, T_NAME, nameFrom);
      tf(name, { s: sl.s, o: sl.o });
      endWords.forEach(([g, a]) => { const k = rise(t, a, 40); tf(g, { y: k.y, o: k.o }); });
      const uk = io(t, T_URL, 1e9, 30);
      tf(url, { y: uk.y, o: uk.o });
      tf(end, { s: 1 + 0.03 * seg(t, T_END, DUR) });
    };
  });
  // navigation slide spring
  function S_(u) { return S(u, 16, 0.92); }
})();
