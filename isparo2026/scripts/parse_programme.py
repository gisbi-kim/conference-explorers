"""Extract the supplied preliminary PDF in its logical text order (PyMuPDF)."""
from pathlib import Path
import re, json, hashlib, collections
import fitz

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'source/programme.pdf'
doc = fitz.open(source)
lines = []
for page_no in range(9, 30):
    for line in doc[page_no].get_text().splitlines():
        line = line.strip()
        if line and line != 'Technical Sessions' and not re.fullmatch(r'Page \d+ of 22|07\. Okt\. 26|Printed on', line):
            lines.append((line, page_no + 1))

def join(parts):
    return re.sub(r'-\s+(?=[a-zA-Z])', '-', ' '.join(parts)).strip()

sessions, talks = [], []
i = 0
while i < len(lines):
    value, page = lines[i]
    if re.fullmatch(r'TS\d{2}', value):
        sid = value
        i += 1
        title = []
        while not lines[i][0].startswith('Date '):
            title.append(lines[i][0]); i += 1
        date = lines[i][0][5:]
        date = '-'.join(reversed(date.split('.')))
        i += 1
        header = []
        while lines[i][0] != 'SecondChair':
            header.append(lines[i][0]); i += 1
        header_text = ' '.join(header)
        times = re.findall(r'\d{2}:\d{2}', header_text)
        room = re.search(r'Room Room (\S+)', header_text).group(1)
        if not title:
            title = [x for x in header if not re.fullmatch(r'Room Room .*|MainChair|Start:|End:|\d{2}:\d{2}', x)]
        sessions.append(dict(id=sid, title=join(title), date=date, start=times[0], end=times[1], room=room, page=page))
        i += 1
    elif re.fullmatch(r'\d{2}:\d{2}', value):
        start = value; end = lines[i+1][0]; i += 2
        title = []
        while lines[i][0] != 'Speaker:':
            title.append(lines[i][0]); i += 1
        i += 1
        speaker = []
        while not lines[i][0].startswith('Insitution:'):
            speaker.append(lines[i][0]); i += 1
        institution = [lines[i][0].split(':', 1)[1].strip()]; i += 1
        while lines[i][0] not in ['iSpaRo', 'i-SAIRAS']:
            institution.append(lines[i][0]); i += 1
        track = lines[i][0]; i += 1
        talks.append(dict(id=f'{sid}-{sum(t["session"] == sid for t in talks)+1:02}', title=join(title), speaker=join(speaker), institution=join(institution), track=track, session=sid, date=date, room=room, start=start, end=end, page=page))
    else:
        raise ValueError((i, lines[i]))

assert len(sessions) == 38
assert all(s['title'] for s in sessions)
assert len(talks) == sum(p.get_text().count('Speaker:') for p in doc[9:30])
assert all(t['title'] and t['speaker'] and t['institution'] and re.fullmatch(r'\d{2}:\d{2}', t['end']) for t in talks)
workshops = []
for p in [7, 8]:
    text = doc[p].get_text()
    for match in re.finditer(r'(WS\dA/WS\dB):\s*(.*?)Organizers:\s*(.*?)Abstract:\s*(.*?)(?=WS\dA/WS\dB:|\Z)', text, re.S):
        wid, title, organizers, abstract = match.groups()
        number = int(wid[2])
        workshops.append(dict(id=wid,title=join(title.split()),organizers=join(organizers.split()),abstract=join(abstract.split()),date='2026-11-05',start='09:30' if number<4 else '14:30',end='13:00' if number<4 else '17:30',room=['S','T','R'][(number-1)%3],page=p+1))
assert len(workshops) == 6
data = dict(source=dict(filename='i-SAIRAS_iSpaRo_2026_Preliminary_Programme_2026-10-08.pdf',coverDate='2026-10-07',sha256=hashlib.sha256(source.read_bytes()).hexdigest(),pages=len(doc)),sessions=sessions,talks=talks,workshops=workshops)
(ROOT/'data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(talks=len(talks),sessions=len(sessions),tracks=dict(collections.Counter(t['track'] for t in talks)),days=dict(collections.Counter(t['date'] for t in talks))),indent=2))
for s in sessions:
    ts = [t for t in talks if t['session']==s['id']]
    duplicate = [time for time,n in collections.Counter(t['start'] for t in ts).items() if n>1]
    if duplicate: print('Duplicate source times:',s['id'],duplicate)
