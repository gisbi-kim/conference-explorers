"""Check extracted rows against the PDF independently, plus static asset links."""
from pathlib import Path
from collections import Counter
import hashlib, json, re
import fitz
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'data.json').read_text(encoding='utf-8'))
doc=fitz.open(ROOT/'source/programme.pdf')
norm=lambda s:re.sub(r'\s+','',s)
assert data['source']['sha256']==hashlib.sha256((ROOT/'source/programme.pdf').read_bytes()).hexdigest()
assert len({t['id'] for t in data['talks']})==224
assert {s['id'] for s in data['sessions']}=={f'TS{i:02}' for i in range(1,39)}
assert Counter(t['track'] for t in data['talks'])=={'iSpaRo':98,'i-SAIRAS':126}
for page in range(10,31):
    source=doc[page-1].get_text()
    records=[t for t in data['talks'] if t['page']==page]
    assert len(records)==source.count('Speaker:'),(page,len(records))
    for t in records:
        for field in ['title','speaker','institution']:
            assert norm(t[field]) in norm(source),(t['id'],field)
for s in data['sessions']:
    assert norm(s['title']) in norm(doc[s['page']-1].get_text()),s['id']
for w in data['workshops']:
    for field in ['title','organizers','abstract']:
        assert norm(w[field]) in norm(doc[w['page']-1].get_text()),(w['id'],field)
assert len(data['workshops'])==6
for html in [ROOT/'index.html', ROOT.parent/'index.html']:
    for link in re.findall(r'(?:href|src)="([^"]+)"',html.read_text(encoding='utf-8')):
        if link.startswith(('http','#','mailto:')):continue
        target=link.split('#')[0].split('?')[0]
        assert (html.parent/target).exists(),(html,link)
print('PASS: 224 source-checked presentations, 38 sessions, 6 workshops, source hash and local links.')
