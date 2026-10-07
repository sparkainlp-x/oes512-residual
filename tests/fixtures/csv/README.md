# Synthetic CSV fixtures for the Sparky OES-512 educational demo

Each file has exactly 512 comma-separated values (empty cells mean missing).
They are the same values as the five built-in demo scenarios (SYNTHETIC).
They are **not** clinical data and have **no** medical meaning. Human review is required for every alert.

Generated from `OES.scenarioValues` so the expected alerts stay locked to the core.
Comma-separated (not one-per-line) so consecutive missing channels stay as empty cells.

| File | Scenario | Flagged blocks | Missing |
|---|---|---|---|
| baseline.csv | baseline | — | — |
| localized-anomaly.csv | local | B06 | — |
| progressive-drift.csv | drift | B12, B13, B14, B15, B16 | — |
| global-shock.csv | global | B01, B02, B03, B04, B05, B06, B07, B08, B09, B10, B11, B12, B13, B14, B15, B16 | — |
| missing-data.csv | missing | — | B11 |
