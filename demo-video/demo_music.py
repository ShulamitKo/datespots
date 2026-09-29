"""מוזיקה לסרטון ההדגמה: פופ קליל ואופטימי, 100 BPM, דו מז'ור (C-Am-F-G).
מסונכרנת לציר הזמן של demo.html: תיבה = 2.4 שנ', התופים נכנסים ב-4.8,
מצלתיים בתחילת שלב 6 (28.8), אקורד סיום ב-33.6, ו"טיק" עדין בכל לחיצה.
הכול מסונתז מאפס - בלי דגימות ובלי זכויות יוצרים."""
import numpy as np, wave, sys

SR = 44100
BEAT = 0.6
BAR = BEAT * 4
LEN = 38.4
END = 33.6                                        # אקורד הסיום
BARS = 14                                         # תיבות לפני הסיום
total = int(SR * (LEN + 3))
rng = np.random.default_rng(11)
L = np.zeros(total); R = np.zeros(total)          # כלים עם הדהוד
DL = np.zeros(total); DR = np.zeros(total)        # תופים וטיקים (כמעט יבשים)
TAPS = [7.8, 12.6, 14.4, 15.6, 19.2, 21.6, 24.0, 29.4]

def hz(m): return 440 * 2 ** ((m - 69) / 12)
def at(bar, beat=0.0): return bar * BAR + beat * BEAT
def add(sig, start, pan=0.0, dry=False):
    i = int(start * SR); j = min(total, i + len(sig))
    if j <= i: return
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    (DL if dry else L)[i:j] += sig[:j - i] * gl
    (DR if dry else R)[i:j] += sig[:j - i] * gr

def piano(m, vel, dur, bright=1.0):
    ring = min(dur + 1.0, 4.5); t = np.arange(int(ring * SR)) / SR
    f0 = hz(m); s = np.zeros_like(t)
    for n in range(1, 10):
        fn = n * f0 * np.sqrt(1 + 0.0003 * n * n)
        if fn > SR / 2.2: break
        amp = (1 / n ** 1.4) * ((0.55 + 0.7 * vel * bright) ** (n - 1))
        s += amp * np.sin(2 * np.pi * fn * t + rng.uniform(0, 6.28)) * np.exp(-t * (0.7 + 0.5 * n + f0 / 900))
    s *= np.minimum(1, t / 0.004)
    k = int(dur * SR)
    if k < len(t): s[k:] *= np.exp(-(t[k:] - dur) * 8)
    return s * vel * 0.17

def bell(m, vel, dur):
    """מלודיה: פסנתר בהיר + צליל פעמון רך מעליו"""
    t = np.arange(int((dur + .8) * SR)) / SR; f = hz(m)
    b = (np.sin(2*np.pi*f*t) + .35*np.sin(2*np.pi*2*f*t) + .12*np.sin(2*np.pi*3.01*f*t)) * np.exp(-t*4.5) * np.minimum(1, t/.003)
    p = piano(m, vel, dur, 1.2)
    n = max(len(b), len(p)); out = np.zeros(n); out[:len(b)] += b * vel * .05; out[:len(p)] += p
    return out

def noise(d): return rng.standard_normal(int(d * SR))
def hp(x, k=24): return x - np.convolve(x, np.ones(k) / k, 'same')
def lp(x, k=24): return np.convolve(x, np.ones(k) / k, 'same')

CH = {'C': [48, 52, 55, 60], 'Am': [45, 52, 57, 60], 'F': [45, 53, 57, 60], 'G': [47, 50, 55, 59]}
ROOT = {'C': 36, 'Am': 33, 'F': 29, 'G': 31}
PROG = ['C', 'Am', 'F', 'G']
MEL = {  # מוטיב של ארבע תיבות: (midi, פעמה, אורך)
    'C':  [(79,0,.5),(76,.5,.5),(79,1,1),(84,2,1),(83,3,.5),(81,3.5,.5)],
    'Am': [(81,0,1.5),(76,1.5,.5),(81,2,1),(84,3,1)],
    'F':  [(84,0,.5),(81,.5,.5),(77,1,1),(81,2,1),(84,3,.5),(86,3.5,.5)],
    'G':  [(86,0,1.5),(83,1.5,.5),(79,2,2)],
}

