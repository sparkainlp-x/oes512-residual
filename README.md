# oes512-residual

OES-512 = 16 × OES-32 residual blocks. This repository publishes a **reference implementation** of the 16 × 32 block layout and the weighted latch, a **seed-42 SYNTHETIC benchmark**, and a small browser avatar that follows the latch. Operational, field, and medical performance is **not claimed (UNRUN)**.

[![CI](https://github.com/sparkainlp-x/oes512-residual/actions/workflows/ci.yml/badge.svg)](https://github.com/sparkainlp-x/oes512-residual/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Status: research prototype](https://img.shields.io/badge/status-research%20prototype-orange.svg)](#what-it-is-not)
[![Evidence: SYNTHETIC](https://img.shields.io/badge/evidence-SYNTHETIC-blue.svg)](#evidence-tags)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22985532.svg)](https://doi.org/10.5281/zenodo.22985532)

## What it is

- **Block layout:** 512 channels = 16 contiguous blocks of 32 (16 × OES-32).
- **Block score:** S = 0.45·Peak + 0.35·RMS + 0.20·Mean, computed on the absolute residual |x| of each block.
- **Latch:** a block latches if S ≥ τ, default τ = 0.50.
- **Synthetic regimes:** Stable, Noisy, Localized Burst, Global Shock (Gaussian residuals, seed 42, 1,000 trials per regime).
- **Avatar:** [`sparky-oes512.html`](sparky-oes512.html) runs the same score and latch in the browser and maps latched blocks to a face.
- **Educational demo:** [`sparky-oes512-demo.html`](sparky-oes512-demo.html) is a separate bilingual (EN/FR-CA) explainer page with a residual heatmap, missing-data handling, an experimental parity signal, and a "Talk to Sparky" voice/text assistant that runs offline with simple rules. It is **not** the normative reference; see [Sparky OES-512 demo](#sparky-oes-512-demo-educational).

Files:

| File | Purpose |
|---|---|
| [`oes512_complete.py`](oes512_complete.py) | Reference layout, `score_block`, weighted latch, seed-42 synthetic benchmark |
| [`sparky-oes512.html`](sparky-oes512.html) | Self-contained browser avatar (no external scripts, no trackers) |
| [`tests/test_oes512.py`](tests/test_oes512.py) | pytest suite: known vectors, input validation, determinism, seed-42 regression |
| [`sparky-oes512-demo.html`](sparky-oes512-demo.html) | Separate educational demo page (self-contained, no external scripts); not the normative reference |
| [`tests/sparky-demo.test.mjs`](tests/sparky-demo.test.mjs) | Node self-test for the demo's scoring and summary core (`node tests/sparky-demo.test.mjs`) |
| [`tests/sparky-brain.test.mjs`](tests/sparky-brain.test.mjs) | Node self-test for the demo's offline "Talk to Sparky" brain, i18n and no-network checks |
| [`tests/sparky-personality.test.mjs`](tests/sparky-personality.test.mjs) | Node self-test for the demo's personality layer: validation, hard safety rules, numbers unchanged |
| [`tests/sparky-smoke.mjs`](tests/sparky-smoke.mjs) | Headless Chrome smoke test for the demo page (skips if no Chrome/Chromium is installed) |
| [`personalities/sparky-empathetic-beaver.json`](personalities/sparky-empathetic-beaver.json) | Default "Talk to Sparky" personality (empathetic AI beaver, Fredericton Holograms) as a loadable example |
| [`docs/PERSONALITY.md`](docs/PERSONALITY.md) | Personality file format, rules and validation |

## What it is NOT

- **Not** field telemetry, hardware, a certified safety system, or a commercial product.
- **Not** a medical device or clinical protocol, not life-support, not a flight system.
- **Not** a quantum or QPU system, and the avatar is a software loop, not a mind.
- **Not** proof that the latch works on crew, habitat, or any real sensor data.
- The four Gaussian regimes are **far apart**. Perfect synthetic scores show that these regimes are easy to separate, **not** that the method is operational.

## Quickstart

```bash
git clone https://github.com/sparkainlp-x/oes512-residual.git
cd oes512-residual
python3 -m pip install -r requirements.txt
python3 oes512_complete.py          # prints the seed-42 results as JSON
python3 -m pip install -r requirements-dev.txt
python3 -m pytest                   # runs tests/test_oes512.py
```

Requires Python ≥ 3.10 and `numpy>=1.24,<3`. CI runs the tests on Python 3.10, 3.11 and 3.12.

## Results (SYNTHETIC)

Output of `python3 oes512_complete.py` (seed 42, τ = 0.50, 1,000 trials per regime). These numbers are **SYNTHETIC** and are pinned by the regression test.

| Regime | Trials | Zero-block trial rate | Event trial rate | Mean latched blocks | Exact injected-block match rate |
|---|---|---|---|---|---|
| Stable | 1000 | 1.0 | 0.0 | 0.0 | — |
| Noisy | 1000 | 1.0 | 0.0 | 0.0 | — |
| Localized Burst | 1000 | 0.0 | 1.0 | 1.0 | 1.0 |
| Global Shock | 1000 | 0.0 | 1.0 | 16.0 | — |

"—" means the metric does not apply (`null` in the JSON output). Runtime is not reported because it depends on the machine.

## Browser avatar

Open `sparky-oes512.html` directly in a browser (double-click the file, or `xdg-open sparky-oes512.html` / `open sparky-oes512.html`) and press **Start loop**. No server or network access is needed. The browser uses unseeded `Math.random`, so its ticks are illustrative and are not the seed-42 run.

Hosted copy on GitHub Pages: <https://sparkainlp-x.github.io/oes512-residual/sparky-oes512.html>

## Sparky OES-512 demo (educational)

[`sparky-oes512-demo.html`](sparky-oes512-demo.html) is a single-file bilingual page (English / Canadian French) with the Sparky beaver avatar. It is **not a medical device**, uses **SYNTHETIC** or user-supplied non-clinical data only, and every alert needs human review.

- **How to open:** open the file directly in a browser (no server, network access or dependencies), or use the hosted copy: <https://sparkainlp-x.github.io/oes512-residual/sparky-oes512-demo.html>.
- **What it shows:** five synthetic scenarios (baseline, localized anomaly, progressive drift, global shock, missing data) or a loaded 512-value CSV, as a residual heatmap. It also shows per-block scores, a syndrome bit string, a plain-language summary in either language, and a JSON export.
- **Relationship to this repository's reference.** The block formula (0.45·Peak + 0.35·RMS + 0.20·Mean of |residual|) and the default τ = 0.50 match `oes512_complete.py`, but the demo is a separate educational score, not the normative reference:
  - it computes its own residuals (value − reference) against a built-in synthetic reference band, the per-channel mean of 32 seeded baseline frames;
  - it uses its own scenarios instead of the seed-42 benchmark;
  - it leaves missing channels out of the score and shows such blocks in a separate "missing data" state, never as an anomaly.
- **Parity asymmetry (experimental).** A = |mean(r)| / (mean|r| + ε) per block: 0 for symmetric zero-mean residuals, 1 when all residuals share one sign. It is an analogy to physical parity and an exploratory signal, **not validated**. It is shown next to the main score and does not trigger alerts unless you tick its checkbox.
- **Tests:** `node tests/sparky-demo.test.mjs` (Node ≥ 18) loads the page's delimited scoring core and checks the scenarios, missing-data handling, the French summaries, the parity bounds and CSV parsing. `node tests/sparky-brain.test.mjs` checks the "Talk to Sparky" brain in both languages against the core's numbers, and that the page makes no network calls. `node tests/sparky-personality.test.mjs` checks personality validation and that a personality never changes the safety reply, the numbers or the alert facts. `node tests/sparky-smoke.mjs` loads the page in headless Chrome, with and without the Web Speech APIs, asks it questions through the text box and loads personality files through the file input. CI runs all four on Node 20.

### Talk to Sparky (demo v0.4.0+)

The demo page has a **Talk to Sparky / Parler à Sparky** panel. Press the button and ask a question out loud (or hold it while you talk), or type in the text box. Sparky answers in the page language, shows the answer in a conversation log and reads it aloud, and the beaver's mouth moves while it speaks (a static open mouth when the system asks for reduced motion).

- **What you can ask:** "what's the status?", "explain block 6" (also "B06", "bloc six"), "how does the score work?", "what is the syndrome?", "what about missing data?", "what is the parity meter?", "what are the limits?", "show drift" / "show the global shock" (switches the scenario on screen), "speak French", "who are you?", "help". In French: « quel est l'état? », « explique le bloc 6 », « montre le choc global », « parle anglais », « aide »… Medical questions ("Am I sick?") always get the same answer: this is a teaching demo, not a medical device, and a human must review every alert.
- **How it answers:** a small rule-based "brain" in the page (keyword matching, delimited by `BEGIN/END SPARKY BRAIN`). Every number it says comes from the analysis on screen. There is no AI model, no API key and no network call; a documented, disabled hook (`SparkyRemoteBrain`) marks where an optional model-backed brain could be plugged in later.
- **Browser support:** voice input uses the Web Speech API's `SpeechRecognition`. It works best in **Chrome and Edge**; Safari support depends on the version and on dictation settings, and Firefox has no speech recognition. Spoken replies use `speechSynthesis`, which most browsers have, but the available voices depend on the system (a Canadian English or French voice is used when one is installed). **The text box works in every browser.** When opened from a local file, Chrome may ask for microphone permission each time.
- **Offline:** the page, the scoring and Sparky's answers run entirely in the browser with no network access.
- **Privacy:** speech recognition is provided by the browser, not by this page. **In Chrome, your audio may be sent to Google's servers to be transcribed**, and without a connection voice input fails with a message (Edge may likewise use Microsoft's online service, and Safari Apple's). If you do not want your voice to leave your device, type your questions instead; typed questions and all of Sparky's answers stay on your device. Spoken replies use the system's voices; some browsers also offer online voices, and Sparky prefers local ones when available.

### Personality (demo v0.5.0)

By default Sparky speaks as **Sparky, the empathetic AI beaver** for [Fredericton Holograms](https://frederictonholograms.com): warm, patient and honest. It opens with "I hear you." / « Ça se comprend. » when you sound worried or when alerts are on screen, and adds an occasional light beaver catchphrase. Use **Load personality** in the talk panel to load a different `.json` personality (name, brand line, greeting, tone, tu/vous, empathy openers, catchphrases, voice rate/pitch/hints, accent colour), and **Reset to default** to go back. Files are checked strictly (64 KB max, known fields only, text only, https brand links) and are never uploaded. A personality only changes the wording: the medical-safety reply, every number and every alert or missing-data fact stay exactly as the built-in brain says them, and there are no catchphrases on safety or alert replies. See [`docs/PERSONALITY.md`](docs/PERSONALITY.md) and the example [`personalities/sparky-empathetic-beaver.json`](personalities/sparky-empathetic-beaver.json).

## Evidence tags

| Item | Tag |
|---|---|
| OES-512 block layout (16 × 32 channels) | Implemented as a reference in `oes512_complete.py` |
| Weighted latch S = 0.45·Peak + 0.35·RMS + 0.20·MeanAbs, τ = 0.50 | Implemented as a reference in `oes512_complete.py` and `sparky-oes512.html` |
| Seed-42 benchmark (four Gaussian regimes, 1,000 trials each) | **SYNTHETIC** |
| Educational demo `sparky-oes512-demo.html` (scenarios, reference band, parity asymmetry) | **SYNTHETIC**; parity asymmetry experimental, not validated |
| External or third-party results | None; nothing is **REPORTED** |
| Operational, field, flight, or medical performance | **UNRUN** (not claimed) |

Tag definitions (TARGET / SYNTHETIC / REPORTED / UNRUN): [sparkainlp-x/.github](https://github.com/sparkainlp-x/.github#evidence-tags).

## Relationship to ADR-001

The normative per-block residual is defined in [oes32-residual@b77b612](https://github.com/sparkainlp-x/oes32-residual/tree/b77b61254f15778c6ae221843dceac7a8571158e) (ADR-001). This repository now publishes source code and a seed-42 synthetic benchmark for the OES-512 layout and weighted latch; the evidence for it is **SYNTHETIC** only. Anything beyond synthetic data remains **UNRUN**.

- [oes32-residual](https://github.com/sparkainlp-x/oes32-residual): normative OES-32 residual contract and reference implementation
- [oes32_engine](https://github.com/sparkainlp-x/oes32_engine): OES-32 Python Profile A sidecar
- [oes32-hls](https://github.com/sparkainlp-x/oes32-hls): OES-32 C++ HLS Profile A sidecar (synthesis UNRUN)

## Citation

Archived on Zenodo: concept DOI [10.5281/zenodo.22985532](https://doi.org/10.5281/zenodo.22985532) (all versions; resolves to the latest). The v0.5.0 archive, [10.5281/zenodo.23193502](https://doi.org/10.5281/zenodo.23193502), is the one to cite for the current version: it adds uploadable personalities for Talk to Sparky, with the default empathetic AI beaver persona. The v0.4.1 archive, [10.5281/zenodo.23191559](https://doi.org/10.5281/zenodo.23191559), is the one to cite for Talk to Sparky, the offline voice avatar in the demo; it supersedes the v0.4.0 archive, [10.5281/zenodo.23191378](https://doi.org/10.5281/zenodo.23191378), which has the same code but accidentally includes unrelated third-party package files. The v0.3.0 archive, [10.5281/zenodo.23186521](https://doi.org/10.5281/zenodo.23186521), adds the educational Sparky demo. The v0.2.0 archive, [10.5281/zenodo.23002190](https://doi.org/10.5281/zenodo.23002190), is the first one with code; the v0.1.0 archive [10.5281/zenodo.22985533](https://doi.org/10.5281/zenodo.22985533) is the earlier specification-only snapshot.

Citation metadata is in [CITATION.cff](CITATION.cff). For the per-block residual, cite [oes32-residual v0.1.0](https://github.com/sparkainlp-x/oes32-residual/releases/tag/v0.1.0).

## License

This software is available under the GNU Affero General Public License v3.0 only (AGPL-3.0-only); see [LICENSE](LICENSE).

Organizations that want to use it in proprietary products or services without AGPL obligations can contact the author about a commercial license via https://sparkainlpx.xyz.

Versions published before 2026-09-29 were released under the MIT License and remain available under those terms.
