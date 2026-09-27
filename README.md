# oes512-residual (placeholder)

Placeholder for OES-512 = 16 × OES-32 residual blocks. The weighted latch is a **TARGET**; no source, runs, or metrics are published here.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: research prototype](https://img.shields.io/badge/status-research%20prototype-orange.svg)](#what-it-is-not)
[![Evidence: TARGET](https://img.shields.io/badge/evidence-TARGET-lightgrey.svg)](#evidence-tags)

## What it is

A public placeholder that records the planned OES-512 layout: 512 channels arranged as 16 blocks of 32 (16 × OES-32), each block evaluated with the normative OES-32 residual, combined by a weighted latch. It exists so that other repositories can link to one stable place for the OES-512 design status.

## What it is NOT

- **Not** published source code, a benchmark, or a result. **Source not published.**
- **Not** hardware, a field product, a medical device or clinical protocol, or a commercial product.
- **Not** a quantum or QPU system.

## Quickstart

**UNRUN.** There is no code to run in this repository. To work with the per-block residual today, use the normative reference:

```bash
git clone https://github.com/sparkainlp-x/oes32-residual.git
cd oes32-residual
python3 -m pip install -r requirements.txt
python3 -m pytest -q
```

(`requirements.txt` in this repository lists `numpy>=1.24` for the future implementation; nothing here uses it yet.)

## Tests

None. Tests will be added together with the source and seed-42 fixtures.

## Evidence tags

| Item | Tag |
|---|---|
| OES-512 block layout (16 × 32 channels) | **TARGET** |
| Weighted latch S = 0.45·Peak + 0.35·RMS + 0.20·MeanAbs, τ = 0.50 | **TARGET** |
| Seed-42 fixtures | **TARGET** (not published) |
| Runs, metrics, performance | **UNRUN** |

Tag definitions: [sparkainlp-x/.github](https://github.com/sparkainlp-x/.github#evidence-tags).

## Relationship to ADR-001

The normative per-block residual is defined in [oes32-residual@b77b612](https://github.com/sparkainlp-x/oes32-residual/tree/b77b61254f15778c6ae221843dceac7a8571158e) (ADR-001). Under ADR-001, the OES-512 weighted latch stays **TARGET** until source code and seed-42 fixtures are published.

- [oes32-residual](https://github.com/sparkainlp-x/oes32-residual): normative OES-32 residual contract and reference implementation
- [oes32_engine](https://github.com/sparkainlp-x/oes32_engine): OES-32 Python Profile A sidecar
- [oes32-hls](https://github.com/sparkainlp-x/oes32-hls): OES-32 C++ HLS Profile A sidecar (synthesis UNRUN)

## Citation

Citation metadata for this specification placeholder is in [CITATION.cff](CITATION.cff); it contains no source code and nothing here has been run (UNRUN). For the per-block residual, cite [oes32-residual v0.1.0](https://github.com/sparkainlp-x/oes32-residual/releases/tag/v0.1.0).

## License

MIT, see [LICENSE](LICENSE).
