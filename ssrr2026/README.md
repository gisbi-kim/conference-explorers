# SSRR 2026 Paper Explorer

Buildless static explorer: 46 unique programme papers, seven sessions, six award finalists, 222 distinct author-name strings. Conference dates: 2–4 November 2026, Incheon, Korea.

## Provenance

`source-programme.txt` is the accepted-papers text supplied by the site owner on 16 October 2026. `data.json` preserves titles, author spellings, session labels and session start times. The official homepage https://www.ssrr-ieee.org/ independently confirms venue and dates. The pasted programme's exact source URL was not supplied; do not present the homepage as independent verification of every paper.

No abstracts, affiliations, submission denominator, acceptance rate, verified paper URLs or historical topic data were supplied. External Scholar/web links are explicitly search links. Award finalists are not award winners. Session start times must not be presented as individual talk times.

## Analysis

All charts derive from the same JSON. Title-only topic regexes are recorded in `data.json`; tags overlap. Comparison denominators are all 46 papers and six finalists; one finalist is 16.7 percentage points. Author counts use exact names, not disambiguated people. Narrative cards cite specific paper IDs and describe title/session evidence, not demonstrated performance or temporal trends.

## Validation and maintenance

Serve the repository with any static HTTP server. Check search, combined filters, author selection, chart drill-down, finalist comparison, pagination, dialogs, bookmarks, filter-link restoration and UTF-8 CSV export. Validate unique IDs, per-session counts (6, 8, 8, 6, 8, 6, 4), topic assignments and author totals whenever updating the source. Update JSON, CSV, snapshot label and main-index counts together. No build step or external JS dependencies are required.
