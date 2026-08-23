import { MOCK_AREAS, MOCK_ALERTS, DISEASE_ARCHETYPES, INTERVENTIONS } from '../data/mockRiskData';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// In-browser fallback math for offline/standalone execution
function localLaplaceNoise(scale) {
  if (scale <= 0) return 0;
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

export const riskService = {
  // 1. Fetch area summary
  async getAreas() {
    try {
      const res = await fetch(`${BASE_URL}/areas/risk-summary`);
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch {
      return MOCK_AREAS;
    }
  },

  // 2. Fetch active alerts
  async getActiveAlerts() {
    try {
      const res = await fetch(`${BASE_URL}/alerts/active`);
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch {
      return MOCK_ALERTS;
    }
  },

  // 3. Patch alert status
  async updateAlertStatus(alertId, status, rrtDispatched) {
    try {
      const res = await fetch(`${BASE_URL}/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rrtDispatched }),
      });
      if (!res.ok) throw new Error('Failed to update alert');
      return await res.json();
    } catch {
      return { success: true, alertId, status, rrtDispatched };
    }
  },

  // 4. Run outbreak simulation step
  async runSimulation({ stepIndex = 0, r0 = 2.4, archetype = 'DENGUE', intervention = 'NONE', epicenterWardId = 'area-1' }) {
    try {
      const res = await fetch(`${BASE_URL}/simulation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepIndex, r0, archetype, intervention, epicenterWardId }),
      });
      if (!res.ok) throw new Error('Simulation API error');
      return await res.json();
    } catch {
      // Local fallback calculation
      const selIntervention = INTERVENTIONS[intervention] || INTERVENTIONS.NONE;
      const effectiveRt = Math.max(0.6, r0 * (1 - selIntervention.transmissionReduction));

      const updatedAreas = MOCK_AREAS.map((area) => {
        const isEpicenter = area.id === epicenterWardId;
        const distance = isEpicenter ? 0 : 1;
        const attenuation = Math.pow(0.55, distance);
        const growthFactor = Math.pow(effectiveRt / 1.5, Math.max(0, stepIndex - 1)) * attenuation;

        const baselineMed = area.signals.medicineDemand.baseline;
        const baselineFever = area.signals.feverIndicators.baseline;

        const weeks = ['W28', 'W29', 'W30', 'W31', 'W32', 'W33'];
        const simTimeline = weeks.map((week, idx) => {
          if (idx < stepIndex) {
            return {
              week,
              baseline: baselineMed,
              medicine: Math.round(baselineMed * (0.95 + idx * 0.05)),
              fever: Math.round(baselineFever * (0.95 + idx * 0.04)),
              risk: Math.min(100, Math.round(15 + idx * 4)),
            };
          }
          const surgeStep = idx - stepIndex + 1;
          const med = Math.round(baselineMed * (1 + 0.38 * surgeStep * growthFactor));
          const fever = Math.round(baselineFever * (1 + 0.32 * surgeStep * growthFactor));
          const risk = Math.min(96, Math.round(30 + 16 * surgeStep * (growthFactor / 1.2)));
          return { week, baseline: baselineMed, medicine: med, fever, risk };
        });

        const activePoint = simTimeline[Math.min(stepIndex, simTimeline.length - 1)];

        return {
          ...area,
          riskScore: activePoint.risk,
          riskLevel: activePoint.risk >= 70 ? 'HIGH' : activePoint.risk >= 40 ? 'MEDIUM' : 'LOW',
          timeline: simTimeline,
          effectiveRt: parseFloat(effectiveRt.toFixed(2)),
        };
      });

      return {
        stepIndex,
        archetype: DISEASE_ARCHETYPES[archetype] || DISEASE_ARCHETYPES.DENGUE,
        intervention: selIntervention,
        areas: updatedAreas,
      };
    }
  },

  // 5. Differential Privacy Perturbation
  async applyDifferentialPrivacy({ data = [], epsilon = 1.0, sensitivity = 1.0 }) {
    try {
      const res = await fetch(`${BASE_URL}/privacy/perturb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, epsilon, sensitivity }),
      });
      if (!res.ok) throw new Error('Privacy API error');
      return await res.json();
    } catch {
      const safeEps = Math.max(0.01, parseFloat(epsilon) || 1.0);
      const scale = sensitivity / safeEps;
      const perturbed = data.map((pt) => {
        const rawCount = pt.fever !== undefined ? pt.fever : (pt.value || 0);
        const noise = localLaplaceNoise(scale);
        const noisyCount = Math.max(0, Math.round(rawCount + noise));
        return {
          ...pt,
          rawCount,
          noisyCount,
          noiseApplied: parseFloat(noise.toFixed(2)),
          epsilon: safeEps,
          scale: parseFloat(scale.toFixed(2)),
        };
      });

      return {
        epsilon: safeEps,
        sensitivity,
        scale: parseFloat(scale.toFixed(2)),
        guarantee: `(ε=${safeEps}, δ=0)-Differential Privacy`,
        mathFormula: `Noise ~ Laplace(0, ${sensitivity} / ${safeEps})`,
        data: perturbed,
      };
    }
  },

  // 6. Dispatch Rapid Response Team (RRT)
  async dispatchRRT({ alertId, wardId, wardName, teamComposition, priority = 'CRITICAL' }) {
    try {
      const res = await fetch(`${BASE_URL}/response/dispatch-rrt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, wardId, wardName, teamComposition, priority }),
      });
      if (!res.ok) throw new Error('Dispatch API error');
      return await res.json();
    } catch {
      return {
        success: true,
        dispatch: {
          dispatchId: `RRT-${Date.now().toString().slice(-6)}`,
          alertId,
          wardId,
          wardName,
          priority,
          dispatchedAt: new Date().toISOString(),
          status: 'IN_TRANSIT',
          teamComposition: teamComposition || [
            'Field Epidemiologist',
            'Community Health Officer',
            'Water & Sanitation Inspector',
            '2x ASHA Mobile Workers',
          ],
          allocatedTasks: [
            'Conduct rapid syndromic household survey (50 households)',
            'Collect water samples for residual chlorine and bacterial culture',
            'Audit localized OTC fever/antipyretic sales with retail pharmacies',
          ],
        },
      };
    }
  },

  // 7. Generate Multilingual Public Health Advisory
  async generateAdvisory({ wardName = 'Saheed Nagar', riskLevel = 'HIGH', diseaseType = 'Vector-Borne (Dengue)' }) {
    try {
      const res = await fetch(`${BASE_URL}/response/generate-advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardName, riskLevel, diseaseType }),
      });
      if (!res.ok) throw new Error('Advisory API error');
      return await res.json();
    } catch {
      return {
        generatedAt: new Date().toISOString(),
        wardName,
        riskLevel,
        diseaseType,
        languages: {
          english: {
            title: `Public Health Alert: Elevated ${diseaseType} Anomaly in ${wardName}`,
            body: `MediSentinel early surveillance has detected elevated fever and syndromic indicators in ${wardName}. Residents are advised to eliminate standing water, utilize mosquito repellents, and visit the nearest Urban Primary Health Center (UPHC) if experiencing high fever or body aches.`,
            precautions: [
              'Inspect and empty all indoor/outdoor water containers.',
              'Do not consume self-medicated antibiotics or painkillers without prescription.',
              'Report uncollected waste or waterlogging to BMC Helpline: 1929.',
            ],
          },
          odia: {
            title: `ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା: ${wardName} ରେ ସନ୍ଦିଗ୍ଧ ସଂକ୍ରମଣ ବୃଦ୍ଧି ସୂଚନା`,
            body: `ମେଡିସେଣ୍ଟିନେଲ୍ ସର୍ଭେଲାନ୍ସ ଦ୍ୱାରା ${wardName} ଅଞ୍ଚଳରେ ଜ୍ୱର ଓ ଲକ୍ଷଣ ବୃଦ୍ଧି ଚିହ୍ନଟ ହୋଇଛି। ସମସ୍ତ ନାଗରିକଙ୍କୁ ଜମି ରହିଥିବା ପାଣି ନଷ୍ଟ କରିବାକୁ ଏବଂ ଜ୍ୱର ହେଲେ ନିକଟସ୍ଥ ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ଯିବାକୁ ଅନୁରୋଧ।`,
            precautions: [
              'ଘର ଚାରିପାଖେ ପାଣି ଜମିବାକୁ ଦିଅନ୍ତୁ ନାହିଁ।',
              'ବିନା ଡାକ୍ତରୀ ପରାମର୍ଶରେ ଔଷଧ ସେବନ କରନ୍ତୁ ନାହିଁ।',
              'ଜରୁରୀ ସହାୟତା ପାଇଁ ବିଏମସି ହେଲ୍ପଲାଇନ୍ ୧୯୨୯ କୁ ଫୋନ୍ କରନ୍ତୁ।',
            ],
          },
          hindi: {
            title: `जन स्वास्थ्य चेतावनी: ${wardName} में संक्रमण के बढ़े हुए संकेत`,
            body: `मेडीसेंटिनल सर्विलांस द्वारा ${wardName} में बुखार और संबंधित लक्षणों में वृद्धि दर्ज की गई है। नागरिकों से अपील है कि वे जलजमाव न होने दें और लक्षण दिखने पर नजदीकी प्राथमिक स्वास्थ्य केंद्र पर जांच कराएं।`,
            precautions: [
              'कुलर व गमलों में जमा पानी तुरंत खाली करें।',
              'बिना डॉक्टरी सलाह के दवाइयों का सेवन न करें।',
              'सहायता हेतु हेल्पलाइन 1929 पर संपर्क करें।',
            ],
          },
        },
      };
    }
  },

  // 8. AI Copilot Query
  async queryCopilot({ query, selectedArea, _allAreas, weights }) {
    try {
      const res = await fetch(`${BASE_URL}/copilot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, selectedAreaId: selectedArea?.id, weights }),
      });
      if (!res.ok) throw new Error('Copilot API error');
      return await res.json();
    } catch {
      // Local fallback reasoning
      const areaName = selectedArea?.name || 'Saheed Nagar';
      const riskScore = selectedArea?.riskScore || 87;
      const riskLevel = selectedArea?.riskLevel || 'HIGH';
      const medDev = selectedArea?.signals?.medicineDemand?.deviation || '+62%';
      const feverDev = selectedArea?.signals?.feverIndicators?.deviation || '+48%';

      return {
        query,
        timestamp: new Date().toISOString(),
        intent: 'ROOT_CAUSE_ANALYSIS',
        headline: `Multi-Signal Anomaly Diagnostics for ${areaName}`,
        summary: `Surveillance composite score stands at ${riskScore}/100 (${riskLevel}) driven by pharmacy OTC surges (${medDev}) and syndromic clinic triage signals (${feverDev}) preceding formal clinical confirmations by ~5 days.`,
        leadingIndicators: [
          {
            signal: 'Pharmacy Anti-Infective Surge',
            status: 'PRIMARY_DRIVER',
            evidence: `Aggregated sales rose ${medDev} across ward retail points.`,
          },
          {
            signal: 'Syndromic Fever Index',
            status: 'VALIDATION_CONFIRMED',
            evidence: `Cross-validated with ${feverDev} elevation in outpatient fever logs.`,
          },
        ],
        recommendedSOP: [
          'Dispatch RRT team to initiate spot surveillance.',
          'Issue localized ward advisory.',
        ],
      };
    }
  },
};