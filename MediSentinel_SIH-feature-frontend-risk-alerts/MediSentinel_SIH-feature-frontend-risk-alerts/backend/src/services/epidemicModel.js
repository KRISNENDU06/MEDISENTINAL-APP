// Outbreak Simulation Engine: SEIR & Spatial Transmission Matrix

export const DISEASE_ARCHETYPES = {
  DENGUE: {
    id: 'DENGUE',
    name: 'Vector-Borne (Dengue / Chikungunya)',
    defaultR0: 2.4,
    incubationDays: 5,
    primaryDrugClass: 'Antipyretics / Platelet Enhancers',
    syndromeLabel: 'Acute Febrile & Arthralgia',
    leadTimeDays: 6, // Pharmacy OTC leads hospital reporting by 6 days
    seasonalRisk: 'High (Post-Monsoon)',
  },
  INFLUENZA: {
    id: 'INFLUENZA',
    name: 'Viral Respiratory (Influenza / SARS-like)',
    defaultR0: 3.1,
    incubationDays: 3,
    primaryDrugClass: 'Antivirals & Cough/Cold Formulations',
    syndromeLabel: 'Influenza-Like Illness (ILI)',
    leadTimeDays: 4,
    seasonalRisk: 'Medium (Winter/Transition)',
  },
  CHOLERA: {
    id: 'CHOLERA',
    name: 'Waterborne (Acute Diarrheal / Cholera)',
    defaultR0: 2.8,
    incubationDays: 2,
    primaryDrugClass: 'Oral Rehydration Salts & Anti-diarrheals',
    syndromeLabel: 'Acute Watery Diarrhea (AWD)',
    leadTimeDays: 2,
    seasonalRisk: 'High (Monsoon Inundation)',
  },
  PATHOGEN_X: {
    id: 'PATHOGEN_X',
    name: 'Novel Emerging Pathogen X',
    defaultR0: 3.8,
    incubationDays: 4,
    primaryDrugClass: 'Broad-Spectrum Therapeutics',
    syndromeLabel: 'Atypical Multi-System Anomaly',
    leadTimeDays: 5,
    seasonalRisk: 'Uncertain / Continuous Surveillance',
  },
};

export const INTERVENTIONS = {
  NONE: { id: 'NONE', label: 'No Active Intervention', transmissionReduction: 0 },
  FOGGING: { id: 'FOGGING', label: 'Vector Fumigation & Larvicide', transmissionReduction: 0.35 },
  CONTAINMENT: { id: 'CONTAINMENT', label: 'Micro-Containment & Buffer Cordon', transmissionReduction: 0.65 },
  PROPHYLAXIS: { id: 'PROPHYLAXIS', label: 'Prophylaxis & Targeted Drug Distribution', transmissionReduction: 0.50 },
};

/**
 * Calculates time-stepped simulation metrics for a given area, disease, and intervention.
 */
export function simulateOutbreakStep({
  baseTimeline = [],
  stepIndex = 0,
  r0 = 2.4,
  archetype = 'DENGUE',
  intervention = 'NONE',
  epicenterWardId = 'area-1',
  currentWardId = 'area-1',
  neighborDistance = 0, // 0 = epicenter, 1 = immediate neighbor, 2 = 2nd degree
}) {
  const selectedArchetype = DISEASE_ARCHETYPES[archetype] || DISEASE_ARCHETYPES.DENGUE;
  const selectedIntervention = INTERVENTIONS[intervention] || INTERVENTIONS.NONE;

  // Effective R_t after intervention
  const effectiveRt = Math.max(0.6, r0 * (1 - selectedIntervention.transmissionReduction));
  const spatialAttenuation = Math.pow(0.55, neighborDistance);

  // Progressive surge formula
  const growthFactor = Math.pow(effectiveRt / 1.5, Math.max(0, stepIndex - 1)) * spatialAttenuation;

  const baselineMed = 1000;
  const baselineFever = 280;

  // Calculate synthetic timeline across 6 weeks
  const weeks = ['W28', 'W29', 'W30', 'W31', 'W32', 'W33'];
  const generatedTimeline = weeks.map((week, idx) => {
    if (idx < stepIndex) {
      // Historical/unaffected baseline
      return {
        week,
        baseline: baselineMed,
        medicine: Math.round(baselineMed * (0.95 + idx * 0.05)),
        fever: Math.round(baselineFever * (0.95 + idx * 0.04)),
        risk: Math.min(100, Math.round(15 + idx * 4)),
      };
    }

    const surgeStep = idx - stepIndex + 1;
    const medSurge = Math.round(baselineMed * (1 + 0.38 * surgeStep * growthFactor));
    const feverSurge = Math.round(baselineFever * (1 + 0.32 * surgeStep * growthFactor));
    const riskSurge = Math.min(96, Math.round(30 + 16 * surgeStep * (growthFactor / 1.2)));

    return {
      week,
      baseline: baselineMed,
      medicine: medSurge,
      fever: feverSurge,
      risk: riskSurge,
    };
  });

  const activePoint = generatedTimeline[Math.min(stepIndex, generatedTimeline.length - 1)];

  return {
    timeline: generatedTimeline,
    activePoint,
    effectiveRt: parseFloat(effectiveRt.toFixed(2)),
    archetype: selectedArchetype,
    intervention: selectedIntervention,
  };
}

