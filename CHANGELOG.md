# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- `CITATION.cff` and README list the v0.3.0 version DOI 10.5281/zenodo.23186521.

## [0.3.0] - 2026-10-06

### Added
- `sparky-oes512-demo.html`: a separate, self-contained bilingual (EN / FR-CA) educational demo with the Sparky avatar. It scores synthetic scenarios or a loaded 512-value CSV against a built-in synthetic reference band, shows a separate "missing data" block state, and displays an experimental parity-asymmetry signal (not validated; it does not alert by default). Not the normative reference. **SYNTHETIC**; not a medical device.
- `tests/sparky-demo.test.mjs`: a Node self-test for the demo's scoring and summary core, with a CI job on Node 20.
- README section "Sparky OES-512 demo (educational)" and an evidence-tag row; hosted on GitHub Pages.

### Changed
- `CITATION.cff` and README list the v0.2.0 version DOI 10.5281/zenodo.23002190.
- Relicensed to AGPL-3.0-only with a commercial licensing option (2026-09-29); versions published before then remain available under MIT.
- Founder ORCID iD added to the citation metadata.
- `CITATION.cff` version 0.3.0; `.zenodo.json` description and keywords mention the demo.

## [0.2.0] - 2026-09-27

First archived release that contains code (earlier v0.1.0 was a specification-only snapshot).

### Added
- OES-512 reference latch (16 × 32 residual blocks), seed-42 SYNTHETIC benchmark, tests, CI and the browser avatar on GitHub Pages.
- This changelog.

### Changed
- `.zenodo.json` adds the `spark-ai-nlp` Zenodo community; `CITATION.cff` version 0.2.0.

## [0.1.0] - 2026-09-26

### Added
- OES-512 specification placeholder marked TARGET, README skeleton, `CITATION.cff` (spec only, UNRUN; DOI 10.5281/zenodo.22985533; concept DOI 10.5281/zenodo.22985532).
