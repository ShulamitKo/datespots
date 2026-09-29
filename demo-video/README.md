<div dir="rtl" align="right">

# סרטון ההדגמה

הקוד שמייצר את [`docs/demo.mp4`](../docs/demo.mp4) (עם מוזיקה) ואת [`docs/demo.gif`](../docs/demo.gif) (ל-README).
הסרטון נבנה מצילומי מסך של האפליקציה האמיתית, בלי עריכה ידנית, כך שאפשר לבנות אותו מחדש בכל פעם שהעיצוב משתנה.

## איך זה עובד

| קובץ | תפקיד |
|---|---|
| `extract_spots.py` | מחלץ את המקומות מ-`import_spots.sql` ל-JSON |
| `capture.mjs` | מריץ את האפליקציה בדפדפן (Playwright) בגודל טלפון, מצלם כל שלב (רשימה, חיפוש, סינון, דף מקום, הוספה) ושומר את מיקומי הכפתורים. קריאות ל-Supabase מיורטות, כך שלא צריך מפתחות |
| `demo.html` | האנימציה: עמוד 1920×1080 עם פונקציה `render(t)` שמציירת את הפריים בזמן `t` |
| `render.mjs` | מצלם את `demo.html` פריים אחרי פריים: 30fps ל-MP4, ו-10fps עם רקע סטטי ל-GIF |
| `demo_music.py` | מסנתז את המוזיקה מאפס (numpy): פופ ב-100 BPM, מסונכרן לשלבים ולכל לחיצה. בלי דגימות, בלי זכויות יוצרים |
| `build.sh` | מריץ את הכול ומקודד עם ffmpeg |

## בנייה מחדש

</div>

```bash
npm i -D playwright && npx playwright install chromium
pip install numpy          # ו-ffmpeg מותקן במערכת
bash demo-video/build.sh
```

<div dir="rtl" align="right">

קבצי הביניים (צילומים ופריימים) נכתבים ל-`demo-video/out/`, שלא נשמרת ב-git.

</div>
