// scene.js: DateSpots reel. One shape that morphs through the app: question, search, filters, map, place, saved, logo.
(() => {
  'use strict';
  const b = beat;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, c, k) => { const A = hex(a), B = hex(c); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k, 0, 1)))).join(',')})`; };
  const STAR = 'M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z';
  const LEFT = 'M19 12H5M11 5.5L4.5 12l6.5 6.5';
  // in at a (rise), out at z (quick fade). returns {o, y}
  const io = (t, a, z = 1e9, dist = 36) => { const r = rise(t, a, dist); return { o: r.o * (1 - sp(t, z, 28)), y: r.y }; };

  scene('main', 0, DUR, { bg: C.PAPER }, (root) => {
    const CX = W / 2, CY = 910;

    // ---------- end: pink disc that floods the frame behind the logo ----------
    const disc = box(root, CX, CY - 330, 100, 100, { background: C.PINK, borderRadius: '50%' });
    const discR = track(0, [[b(23.15), 34, 9, 1]]);

    const cam = grp(root, CX, CY);
    const world = grp(cam, 0, 0);

    // ---------- the shape (and its soft shadow) ----------
    const shadow = div(world, { background: 'rgba(70,20,40,0.16)', filter: 'blur(34px)' });
    const shape = div(world, { overflow: 'hidden' });
    //                      w    h     r    dy    c(0 white, 1 ink)
    const SH = track([40, 40, 20, 0, 0], [
      [b(4), [820, 150, 75, 0, 0], 16, 0.84],
      [b(6.9), [820, 150, 75, -120, 0], 15, 0.86],
      [b(11.2), [860, 1060, 64, 0, 0], 12, 0.86],
      [b(16.3), [820, 1120, 72, 0, 0], 15, 0.86],
      [b(20), [760, 160, 80, 0, 1], 14, 0.86],
      [b(23), [300, 300, 150, -330, 0], 14, 0.84],
    ]);
    const CT = track(0, [[b(20.15), 1, 26, 1], [b(23), 0, 32, 1]]);
    const content = grp(world, 0, 0);

    // ---------- 1. hook ----------
    const HO = { font: F.D, weight: 900 };
    const hs = fit('איפה יוצאים', HO, 840, 230);
    const l1 = row(content, ['איפה', 'יוצאים'], Object.assign({ size: hs, y: -110, color: C.INK }, HO));
    const l2 = row(content, ['הערב?'], Object.assign({ size: hs, y: 110, color: C.PINK }, HO));
    const hook = [[l1[0].g, 0.15], [l1[1].g, 0.42], [l2[0].g, 0.9]];
    sfx(0.15, 'pop', 0.6); sfx(0.42, 'pop', 0.55); sfx(0.9, 'hit', 0.8);

    // ---------- 2. search pill ----------
    const search = grp(content, 0, 0);
    icon(search, P.search, 335, 0, 58, C.INK);
    const ph = txt(search, 'חפשו עיר או שכונה', { font: F.RUBIK, weight: 400, size: 50, color: C.GREY, x: 285, align: 'r' });
    const Q = 'תל אביב';
    const QO = { font: F.RUBIK, weight: 500, size: 56, color: C.INK };
    const qs = [...Q].map((_, i) => txt(search, Q.slice(0, i + 1), Object.assign({ x: 285, align: 'r' }, QO)));
    const qw = [...Q].map((_, i) => measure(Q.slice(0, i + 1), QO).w);
    const caret = rect(search, 0, -32, 5, 64, { background: C.PINK, borderRadius: '3px' });
    const go = grp(search, -335, 0);
    box(go, 0, 0, 96, 96, { background: C.PINK, borderRadius: '50%' });
    icon(go, LEFT, 0, 0, 48, C.WHITE);
    const T_TYPE = b(5.25), CPS = 16;
    for (let i = 0; i < Q.length; i++) if (Q[i] !== ' ') sfx(T_TYPE + i / CPS, 'key', 0.5);
    sfx(b(4), 'swish', 0.45);

    // ---------- 3. filter chips ----------
    const CHIPS = ['דייט ראשון', 'שקט', 'כשר'];
    const CO = { font: F.RUBIK, weight: 600, size: 46 };
    const cw = CHIPS.map(s => measure(s, CO).w + 88), gap = 22;
    let xr = (cw.reduce((a, c) => a + c, 0) + gap * (CHIPS.length - 1)) / 2;
    const chips = CHIPS.map((s, i) => {
      const cx = xr - cw[i] / 2; xr -= cw[i] + gap;
      const g = grp(content, cx, 70);
      const bg = box(g, 0, 0, cw[i], 104, { borderRadius: '52px', border: `3px solid ${C.INK}`, boxSizing: 'border-box' });
      const tx = txt(g, s, Object.assign({ color: C.INK }, CO));
      const T = b(8.3 + 0.9 * i);
      sfx(T, 'click', 0.8 - i * 0.1);
      return { g, bg, tx, cx, T, a: b(7.1) + i * 0.05 };
    });

    // ---------- 4. map ----------
    const map = grp(content, 0, 0);
    const clip = box(map, 0, 0, 860, 1060, { overflow: 'hidden', borderRadius: '64px' });
    const sv = svgBox(clip, 0, 0, 860, 1060);
    [[60, 120, 330, 300], [470, 60, 330, 250], [60, 560, 260, 420], [380, 470, 440, 200], [520, 740, 300, 280]]
      .forEach(([x, y, w, h]) => svgEl('rect', sv, { x, y, width: w, height: h, rx: 26, fill: C.BLOCK }));
    [['M-20 450 L880 380'], ['M-20 720 L880 690'], ['M420 -20 L360 1080'], ['M-20 140 C 300 200 560 40 880 120'], ['M700 -20 L880 300']]
      .forEach(([d]) => svgEl('path', sv, { d, stroke: C.LINE, 'stroke-width': 26, fill: 'none', 'stroke-linecap': 'round' }));
    const PINS = [[-240, -210], [210, -250], [-40, 40], [250, 140], [-250, 300], [60, 330]];
    const SEL = 2;
    const pins = PINS.map(([x, y], i) => {
      const g = grp(map, x, y);
      const s = svgEl('svg', g, { viewBox: '0 0 160 224', width: 86, height: 120 });
      s.style.cssText = 'position:absolute;left:-43px;top:-120px;overflow:visible';
      svgEl('path', s, { d: 'M80 0C35.5 0 0 35.5 0 80c0 56.5 80 144 80 144s80-87.5 80-144C160 35.5 124.5 0 80 0z', fill: i === SEL ? C.INK : C.PINK });
      svgEl('circle', s, { cx: 80, cy: 80, r: 30, fill: C.WHITE });
      const T = b(12.2) + i * 0.11;
      sfx(T + 0.06, 'pop', 0.5 - i * 0.04);
      return { g, T };
    });
    const tag = grp(map, 0, -440);
    const TO = { font: F.RUBIK, weight: 700, size: 46, color: C.INK };
    const tagW = measure('12 מקומות לדייט', TO).w + 130;
    box(tag, 0, 0, tagW, 100, { background: C.WHITE, borderRadius: '50px', boxShadow: '0 6px 18px rgba(70,20,40,0.12)' });
    box(tag, tagW / 2 - 50, 0, 22, 22, { background: C.PINK, borderRadius: '50%' });
    txt(tag, '12 מקומות לדייט', Object.assign({ x: tagW / 2 - 80, align: 'r' }, TO));
    sfx(b(12.9), 'tick', 0.6);
    sfx(b(16), 'click', 0.9);

    // ---------- 5. place card ----------
    const place = grp(content, 0, 0);
    const img = grp(place, 0, -305);
    box(img, 0, 0, 764, 450, { background: C.PINK, borderRadius: '48px' });
    icon(img, P.moon, 70, 10, 190, C.WHITE);
    icon(img, P.star4, -130, -90, 64, C.WHITE);
    icon(img, P.star4, 230, 110, 44, C.WHITE);
    icon(img, P.star4, -60, 130, 36, C.WHITE);
    const heartBtn = grp(place, -300, -455);
    box(heartBtn, 0, 0, 112, 112, { background: C.WHITE, borderRadius: '50%' });
    const heartSv = icon(heartBtn, P.heart, 0, 3, 62, C.INK);
    const heartPath = heartSv.querySelector('path');
    const title = txt(place, 'בר יין על הגג', { font: F.RUBIK, weight: 700, size: 76, color: C.INK, x: 362, y: 0, align: 'r' });
    const stars = [0, 1, 2, 3, 4].map(i => icon(place, STAR, 336 - i * 58, 100, 50, C.PINK, 1.5, C.PINK));
    const score = txt(place, '4.8', { font: F.RUBIK, weight: 700, size: 50, color: C.INK, x: 70, y: 100, align: 'r', dir: 'ltr' });
    const revs = txt(place, '126 ביקורות', { font: F.RUBIK, weight: 400, size: 44, color: C.GREY, x: -30, y: 102, align: 'r' });
    const loc = txt(place, 'תל אביב, 1.2 ק״מ ממך', { font: F.RUBIK, weight: 400, size: 46, color: C.GREY, x: 362, y: 190, align: 'r' });
    const TAGS = ['רומנטי', 'שקט', 'כשר'];
    const PO = { font: F.RUBIK, weight: 600, size: 42 };
    let tx = 362;
    const ptags = TAGS.map(s => {
      const w = measure(s, PO).w + 70, g = grp(place, tx - w / 2, 300); tx -= w + 18;
      box(g, 0, 0, w, 88, { background: C.PINKSOFT, borderRadius: '44px' });
      txt(g, s, Object.assign({ color: C.PINK }, PO));
      return g;
    });
    const btn = grp(place, 0, 450);
    box(btn, 0, 0, 764, 130, { background: C.INK, borderRadius: '65px' });
    txt(btn, 'הזמינו שולחן', { font: F.RUBIK, weight: 700, size: 54, color: C.WHITE });
    const placeParts = [[img, 0], [heartBtn, 0.08], [title, 0.14], [loc, 0.3], [btn, 0.46]];
    const T_HEART = b(19);
    sfx(T_HEART, 'click', 0.9); sfx(T_HEART + 0.03, 'pop', 0.7);
    const heartK = track(1, [[T_HEART, 1.35, 34, 0.5], [T_HEART + 0.12, 1, 20, 0.6]]);

    // ---------- 6. toast ----------
    const toast = grp(content, 0, 0);
    const TT = { font: F.RUBIK, weight: 700, size: 58, color: C.WHITE };
    const ttW = measure('נשמר לדייט הבא', TT).w, tot = ttW + 96 + 30;
    const ck = grp(toast, tot / 2 - 48, 0);
    box(ck, 0, 0, 96, 96, { background: C.PINK, borderRadius: '50%' });
    icon(ck, P.check, 0, 0, 54, C.WHITE);
    const ttx = txt(toast, 'נשמר לדייט הבא', Object.assign({ x: tot / 2 - 96 - 30, align: 'r' }, TT));
    sfx(b(20.4), 'success', 0.8);

    // ---------- 7. logo + end card ----------
    const logo = grp(content, 0, -330);
    const ls = svgEl('svg', logo, { viewBox: '0 0 512 512', width: 300, height: 300 });
    ls.style.cssText = 'position:absolute;left:-150px;top:-150px;overflow:visible';
    svgEl('path', ls, { d: 'M372 164C354.5 164 338.5 171 326 183.5C313.5 171 297.5 164 280 164C244.5 164 216 192.5 216 228C216 272.5 259.5 308.5 326 368C392.5 308.5 436 272.5 436 228C436 192.5 407.5 164 372 164Z', fill: C.PINK });
    svgEl('path', ls, { d: 'M186 144C141.5 144 106 179.5 106 224C106 280.5 186 368 186 368C186 368 266 280.5 266 224C266 179.5 230.5 144 186 144ZM186 254C169.5 254 156 240.5 156 224C156 207.5 169.5 194 186 194C202.5 194 216 207.5 216 224C216 240.5 202.5 254 186 254Z', fill: C.PINK });
    const NO = { font: F.LAT, weight: 900, dir: 'ltr', color: C.WHITE };
    const ns = fit('DateSpots', NO, 740, 200);
    const name = txt(content, 'DateSpots', Object.assign({ size: ns, y: -85 }, NO));
    const nameFrom = Math.min(1.25, (W - 40) / (measure('DateSpots', Object.assign({ size: ns }, NO)).w * 1.04));
    const EO = { font: F.D, weight: 900, color: C.WHITE };
    const es = Math.min(fit('המקום המושלם', EO, 760, 120), fit('לדייט הבא שלכם', EO, 760, 120));
    const e1 = row(content, ['המקום', 'המושלם'], Object.assign({ size: es, y: 85 }, EO));
    const e2 = row(content, ['לדייט', 'הבא', 'שלכם'], Object.assign({ size: es, y: 85 + es * 1.22 }, EO));
    const endWords = [...e1, ...e2].map((w, i) => [w.g, b(25) + i * 0.06]);
    const url = grp(content, 0, 420);
    const UO = { font: F.RUBIK, weight: 700, size: 58, color: C.INK, dir: 'ltr' };
    box(url, 0, 0, measure('datespots.vercel.app', UO).w + 100, 116, { background: C.WHITE, borderRadius: '58px' });
    txt(url, 'datespots.vercel.app', UO);
    sfx(b(23), 'sub', 0.55); sfx(b(23.4), 'sparkle', 0.7); sfx(b(24), 'impact', 0.8); sfx(b(25), 'pop', 0.5); sfx(b(26), 'tick', 0.6);

    // ---------- cursor ----------
    const curLayer = grp(root, 0, 0);
    const cur = cursor(curLayer, 84, C.INK, C.WHITE);
    const chipAim = i => [chips[i].cx + 12, 84];
    const CUR = track([260, 900], [
      [b(4.2), [150, 12], 11, 0.9],
      [b(7.4), chipAim(0), 13, 0.88],
      [b(8.6), chipAim(1), 13, 0.88],
      [b(9.5), chipAim(2), 13, 0.88],
      [b(10.6), [300, 420], 10, 0.95],
      [b(14.2), [PINS[SEL][0] + 8, PINS[SEL][1] - 70], 9, 0.95],
      [b(17.9), [-292, -445], 11, 0.9],
      [b(19.6), [340, 900], 9, 1],
    ]);
    const presses = [b(5), ...chips.map(c => c.T), b(16), T_HEART];
    const press = t => presses.reduce((s, T) => s * (t < T - 0.09 || t > T + 0.4 ? 1 : 1 - 0.14 * (sp(t, T - 0.09, 38) - sp(t, T + 0.05, 30))), 1);
    sfx(b(5), 'click', 0.9);
    const camK = track([1, 0], [[b(14.6), [1.06, -30], 7, 0.95], [b(16.6), [1, 0], 9, 0.95]]);

    return t => {
      // camera: slow push the whole time, a small lean in on the pin tap
      const [ck_, cy_] = camK(t);
      const cs = ck_ * (1 + 0.05 * t / DUR);
      tf(cam, { y: cy_, s: cs });

      // pink flood
      const dr = discR(t);
      tf(disc, { s: dr, o: dr > 0.01 ? 1 : 0 });

      // shape
      const [w, h, r, dy] = SH(t), c = CT(t);
      const so = sp(t, b(4) - 0.04, 30);
      const st = { left: -w / 2 + 'px', top: dy - h / 2 + 'px', width: w + 'px', height: h + 'px', borderRadius: Math.max(0, r) + 'px' };
      Object.assign(shape.style, st, { background: mix(C.WHITE, C.INK, c) });
      Object.assign(shadow.style, st, { top: dy - h / 2 + 22 + 'px' });
      tf(shape, { o: so }); tf(shadow, { o: so * (1 - 0.6 * c) * (1 - sp(t, b(23), 14)) });

      // hook
      const hOut = sp(t, b(4), 22);
      hook.forEach(([g, a]) => { const k = io(t, a, b(4) - 0.02, 50); tf(g, { o: k.o, y: k.y + hOut * (g === l2[0].g ? -60 : 60), s: (1 - 0.25 * hOut) * (1 + 0.08 * seg(t, 0.9, 2)) }); });

      // search
      const sOn = io(t, b(4.4), b(11.2) - 0.06, 14);
      tf(search, { o: sOn.o, y: dy + sOn.y });
      tf(ph, { o: 0 });
      const n = typed(t, T_TYPE, Q.length, CPS);
      qs.forEach((q, i) => on(q, t >= T_TYPE && i === n - 1));
      const cx = 285 - (t >= T_TYPE ? qw[n - 1] : 0) - 12;
      tf(caret, { x: cx, o: t >= b(5) && t < b(6.9) && Math.floor(t * 3) % 2 === 0 ? 1 : 0 });
      const gk = sp(t, b(6.3), 26, 0.6);
      tf(go, { s: 0.4 + 0.6 * gk, o: clamp(gk * 3, 0, 1) });

      // chips
      chips.forEach(ch => {
        const k = io(t, ch.a, b(11.2) - 0.05, 30);
        const f = sp(t, ch.T, 30, 0.9);
        const pop = 1 + 0.08 * (sp(t, ch.T, 36, 0.5) - sp(t, ch.T + 0.1, 24, 0.7));
        tf(ch.g, { y: k.y, o: k.o, s: pop });
        ch.bg.style.background = mix(C.WHITE, C.PINK, f);
        ch.bg.style.borderColor = mix(C.INK, C.PINK, f);
        ch.tx.inner.style.color = mix(C.INK, C.WHITE, f);
      });

      // map
      const mOn = vis(t, b(11.7), b(16.3), 18, 30);
      tf(map, { o: mOn, blur: 8 * (1 - clamp(mOn * 1.4, 0, 1)) });
      pins.forEach((p, i) => {
        const d = sp(t, p.T, 26, 0.62);
        const sel = i === SEL ? 0.3 * sp(t, b(16), 34, 0.55) : 0;
        const fade = i === SEL ? 1 : 1 - sp(t, b(16), 26);
        tf(p.g, { y: -110 * (1 - d), o: clamp((t - p.T) / 0.06, 0, 1) * fade, s: 1 + sel });
      });
      const tg = io(t, b(12.9), 1e9, 30);
      tf(tag, { y: tg.y, o: tg.o });

      // place card
      const pOut = b(20) - 0.04;
      placeParts.forEach(([g, d]) => { const k = io(t, b(16.6) + d, pOut, 30); tf(g, { y: k.y, o: k.o, blur: 6 * (1 - k.o) }); });
      stars.forEach((s_, i) => { const a = b(16.6) + 0.2 + i * 0.045; const k = sp(t, a, 30, 0.55); tf(s_, { o: clamp((t - a) / 0.06, 0, 1) * (1 - sp(t, pOut, 28)), s: 0.5 + 0.5 * k }); });
      [score, revs].forEach(g => { const k = io(t, b(16.6) + 0.44, pOut, 20); tf(g, { y: k.y, o: k.o }); });
      ptags.forEach((g, i) => { const k = io(t, b(16.6) + 0.36 + i * 0.05, pOut, 26); tf(g, { y: k.y, o: k.o }); });
      const hf = sp(t, T_HEART, 34, 0.9);
      heartPath.setAttribute('fill', hf > 0.02 ? mix(C.WHITE, C.PINK, hf) : 'none');
      heartPath.setAttribute('stroke', mix(C.INK, C.PINK, hf));
      tf(heartSv, { s: heartK(t) });

      // toast
      const tk = io(t, b(20.4), b(23) - 0.04, 20);
      tf(toast, { o: tk.o, y: tk.y - 18 * seg(t, b(20.4), b(23)), s: 1 + 0.08 * seg(t, b(20.4), b(23)) });
      tf(ck, { s: 0.4 + 0.6 * sp(t, b(20.4), 30, 0.55), o: tk.o });

      // logo + end
      const lk = sp(t, b(23.4), 24, 0.6);
      tf(logo, { s: 0.55 + 0.45 * lk, o: clamp((t - b(23.4)) / 0.08, 0, 1) });
      const sl = slam(t, b(24), nameFrom);
      tf(name, { s: sl.s, o: sl.o });
      endWords.forEach(([g, a]) => { const k = rise(t, a, 40); tf(g, { y: k.y, o: k.o }); });
      const uk = io(t, b(26), 1e9, 30);
      tf(url, { y: uk.y, o: uk.o });

      // cursor (world coords through the camera)
      const [wx, wy] = CUR(t);
      const hidden = t > b(5.12) && t < b(7.3);
      const co = vis(t, b(4.6), b(19.9), 20, 16) * (hidden ? 0 : 1);
      tf(cur, { x: CX + cs * wx, y: CY + cy_ + cs * wy, s: press(t), o: co });
    };
  });
})();
