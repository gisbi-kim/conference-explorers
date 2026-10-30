"""Read-only integrity and independent index checks for the published snapshot."""
import hashlib
import json
import re
from collections import defaultdict
from urllib.parse import urlsplit
from build_data import ROOT, FILES, build, soup, text

data = json.loads((ROOT/'data.json').read_text(encoding='utf-8'))
assert build() == data, 'Committed data differs from deterministic source extraction'
papers = data['papers']
assert len(papers) == len({p['id'] for p in papers}) == len({p['paperId'] for p in papers}) == 614
assert all(p['title'] and p['abstract'] and p['authors'] and p['keywords'] for p in papers)
assert data['counts']['oral'] + data['counts']['poster'] == 614
assert len(data['sessions']) == 76 and data['counts']['paperSessions'] == 57
assert all(p['type'] in ['Oral Session','Poster Session'] for p in papers)
assert len({p['source'] for p in papers}) == 614

manifest = json.loads((ROOT/'source/manifest.json').read_text())
assert {entry['file'] for entry in manifest['files']} == set(FILES)
for entry in manifest['files']:
    raw = (ROOT/'source'/entry['file']).read_bytes()
    assert len(raw) == entry['bytes']
    assert hashlib.sha256(raw).hexdigest() == entry['sha256']

# Check every original deep-link anchor, including all non-paper events.
sources = {name:soup(name) for name in FILES}
for record in papers + data['sessions']:
    url = urlsplit(record['source'])
    assert sources[url.path.split('/')[-1]].find('a',attrs={'name':url.fragment}), record['id']

# Independently reconstruct membership from the official keyword index.
keyword_index = {}
for row in sources['ICCAS2026_KeywordIndexWeb.html'].select('tr'):
    anchor = row.select_one('td > a[name]')
    links = row.select('a[href*="ContentListWeb_"]')
    if anchor and links:
        keyword_index[text(anchor)] = {text(a) for a in links if '.' in text(a)}
parsed_keywords = defaultdict(set)
for paper in papers:
    for keyword in paper['keywords']:
        parsed_keywords[keyword].add(paper['id'])
assert dict(parsed_keywords) == keyword_index, 'Keyword index differs from daily pages'

# Author index continues across rows; session-only chair/organiser references
# must not be treated as paper authorship.
author_index = defaultdict(set)
author_id = None
for row in sources['ICCAS2026_AuthorIndexWeb.html'].select('tr'):
    anchor = row.select_one('a[name]')
    if anchor and re.fullmatch(r'\d+',anchor['name']):
        author_id = anchor['name']
    if author_id:
        for a in row.select('a[href*="ContentListWeb_"]'):
            if re.fullmatch(r'(Tu|We|Th|Fr)[A-Za-z0-9]+\.\d+',text(a)):
                author_index[author_id].add(text(a))
parsed_authors = defaultdict(set)
for paper in papers:
    for author in paper['authors']:
        parsed_authors[author['id']].add(paper['id'])
assert dict(parsed_authors) == dict(author_index), 'Author index differs from daily pages'

# At-a-glance includes empty slots / break blocks without daily detail tables.
glance_refs = {a['href'] for a in sources[FILES[0]].select('a[href]') if re.match(r'ICCAS2026_ContentListWeb_\d.html#',a['href'])}
assert all(s['source'].split('/program/')[1] in glance_refs for s in data['sessions'])
assert all(p['start'] < p['end'] for p in papers)
assert {w['session'] for w in data['warnings']} == {'WeAT1','FrAT8'}

# Local explorer asset links and hub entry (original snapshots are archival).
from bs4 import BeautifulSoup
html = BeautifulSoup((ROOT/'index.html').read_text(encoding='utf-8'),'html.parser')
ids = [node['id'] for node in html.select('[id]')]
assert len(ids) == len(set(ids)), 'Duplicate HTML ids'
for node in html.select('[href],script[src]'):
    link = node.get('href',node.get('src',''))
    parsed = urlsplit(link)
    if parsed.scheme or not parsed.path:
        if link.startswith('#'): assert link[1:] in ids
        continue
    assert (ROOT/parsed.path).exists(), link
hub = BeautifulSoup((ROOT.parent/'index.html').read_text(encoding='utf-8'),'html.parser')
cards = hub.select('.card[data-title][data-date]')
assert len(cards) == 14
assert len(hub.select('a[href="iccas2026/"]')) == 1
assert not any('\ufffd' in p['title']+p['abstract'] for p in papers)
print('PASS: 614 unique papers, 614 abstracts, 57 paper sessions, 19 event blocks')
print(f'PASS: independent keyword index ({len(keyword_index)}) and author index ({len(author_index)}) match every paper membership')
print('PASS: seven source hashes, all 690 record anchors, local asset links and 14-conference hub')
