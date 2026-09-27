# oes512-residual

OES-512 = 16 × OES-32 residual blocks. This repository publishes a **reference implementation** of the 16 × 32 block layout and the weighted latch, a **seed-42 SYNTHETIC benchmark**, and a small browser avatar that follows the latch. Operational, field, and medical performance is **not claimed (UNRUN)**.

[![CI](https://github.com/sparkainlp-x/oes512-residual/actions/workflows/ci.yml/badge.svg)](https://github.com/sparkainlp-x/oes512-residual/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: research prototype](https://img.shields.io/badge/status-research%20prototype-orange.svg)](#what-it-is-not)
[![Evidence: SYNTHETIC](https://img.shields.io/badge/evidence-SYNTHETIC-blue.svg)](#evidence-tags)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22985532.svg)](https://doi.org/10.5281/zenodo.22985532)

## What it is

- **Block layout:** 512 channels = 16 contiguous blocks of 32 (16 × OES-32).
- **Block score:** S = 0.45·Peak + 0.35·RMS + 0.20·Mean, computed on the absolute residual |x| of each block.
- **Latch:** a block latches if S ≥ τ, default τ = 0.50.
- **Synthetic regimes:** Stable, Noisy, Localized Burst, Global Shock (Gaussian residuals, seed 42, 1,000 trials per regime).
- **Avatar:** [`sparky-oes512.html`](sparky-oes512.html) runs the same score and latch in the browser and maps latched blocks to a face.

Files:

| File | Purpose |
|---|---|
| [`oes512_complete.py`](oes512_complete.py) | Reference layout, `score_block`, weighted latch, seed-42 synthetic benchmark |
| [`sparky-oes512.html`](sparky-oes512.html) | Self-contained browser avatar (no external scripts, no trackers) |
| [`tests/test_oes512.py`](tests/test_oes512.py) | pytest suite: known vectors, input validation, determinism, seed-42 regression |

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

## Evidence tags

| Item | Tag |
|---|---|
| OES-512 block layout (16 × 32 channels) | Implemented as a reference in `oes512_complete.py` |
| Weighted latch S = 0.45·Peak + 0.35·RMS + 0.20·MeanAbs, τ = 0.50 | Implemented as a reference in `oes512_complete.py` and `sparky-oes512.html` |
| Seed-42 benchmark (four Gaussian regimes, 1,000 trials each) | **SYNTHETIC** |
| External or third-party results | None; nothing is **REPORTED** |
| Operational, field, flight, or medical performance | **UNRUN** (not claimed) |

Tag definitions (TARGET / SYNTHETIC / REPORTED / UNRUN): [sparkainlp-x/.github](https://github.com/sparkainlp-x/.github#evidence-tags).

## Relationship to ADR-001

The normative per-block residual is defined in [oes32-residual@b77b612](https://github.com/sparkainlp-x/oes32-residual/tree/b77b61254f15778c6ae221843dceac7a8571158e) (ADR-001). This repository now publishes source code and a seed-42 synthetic benchmark for the OES-512 layout and weighted latch; the evidence for it is **SYNTHETIC** only. Anything beyond synthetic data remains **UNRUN**.

- [oes32-residual](https://github.com/sparkainlp-x/oes32-residual): normative OES-32 residual contract and reference implementation
- [oes32_engine](https://github.com/sparkainlp-x/oes32_engine): OES-32 Python Profile A sidecar
- [oes32-hls](https://github.com/sparkainlp-x/oes32-hls): OES-32 C++ HLS Profile A sidecar (synthesis UNRUN)

## Citation

Archived on Zenodo: concept DOI [10.5281/zenodo.22985532](https://doi.org/10.5281/zenodo.22985532) (all versions; resolves to the latest). The v0.1.0 archive is [10.5281/zenodo.22985533](https://doi.org/10.5281/zenodo.22985533).

Note: the v0.1.0 Zenodo archive is the earlier specification-only snapshot and does not contain the code added here. Citation metadata is in [CITATION.cff](CITATION.cff). For the per-block residual, cite [oes32-residual v0.1.0](https://github.com/sparkainlp-x/oes32-residual/releases/tag/v0.1.0).

## License

MIT, see [LICENSE](LICENSE).
