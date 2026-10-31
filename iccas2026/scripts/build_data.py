"""Build the ICCAS snapshot from official Papercept HTML; no network by default."""
from pathlib import Path
from collections import Counter
import argparse
import csv
import hashlib
import json
import re
from urllib.request import urlopen
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://ras.papercept.net/conferences/conferences/ICCAS2026/program/'
FILES = ['ICCAS2026_ProgramAtAGlanceWeb.html'] + [f'ICCAS2026_ContentListWeb_{i}.html' for i in range(1, 5)] + ['ICCAS2026_AuthorIndexWeb.html', 'ICCAS2026_KeywordIndexWeb.html']

def text(node):
    return ' '.join(node.get_text(' ', strip=True).split()) if node else ''

def soup(name):
    return BeautifulSoup((ROOT / 'source' / name).read_bytes(), 'html.parser')

def institution_aliases():
    groups = json.loads((ROOT/'institution-aliases.json').read_text(encoding='utf-8'))
    return {label: canonical for canonical, labels in groups.items() for label in labels}

def build():
    aliases = institution_aliases()
    papers, sessions = [], []
    for day in range(1, 5):
        name = f'ICCAS2026_ContentListWeb_{day}.html'
        for table in soup(name).select('table.trk'):
            heads = table.select('tr.sHdr')
            if not heads:
                continue
            code = text(heads[0].select_one('a[name]'))
            cells = heads[0].find_all('td', recursive=False)
            room, start, end = re.fullmatch(r'(.*), (\d\d:\d\d) - (\d\d:\d\d)', text(cells[1])).groups()
            cells = heads[1].find_all('td', recursive=False)
            session = dict(id=code, title=text(cells[0]), type=text(cells[1]), date=f'2026-10-{26+day}', room=room, start=start, end=end, source=BASE+name+'#'+code.lower(), people=[], papers=[])
            for row in table.select('tr:not([data-paper-anchor])'):
                cells = row.find_all('td', recursive=False)
                author = row.select_one('a[href*="AuthorIndexWeb.html#"]')
                if author and len(cells) == 2:
                    session['people'].append(dict(role=text(cells[0]).split(':')[0], name=text(author), affiliation=text(cells[1])))
            for header in table.select('tr.pHdr'):
                anchor = header['data-paper-anchor']
                nodes = table.select(f'tr[data-paper-anchor="{anchor}"]')
                block = BeautifulSoup(''.join(map(str, nodes)), 'html.parser')
                start_p, end_p, slot = re.fullmatch(r'(\d\d:\d\d)-(\d\d:\d\d), Paper (\S+)', text(header.select_one('a'))).groups()
                title = block.select_one('.pTtl a')
                abstract = block.select_one('div[id^="Ab"]')
                abstract_text = text(abstract)
                authors = []
                for row in block.select('tr.author-row'):
                    cells = row.find_all('td', recursive=False)
                    author = cells[0].select_one('a')
                    authors.append(dict(id=author['href'].split('#')[-1], name=text(author), affiliation=text(cells[1])))
                paper = dict(id=slot, paperId=re.search(r"viewAbstract\('(\d+)'\)", title['onclick'])[1], title=text(title), session=code, date=session['date'], start=start_p, end=end_p, room=room, type=session['type'], authors=authors, keywords=[text(a) for a in block.select('a[href*="KeywordIndexWeb.html#"]')], abstract=abstract_text.split('Abstract:', 1)[1].strip() if 'Abstract:' in abstract_text else '', source=BASE+name+'#'+anchor)
                papers.append(paper)
                session['papers'].append(slot)
            sessions.append(session)
    # Preserve source conflicts; do not silently repair duplicate oral time slots.
    warnings = []
    for session in sessions:
        if session['type'] == 'Oral Session':
            counts = Counter((p['start'], p['end']) for p in papers if p['session'] == session['id'])
            for (start, end), count in counts.items():
                if count > 1:
                    warnings.append(dict(session=session['id'], message=f'{count} oral entries share {start}–{end} in the source.'))
    counts = dict(papers=len(papers), oral=sum(p['type']=='Oral Session' for p in papers), poster=sum(p['type']=='Poster Session' for p in papers), paperSessions=sum(bool(s['papers']) for s in sessions), authors=len({a['id'] for p in papers for a in p['authors']}), affiliationLabels=len({a['affiliation'] for p in papers for a in p['authors']}), keywords=len({k for p in papers for k in p['keywords']}), abstracts=sum(bool(p['abstract']) for p in papers))
    counts['institutions'] = len({aliases.get(a['affiliation'], a['affiliation']) for p in papers for a in p['authors']})
    data = dict(institutionAliases=aliases, conference='ICCAS 2026', title='26th International Conference on Control, Automation and Systems', location='Sapporo, Japan', dates=['2026-10-27','2026-10-28','2026-10-29','2026-10-30'], timezone='Asia/Tokyo', sourceUpdated='2026-10-17', snapshotDate='2026-10-31', sourceStatus='Tentative and subject to change', source=BASE+FILES[0], counts=counts, warnings=warnings, sessions=sessions, papers=papers)
    return data

def csv_text(value):
    value = str(value)
    return "'" + value if value.startswith(('=', '+', '-', '@', '\t', '\r')) else value

def write(data):
    (ROOT/'data.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    with (ROOT/'papers.csv').open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f, lineterminator='\n')
        fields = ['id','paperId','title','session','date','start','end','room','type','authors','affiliations','keywords','abstract','source']
        writer.writerow(fields)
        for paper in data['papers']:
            row = dict(paper, authors='; '.join(a['name'] for a in paper['authors']), affiliations='; '.join(dict.fromkeys(data['institutionAliases'].get(a['affiliation'], a['affiliation']) for a in paper['authors'])), keywords='; '.join(paper['keywords']))
            writer.writerow([csv_text(row[k]) for k in fields])
    manifest = dict(snapshotDate=data['snapshotDate'], files=[dict(file=n, url=BASE+n, bytes=(ROOT/'source'/n).stat().st_size, sha256=hashlib.sha256((ROOT/'source'/n).read_bytes()).hexdigest()) for n in FILES])
    (ROOT/'source/manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--fetch', action='store_true', help='Refresh the seven official source pages before rebuilding')
    args = parser.parse_args()
    if args.fetch:
        for name in FILES:
            with urlopen(BASE+name, timeout=60) as response:
                (ROOT/'source'/name).write_bytes(response.read())
    data = build()
    write(data)
    print(json.dumps(data['counts'], indent=2))
    print(json.dumps(data['warnings'], indent=2))
