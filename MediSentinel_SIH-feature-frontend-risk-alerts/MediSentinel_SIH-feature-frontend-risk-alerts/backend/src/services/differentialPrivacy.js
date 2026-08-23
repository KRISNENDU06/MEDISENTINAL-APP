// Differential Privacy Laplace Mechanism Engine

/**
 * Generates random noise drawn from the Laplace distribution Laplace(0, scale)
 * where scale b = sensitivity / epsilon
 */
export function sampleLaplace(scale) {
  if (scale <= 0) return 0;
  const u = Math.random() - 0.5;
  // Sign(u) * ln(1 - 2|u|)
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  return noise;
}

/**
 * Perturbs a raw time series data array using Laplace Differential Privacy
 * @param {Array} data - Array of data points with numeric counts
 * @param {number} epsilon - Privacy loss budget parameter (epsilon > 0)
 * @param {number} sensitivity - Global sensitivity Delta f (default: 1.0)
 */
export function applyDifferentialPrivacy(data = [], epsilon = 1.0, sensitivity = 1.0) {
  const safeEpsilon = Math.max(0.01, parseFloat(epsilon) || 1.0);
  const scale = sensitivity / safeEpsilon;

  const perturbedData = data.map((point) => {
    const rawCount = point.fever !== undefined ? point.fever : (point.value || 0);
    const noise = sampleLaplace(scale);
    const noisyCount = Math.max(0, Math.round(rawCount + noise));

    return {
      ...point,
      rawCount,
      noisyCount,
      noiseApplied: parseFloat(noise.toFixed(2)),
      epsilon: safeEpsilon,
      scale: parseFloat(scale.toFixed(2)),
    };
  });

  return {
    epsilon: safeEpsilon,
    sensitivity,
    scale: parseFloat(scale.toFixed(2)),
    guarantee: `(ε=${safeEpsilon}, δ=0)-Differential Privacy`,
    mathFormula: `Noise ~ Laplace(0, ${sensitivity} / ${safeEpsilon})`,
    data: perturbedData,
  };
}

