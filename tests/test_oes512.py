"""Tests for the OES-512 synthetic reference (oes512_complete.py)."""
import math
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import oes512_complete as oes  # noqa: E402


def test_layout_constants():
    assert oes.N_CHANNELS == 512
    assert oes.BLOCK_SIZE == 32
    assert oes.N_BLOCKS == 16
    assert oes.MODES == ("Stable", "Noisy", "Localized Burst", "Global Shock")


def test_default_config():
    cfg = oes.Config()
    assert cfg.trials_per_mode == 1000
    assert cfg.seed == 42
    assert cfg.tau == 0.50


def test_score_block_zeros():
    assert oes.score_block(np.zeros(32)) == 0.0


def test_score_block_constant():
    # |x| = 1 everywhere -> peak = rms = mean = 1 -> score = 1.0
    assert oes.score_block(np.ones(32)) == pytest.approx(1.0)
    assert oes.score_block(-np.ones(32)) == pytest.approx(1.0)


def test_score_block_known_vector():
    x = [3.0, -4.0]
    peak, rms, mean = 4.0, math.sqrt(12.5), 3.5
    expected = 0.45 * peak + 0.35 * rms + 0.20 * mean
    assert oes.score_block(x) == pytest.approx(expected)


def test_score_block_single_spike():
    x = np.zeros(32)
    x[5] = -2.0
    expected = 0.45 * 2.0 + 0.35 * math.sqrt(4.0 / 32) + 0.20 * (2.0 / 32)
    assert oes.score_block(x) == pytest.approx(expected)


def test_score_block_returns_float():
    assert isinstance(oes.score_block([0.1, 0.2]), float)


@pytest.mark.parametrize("empty", [[], np.array([])])
def test_score_block_empty_raises(empty):
    with pytest.raises(ValueError):
        oes.score_block(empty)


@pytest.mark.parametrize(
    "cfg",
    [
        oes.Config(trials_per_mode=0),
        oes.Config(trials_per_mode=-5),
        oes.Config(tau=-0.1),
    ],
)
def test_invalid_config_raises(cfg):
    with pytest.raises(ValueError):
        oes.run(cfg)


def test_determinism_same_seed():
    cfg = oes.Config(trials_per_mode=50, seed=7)
    assert oes.run(cfg) == oes.run(cfg)


def test_different_seed_runs():
    out = oes.run(oes.Config(trials_per_mode=20, seed=123))
    assert [r["regime"] for r in out["results"]] == list(oes.MODES)


EXPECTED_SEED42 = {
    "Stable": dict(zero=1.0, event=0.0, mean=0.0, match=None),
    "Noisy": dict(zero=1.0, event=0.0, mean=0.0, match=None),
    "Localized Burst": dict(zero=0.0, event=1.0, mean=1.0, match=1.0),
    "Global Shock": dict(zero=0.0, event=1.0, mean=16.0, match=None),
}


def _check_seed42(out, trials):
    assert out["config"] == {"trials_per_mode": trials, "seed": 42, "tau": 0.5}
    assert [r["regime"] for r in out["results"]] == list(oes.MODES)
    for r in out["results"]:
        exp = EXPECTED_SEED42[r["regime"]]
        assert r["trials"] == trials
        assert r["zero_block_trial_rate"] == exp["zero"]
        assert r["event_trial_rate"] == exp["event"]
        assert r["mean_latched_blocks"] == exp["mean"]
        assert r["exact_injected_match_rate"] == exp["match"]


def test_seed42_regression_small():
    _check_seed42(oes.run(oes.Config(trials_per_mode=100)), 100)


def test_seed42_regression_full():
    # Full published run (1000 trials per regime); takes well under a second.
    _check_seed42(oes.run(), 1000)
