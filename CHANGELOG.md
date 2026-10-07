# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Demo page version 0.5.1: three kit personas under `personalities/` — **sparky-patient** (gold, patient guide), **maple-curious** (teal, Maple / Érable), **alder-evidence-guide** (blue-grey, Alder / Aulne, no catchphrases). Same Fredericton Holograms brand, **vous** in French, no minimising language; safety reply and numbers stay locked.
- Synthetic CSV fixtures under `tests/fixtures/csv/` matching the five built-in scenarios (baseline, localized anomaly B06 ≈ 1.85, progressive drift B12–B16, global shock all 16, missing data B11 blanks). SYNTHETIC only; no clinical meaning.
- Personality and smoke tests cover loading all three kit files; personality test also checks the CSV fixtures against the core.

### Changed
- `CITATION.cff` and README list the v0.5.0 version DOI 10.5281/zenodo.23193502.
- `docs/PERSONALITY.md` and README document the three kit personas.
## [0.5.0] - 2026-10-06

Sparky, the empathetic AI beaver: uploadable personalities for Talk to Sparky. The scoring core is unchanged.

### Added
- Demo page version 0.5.0: "Talk to Sparky" personalities. The default persona is **Sparky, the empathetic AI beaver** for Fredericton Holograms, with a brand line linking to https://frederictonholograms.com (new tab, `rel="noopener noreferrer"`). It uses empathy openers ("I hear you." / « Ça se comprend. ») when the person sounds worried or when alerts or missing data are on screen, and occasional light catchphrases (never on safety or alert replies).
- **Load personality** (`.json`) and **Reset to default** controls in the talk panel, with strict validation (64 KB max, known fields only, length limits, text only, https-only brand URL, no minimising phrases), clear EN/FR error messages, and optional persistence in `localStorage` (cleared by Reset). Speech rate, pitch and voice-name hints are applied to `speechSynthesis`. An `aiBrain` block is stored but never used (no network).
- `docs/PERSONALITY.md` (format and rules) and `personalities/sparky-empathetic-beaver.json` (the default persona as a file).
- `tests/sparky-personality.test.mjs`: validation, rejection cases, safety reply identical under every persona, numbers unchanged across scenarios and blocks, empathy and catchphrase rules, no network. Runs in CI. The headless Chrome smoke test now also loads valid and invalid personality files through the file input.

### Changed
- `CITATION.cff` and README list the v0.4.1 version DOI 10.5281/zenodo.23191559.
- `CITATION.cff` version 0.5.0. `.zenodo.json` describes 0.5.0 and still sets no version, so Zenodo takes it from the tag `v0.5.0`.
- Talk to Sparky brain: French "je suis inquiet…" is no longer treated as a medical question. It gets the factual answer with an empathy opener. "Dois-je m'inquiéter?" and other medical questions still get the fixed safety reply.
- The brain test now allows exactly one URL in the page scripts: the default personality's brand link.

### Fixed
- Demo page: empty inline favicon (`data:,`), so browsers no longer log a 404 for `/favicon.ico` on GitHub Pages.

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
