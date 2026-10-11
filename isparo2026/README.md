# iSpaRo / i-SAIRAS 2026 Programme Explorer

Static, buildless explorer for the joint preliminary programme in Cologne, 3–5 November 2026. Hosted under the Conference Explorers hub at `isparo2026/`.

## Coverage

- 224 technical presentation rows: 98 iSpaRo and 126 i-SAIRAS.
- 38 technical sessions, 6 workshops with source abstracts, 4 keynotes, 2 panels, opening programme, social events and the 6 November lab tour.
- Search with AND/OR, symposium/day/room/session/institution/theme filters, all matching presentations on one page, CSV export, shareable filter URLs and device-local saved presentations.
- Space-themed dark interface with an original procedural lunar SVG, orbital illustration, horizontal navigation, responsive cards, keyboard controls and links to the exact source PDF pages.

The user-supplied `i-SAIRAS_iSpaRo_2026_Preliminary_Programme_2026-10-08.pdf` is retained unchanged at `source/programme.pdf`. Its cover and printed date are 7 October 2026. `data.json` includes the SHA-256 checksum and PDF page numbers (not internal technical-programme page labels).

The source lists a speaker and affiliation per presentation, not complete author lists. No paper abstracts, acceptance statistics, paper identifiers or PI roles are inferred. Institution charts group exact affiliation strings. Topic tags are explicit title-based regular expressions in `app.js`, not official keywords. Local row IDs are not official paper IDs.

## Source discrepancies

- TS33–TS35 say 14:00–15:30 in the detailed tables, while the overview places them after the 14:00 keynote, starting at 14:30.
- TS33 has repeated 15:00 and 15:15 slots. All six entries are retained.
- Gaps, spelling and truncated institution labels in the source are preserved. Line-wrap whitespace is joined.
- The common poster session is in the overview but has no itemised poster list.

These are a preliminary snapshot, not a final attendance schedule. The UI flags the affected entries and links to the source.

## Files and maintenance

- `index.html`, `style.css`, `app.js`: framework-free interface; no third-party runtime dependencies or remote fonts.
- `data.json`: structured sessions, presentations and workshops.
- `source/programme.pdf`: unchanged source snapshot.
- `scripts/parse_programme.py`: reproducible extraction using PyMuPDF's logical text order; asserts full speaker-row coverage.
- `scripts/validate.py`: independent per-page checks of titles, speakers, institutions, session titles, workshop text, checksums and local links.

From this directory, with Python and PyMuPDF installed:

```text
python scripts/parse_programme.py
python scripts/validate.py
node --check app.js
python -m http.server 8000
```

Open the server URL to preview. The parent hub must be present for the validator's hub-link check. Parse and validate a new preliminary programme before replacing data; the parser is specific to this document format. Keynotes, panels and overview-only events were transcribed from PDF pages 3–6 and 31 into the interface and require a separate review when updating.

Saved presentation IDs stay in browser local storage. Search queries are encoded in the URL for sharing. No analytics, login, server storage or external API is used. CSV export includes only currently filtered technical presentations.

## Version

Initial snapshot: supplied October 2026 preliminary programme. Added to the existing hub as a self-contained subdirectory; existing conference destinations are preserved.

Visual refresh: orbital/planetary hero, dark navy and pale cyan palette, redesigned programme cards and filters. The illustration is decorative, not scientific imagery. All 224 matching rows remain visible without pagination.

Light mode is the default, with a header toggle for the existing dark space theme. The explicit choice is stored locally and applied before first paint; it does not follow the system theme.

The technical-session schedule supports All / i-SAIRAS / iSpaRo within each day. Buttons show daily counts; session cards show counts for the selected symposium and open the matching presentation subset. Changing days preserves the symposium selection.
