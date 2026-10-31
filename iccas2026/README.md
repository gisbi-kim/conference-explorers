# ICCAS 2026 Paper & Programme Explorer

Live: https://gisbi-kim.github.io/conference-explorers/iccas2026/

An independent, static research explorer for the 26th International Conference on Control, Automation and Systems, 27–30 October 2026, Sapporo, Japan. It uses the [official Papercept programme](https://ras.papercept.net/conferences/conferences/ICCAS2026/program/ICCAS2026_ProgramAtAGlanceWeb.html) and its four daily pages, author index and keyword index.

## Snapshot and scope

Retrieved **31 October 2026**. All seven pages say **last updated 17 October 2026** and **tentative and subject to change**. The snapshot contains:

| Item | Count |
|---|---:|
| Unique programme paper records / internal paper IDs | 614 |
| Abstracts | 614 |
| Oral papers / sessions | 269 / 50 |
| Poster papers / sessions | 345 / 7 |
| Author identifiers with paper authorship | 1,584 |
| Exact affiliation labels | 489 |
| Official keywords | 22 |
| Other programme blocks | 19 |

The 19 event blocks include five tutorials, one workshop, three plenary blocks, three paired keynote blocks, three frontiers sessions, one competition, reception, banquet and closing ceremony. Empty overview slots and unnamed breaks without detailed tables are excluded.

Programme counts do not establish acceptance rates, actual attendance or award outcomes. All titles and abstracts retain the original wording (including `(I)` suffixes). HTML entities are decoded and whitespace is collapsed; author names are not merged. Reviewed institution variants are merged using the explicit `institution-aliases.json` allowlist; unreviewed and joint affiliations remain separate. Original author affiliations are preserved in JSON and paper details. Authors are grouped by the official author-index identifiers, and chairs/organisers are excluded from authorship counts. Affiliation charts count each distinct paper once per normalized institution, not each coauthor. Keywords overlap, with 614 as the percentage denominator.

All displayed times are JST (UTC+9). `WeAT1` and `FrAT8` each have two oral papers in the same 10:15–10:30 source slot; the explorer preserves and flags these. Some tutorial and competition titles contain times shorter than their allocated session slot; both title and slot are retained.

## Features

- English / Korean interface; original research titles and abstracts stay in their source language.
- Search all fields, titles only or abstracts only; whitespace-separated terms use AND, quoted phrases stay together.
- Date, format, official keyword, session, affiliation, room and exact-author filters.
- Fifteen-result pagination, title/programme sorting, accessible paper detail dialog.
- Click-through keyword, date, format and institution charts; searchable author directory.
- Session and event cards with source deep links and chair/organiser details.
- Browser-local saved papers and light/dark preference, filter/paper share links, UTF-8 CSV and JSON downloads.
- No runtime framework, CDN, external font or analytics. Serve from any static web server; local JSON fetch requires HTTP, not `file://`.

## Files and maintenance

- `index.html`, `style.css`, `app.js`: responsive frontend.
- `data.json`, `papers.csv`: generated data exports.
- `source/`: seven unmodified HTML snapshots and SHA-256 `manifest.json`. These are archival parsing inputs, not a mirrored site with all original JS/images.
- `scripts/build_data.py`: deterministic extraction, optional explicit network refresh.
- `scripts/validate.py`: read-only validation against independent author/keyword indices, hashes, anchors, counts and local links.

From the repository root (Python 3 with `beautifulsoup4` installed):

```sh
python iccas2026/scripts/build_data.py
python iccas2026/scripts/validate.py
node --check iccas2026/app.js
node iccas2026/scripts/validate_institutions.cjs
python -m http.server 8766 --bind 127.0.0.1
```

Open `http://127.0.0.1:8766/iccas2026/`. Validation never rewrites files. To intentionally refresh sources, run `python iccas2026/scripts/build_data.py --fetch`, then update snapshot/source dates, count assertions, UI count copy, this README and the hub card from the newly verified result before publishing. The original snapshot dates are explicit, not automatically replaced by the machine's current date.

Before publication, verify search (including abstract-only and quoted phrases), intersecting filters, session/keyword drill-downs, author identity, saved-only persistence, CSV export, shared links, modal keyboard close, both languages, dark mode, mobile layout, and the hub's chronological/alphabetical sorting. Recheck the deployed files against the committed bytes.

## Privacy and limitations

Only public programme metadata is included. The saved list and display preferences remain in local storage; shared links carry current filters (and optionally a paper ID) but not the saved list. If storage is unavailable, bookmarks work only for the current visit and the UI reports that limitation. CSV values are escaped and formula-like leading characters are neutralized. Source text is escaped before rendering in the frontend. Paper PDFs, code repositories and acceptance statistics are not inferred.

## Version history

| Version | Change |
|---|---|
| 2026-10-31 initial snapshot | Added the seven-page official source corpus, verified 614-paper dataset, bilingual explorer and hub entry. |

Institution normalization: KAIST, DGIST, GIST, POSTECH, UNIST, ETRI, KETI and KITECH aliases share the same chart/filter/search mapping. Old shared affiliation links are normalized on load. The source label `Korea Institute of Science and Technology (KAIST)` follows its explicit KAIST acronym; the original inconsistent wording remains visible. KIST without the KAIST acronym is not merged into KAIST. CSV exports include normalized affiliations.
