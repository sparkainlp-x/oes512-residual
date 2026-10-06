# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.4.1] - 2026-10-06

Packaging fix: removes 16 third-party package files accidentally included in the v0.4.0 archive; no code or demo changes. The demo page stays at version 0.4.0. This release supersedes v0.4.0.

### Changed
- `CITATION.cff` and README list the v0.4.0 version DOI 10.5281/zenodo.23191378.
- `CITATION.cff` version 0.4.1. `.zenodo.json` no longer sets a version, so Zenodo takes it from the release tag (as for v0.1.0–v0.3.0).
- `.gitignore` also covers `*.tar.gz` and `node_modules/`.

### Removed
- 16 third-party Python package archives (`cffconvert` and its dependencies: 15 `.whl` files and `docopt-0.6.2.tar.gz`, about 2.3 MB) that were committed by mistake at the repository root in the v0.4.0 release commit. They were downloaded while validating `CITATION.cff`; they are not part of the project and nothing uses them. They remain in the v0.4.0 tag and its Zenodo archive, which cannot be changed. `*.whl` is now in `.gitignore`.

## [0.4.0] - 2026-10-06

### Added
- `sparky-oes512-demo.html` demo version 0.4.0 (shown on the page): a "Talk to Sparky / Parler à Sparky" panel. Push-to-talk voice questions via the Web Speech API (en-CA / fr-CA, following the page language), a text box that always works, spoken replies with an animated beaver (reduced-motion aware), a conversation log with an aria-live region, and a stop button. Answers come from an offline rule-based brain (`BEGIN/END SPARKY BRAIN`) that quotes the analysis on screen: status, block explanations, score formula, syndrome, missing data, parity meter, limits, scenario and language switching by voice, help, and a fixed safety answer for medical questions. No network calls; a disabled, documented hook marks where a model-backed brain could be added later. The OES core is unchanged.
- `tests/sparky-brain.test.mjs` (brain intents in EN/FR against the core's numbers, no-network and i18n checks) and `tests/sparky-smoke.mjs` (headless Chrome smoke test, with and without speech APIs); both run in the Node 20 CI job.
- README section "Talk to Sparky" (browser support, offline use, privacy note on browser speech recognition).

### Changed
- `CITATION.cff` and README list the v0.3.0 version DOI 10.5281/zenodo.23186521.
- `CITATION.cff` version 0.4.0; `.zenodo.json` version 0.4.0, description and keywords mention the Talk to Sparky assistant.

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
