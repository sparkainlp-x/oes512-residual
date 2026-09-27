#!/usr/bin/env python3
"""OES-512 complete corrected synthetic residual-block benchmark."""
import json
import time
from dataclasses import dataclass, asdict
import numpy as np

N_CHANNELS = 512
BLOCK_SIZE = 32
N_BLOCKS = N_CHANNELS // BLOCK_SIZE
MODES = ("Stable", "Noisy", "Localized Burst", "Global Shock")

@dataclass(frozen=True)
class Config:
    trials_per_mode: int = 1000
    seed: int = 42
    tau: float = 0.50

def score_block(block):
    values = np.abs(np.asarray(block, dtype=float))
    if values.size == 0:
        raise ValueError("block must not be empty")
    peak = np.max(values)
    rms = np.sqrt(np.mean(values * values))
    mean = np.mean(values)
    return float(0.45 * peak + 0.35 * rms + 0.20 * mean)

def run(config=Config()):
    if config.trials_per_mode <= 0:
        raise ValueError("trials_per_mode must be positive")
    if config.tau < 0:
        raise ValueError("tau must be non-negative")
    rng = np.random.default_rng(config.seed)
    results = []
    for mode in MODES:
        zero_trials = event_trials = total_latched = exact_matches = 0
        for _ in range(config.trials_per_mode):
            injected_block = None
            if mode == "Stable":
                residual = rng.normal(0.00, 0.05, N_CHANNELS)
            elif mode == "Noisy":
                residual = rng.normal(0.25, 0.10, N_CHANNELS)
            elif mode == "Localized Burst":
                residual = rng.normal(0.00, 0.05, N_CHANNELS)
                injected_block = int(rng.integers(N_BLOCKS))
                start = injected_block * BLOCK_SIZE
                residual[start:start + BLOCK_SIZE] += rng.normal(0.80, 0.15, BLOCK_SIZE)
            elif mode == "Global Shock":
                residual = rng.normal(2.00, 0.50, N_CHANNELS)
            else:
                raise ValueError(f"Unknown mode: {mode}")
            latched_blocks = []
            for block_index in range(N_BLOCKS):
                start = block_index * BLOCK_SIZE
                block = residual[start:start + BLOCK_SIZE]
                if score_block(block) >= config.tau:
                    latched_blocks.append(block_index)
            count = len(latched_blocks)
            total_latched += count
            if count == 0:
                zero_trials += 1
            else:
                event_trials += 1
            if mode == "Localized Burst" and count == 1 and latched_blocks[0] == injected_block:
                exact_matches += 1
        trials = config.trials_per_mode
        results.append({
            "regime": mode,
            "trials": trials,
            "zero_block_trial_rate": zero_trials / trials,
            "event_trial_rate": event_trials / trials,
            "mean_latched_blocks": total_latched / trials,
            "exact_injected_match_rate": exact_matches / trials if mode == "Localized Burst" else None,
        })
    return {"config": asdict(config), "results": results}

def main():
    start_time = time.perf_counter()
    result = run()
    result["runtime_seconds"] = time.perf_counter() - start_time
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
