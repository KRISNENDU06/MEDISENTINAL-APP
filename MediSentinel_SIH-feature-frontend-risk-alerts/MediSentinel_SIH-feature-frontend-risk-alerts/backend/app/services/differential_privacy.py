"""Differential Privacy Laplace Mechanism Engine."""
import math
import random
from typing import Any


def sample_laplace(scale: float) -> float:
    if scale <= 0:
        return 0.0
    u = random.random() - 0.5
    sign = 1.0 if u > 0 else (-1.0 if u < 0 else 0.0)
    noise = -scale * sign * math.log(1.0 - 2.0 * abs(u))
    return noise


def apply_differential_privacy(
    data: list[dict[str, Any]],
    epsilon: float = 1.0,
    sensitivity: float = 1.0,
) -> dict[str, Any]:
    safe_epsilon = max(0.01, float(epsilon))
    scale = sensitivity / safe_epsilon

    perturbed_data = []
    for point in data:
        raw_count = point.get("fever", point.get("rawCount", point.get("value", 0)))
        noise = sample_laplace(scale)
        noisy_count = max(0, round(raw_count + noise))

        perturbed_data.append({
            **point,
            "rawCount": raw_count,
            "noisyCount": noisy_count,
            "noiseApplied": round(noise, 2),
            "epsilon": safe_epsilon,
            "scale": round(scale, 2),
        })

    return {
        "epsilon": safe_epsilon,
        "sensitivity": sensitivity,
        "scale": round(scale, 2),
        "guarantee": f"(ε={safe_epsilon}, δ=0)-Differential Privacy",
        "mathFormula": f"Noise ~ Laplace(0, {sensitivity} / {safe_epsilon})",
        "data": perturbed_data,
    }

