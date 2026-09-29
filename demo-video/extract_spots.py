"""מחלץ את המקומות מ-import_spots.sql לקובץ JSON שהצילומים משתמשים בו.
שימוש: python3 extract_spots.py <נתיב ל-import_spots.sql> <קובץ פלט>"""
import json, re, sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
cols = [c.strip() for c in re.search(r'INSERT INTO public\.spots \((.*?)\)', s).group(1).split(',')]
body = s[s.index('VALUES') + 6:]
n = len(body)

def parse_tuple(i):
    vals = []; i += 1
    while True:
        while body[i] in ' \n\r\t': i += 1
        if body[i] == "'":                      # מחרוזת, כולל '' כגרש בודד
            j = i + 1; buf = ''
            while True:
                if body[j] == "'" and j + 1 < n and body[j + 1] == "'": buf += "'"; j += 2; continue
                if body[j] == "'": break
                buf += body[j]; j += 1
            i = j + 1; vals.append(buf)
        else:
            tok = re.match(r"[^,)]+", body[i:]).group(0); i += len(tok); tok = tok.strip()
            if tok == 'NULL': vals.append(None)
            elif tok in ('true', 'false'): vals.append(tok == 'true')
            else: vals.append(float(tok) if '.' in tok else int(tok))
        while body[i] in ' \n\r\t': i += 1
        if body[i] == ',': i += 1; continue
        if body[i] == ')': return vals, i + 1

rows = []; i = 0
while i < n:
    if body[i] == '(':
        v, i = parse_tuple(i); rows.append(dict(zip(cols, v)))
    else:
        i += 1
for r in rows:
    r['images'] = r.get('images') or []
json.dump(rows, open(dst, 'w', encoding='utf-8'), ensure_ascii=False)
print(f'{len(rows)} spots -> {dst}')