for b in range(BARS):
    # שתי התיבות האחרונות תמיד F-G, כדי שהסיום ייפתר לדו מז'ור
    name = PROG[(b if b < BARS - 2 else b + 2) % 4]; ch = CH[name]; root = ROOT[name]
    if b < 2:
        # פתיחה: אקורדים מתמשכים רכים
        for i, m in enumerate(ch):
            add(piano(m, .32, BAR * .95), at(b) + i * .012, pan=-.3 + i * .2)
        if b == 1:  # הקדמה עולה לקראת כניסת התופים
            for k, m in enumerate([55, 60, 64, 67, 72, 76]):
                add(piano(m, .28 + k * .04, .3), at(1, 2 + k * .333), pan=.1)
    else:
        # פסנתר: אקורד בפעמה 1 + "סטאבים" בחלקי הפעמה
        for i, m in enumerate(ch):
            add(piano(m, .34, BEAT * 1.2), at(b) + i * .008, pan=-.3 + i * .2)
        for off in (1.5, 2.5, 3.5):
            for i, m in enumerate(ch[1:]):
                add(piano(m + 12 if i == 2 else m, .22, BEAT * .35), at(b, off), pan=.25)
        # בס בשמיניות
        for k in range(8):
            t = np.arange(int(BEAT * .45 * SR)) / SR; f = hz(root + (12 if k % 4 == 3 else 0))
            s = (np.sin(2*np.pi*f*t) + .25*np.sin(2*np.pi*2*f*t)) * np.exp(-t * 6) * np.minimum(1, t/.004) * .16
            add(s, at(b, k * .5), dry=True)
        # תופים
        for beat in range(4):
            t = np.arange(int(.32 * SR)) / SR; f = 48 + 90 * np.exp(-t * 28)
            add(np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t * 9) * .42, at(b, beat), dry=True)
            if beat in (1, 3):
                c = hp(noise(.2), 16) * np.exp(-np.arange(int(.2*SR))/SR * 24) * .12
                add(c, at(b, beat), pan=.05, dry=True)
            hat_d = .16 if b >= BARS - 2 else .05
            h = hp(noise(hat_d), 4) * np.exp(-np.arange(int(hat_d*SR))/SR * (18 if b >= BARS - 2 else 70)) * .05
            add(h, at(b, beat + .5), pan=-.25, dry=True)
        for k in range(16):  # שייקר שקט
            sh = hp(noise(.04), 3) * np.exp(-np.arange(int(.04*SR))/SR * 90) * (.018 if k % 2 else .01)
            add(sh, at(b, k * .25), pan=.35, dry=True)
    # מלודיה: מתיבה 4 עד הסוף, בשתי התיבות האחרונות עם הכפלת אוקטבה
    if b >= 4:
        for m, beat, d in MEL[name]:
            add(bell(m, .5, d * BEAT), at(b, beat), pan=.12)
            if b >= BARS - 2: add(bell(m + 12, .18, d * BEAT), at(b, beat) + .005, pan=.3)

def crash(start, vol=.12):
    d = 2.2; t = np.arange(int(d * SR)) / SR
    add(hp(noise(d), 3) * np.exp(-t * 2.2) * vol, start, pan=-.1, dry=True)

crash(at(2)); crash(28.8, .1)
# ריזר לפני הסיום
d = BAR * .5; t = np.arange(int(d * SR)) / SR
add(hp(noise(d), 6) * (t / d) ** 2 * .07, END - d, dry=True)

# סיום: אקורד דו מז'ור מלא + בס + מצלתיים, מצלצל עד הסוף
for i, m in enumerate([36, 48, 55, 60, 64, 67, 72, 76]):
    add(piano(m, .5, 4.2), END + i * .03, pan=-.35 + i * .1)
t = np.arange(int(3.5 * SR)) / SR
add(np.sin(2*np.pi*hz(24)*t) * np.exp(-t * 1.2) * .2, END, dry=True)
crash(END, .14)
for k, m in enumerate([84, 88, 91, 96]):  # ניצוץ קטן כשהכתובת מופיעה
    add(bell(m, .3, .5), END + 1.6 + k * .09, pan=.3)

# טיקים של לחיצה
for tp in TAPS:
    t = np.arange(int(.05 * SR)) / SR
    tick = np.sin(2*np.pi*(2200 - 9000*t)*t) * np.exp(-t * 90) * .09
    add(tick, tp, pan=.2, dry=True)

def reverb(x, secs=2.0, wet=.24):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = lp(rng.standard_normal(n), 6) * np.exp(-t * 3.4); ir[:int(.015 * SR)] = 0; ir /= np.sqrt(np.sum(ir ** 2))
    N = 1 << int(np.ceil(np.log2(len(x) + n)))
    return x * (1 - wet) + np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[:len(x)] * wet

mixL = reverb(L) + reverb(DL, 1.0, .08); mixR = reverb(np.roll(R, 29)) + reverb(DR, 1.0, .08)
mix = np.stack([mixL, mixR], 1)[: int(LEN * SR)]
fi = int(.05 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int(2.1 * SR); mix[-fo:] *= (np.linspace(1, 0, fo) ** 1.6)[:, None]
mix = np.tanh(mix * 1.2); mix /= np.max(np.abs(mix)) / .89
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('ok', len(mix) / SR)
