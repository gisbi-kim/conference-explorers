# CoRL 2026 Paper Explorer

Static explorer of the official programme snapshot (2026-10-15).

- 687 unique papers: 21 Oral, 72 Spotlight, 594 Poster only.
- 780 presentations: each paper has a poster, plus 93 selected talks.
- 18 official sessions; dates and times are Austin local.
- Metadata coverage: 687 abstracts, 687 author lists, 480 paper-level canonical institution lists, 543 arXiv links.

`data.json` contains programme fields, public metadata, per-paper sources, institution evidence, transparent title keyword matches, and comparison denominators. `research.json` contains qualitative interpretation with representative primary-source links. Title tags are overlapping lexical retrieval aids, not a semantic census. Historical growth or causal selection advantages are not measured. Author names use source strings; aliases and homonyms may split/merge people. Institution facets are at paper level, never inferred author affiliations. OpenReview access restrictions prevented some enrichment.

Serve this repository with a static HTTP server. No build or external runtime dependencies. Search/filter/bookmark state is browser-local; filter and paper links are URL shareable. CSV export sanitizes formula prefixes. Raw and normalized institution lists differ: the Excel workbook preserves the earlier collection snapshot; canonical facets are in JSON.

Verification: unique IDs, complete programme joins, all 18 session counts, all topic cohort sums, all representative paper IDs; browser checks for Oral, session, author, institution, compound filters, abstract, favourites, CSV download, deep links, mobile layout.

## arXiv title links (2026-10-23)

Titles with a confirmed arXiv match open the paper in a new tab. The existing Read abstract / Details controls still open the paper dialog. The dialog title also links to arXiv.

Existing 500 arXiv pages were checked against their title and author metadata; searches of the remaining programme titles and available external titles added 43 links, for 543/687 papers. Per-paper title, author, source, and reviewed title-variant evidence is in arxiv_matches.json. The 144 unlinked records indicate no sufficiently confident match found, not proof of absence.
