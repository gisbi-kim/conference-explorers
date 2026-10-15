# CoRL 2026 Paper Explorer

Static explorer of the official programme snapshot (2026-10-15).

- 687 unique papers: 21 Oral, 72 Spotlight, 594 Poster only.
- 780 presentations: each paper has a poster, plus 93 selected talks.
- 18 official sessions; dates and times are Austin local.
- Metadata coverage: 511 abstracts, 511 author lists, 480 paper-level canonical institution lists, 500 arXiv links.

`data.json` contains programme fields, public metadata, per-paper sources, institution evidence, transparent title keyword matches, and comparison denominators. `research.json` contains qualitative interpretation with representative primary-source links. Title tags are overlapping lexical retrieval aids, not a semantic census. Historical growth or causal selection advantages are not measured. Author names use source strings; aliases and homonyms may split/merge people. Institution facets are at paper level, never inferred author affiliations. OpenReview access restrictions prevented some enrichment.

Serve this repository with a static HTTP server. No build or external runtime dependencies. Search/filter/bookmark state is browser-local; filter and paper links are URL shareable. CSV export sanitizes formula prefixes. Raw and normalized institution lists differ: the Excel workbook preserves the earlier collection snapshot; canonical facets are in JSON.

Verification: unique IDs, complete programme joins, all 18 session counts, all topic cohort sums, all representative paper IDs; browser checks for Oral, session, author, institution, compound filters, abstract, favourites, CSV download, deep links, mobile layout.
