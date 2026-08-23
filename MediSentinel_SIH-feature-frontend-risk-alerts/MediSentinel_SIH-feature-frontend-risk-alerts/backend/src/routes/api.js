import express from 'express';
import { simulateOutbreakStep, DISEASE_ARCHETYPES, INTERVENTIONS } from '../services/epidemicModel.js';
import { applyDifferentialPrivacy } from '../services/differentialPrivacy.js';
import { answerEpidemiologistQuery } from '../services/aiCopilotService.js';

export const router = express.Router();

// Mock Initial In-Memory State
let mockAreas = [
  {
    id: "area-1",
    name: "Ward 12 - Saheed Nagar",
    district: "Bhubaneswar",
    riskScore: 87,
    riskLevel: "HIGH",
    confidence: 89,
    trend: "INCREASING",
    persistenceWeeks: 3,
    population: 48200,
    coordinates: [20.2925, 85.8475],
    signals: {
      medicineDemand: { current: 1620, baseline: 1000, deviation: "+62%" },
      feverIndicators: { current: 445, baseline: 300, deviation: "+48%" },
      clinicVisits: { current: 92, baseline: 60, deviation: "+53%" },
      geographicSpread: { affectedNeighbors: 3, totalNeighbors: 4, deviation: "+75%" },
    },
    factorScores: {
      medicine: 27.0,
      healthIndicators: 24.7,
      persistence: 20.0,
      geographicSpread: 15.0,
    },
    timeline: [
      { week: "W28", baseline: 1000, medicine: 980, fever: 290, risk: 18 },
      { week: "W29", baseline: 1000, medicine: 1040, fever: 310, risk: 24 },
      { week: "W30", baseline: 1000, medicine: 1280, fever: 360, risk: 54 },
      { week: "W31", baseline: 1000, medicine: 1490, fever: 410, risk: 71 },
      { week: "W32", baseline: 1000, medicine: 1620, fever: 445, risk: 82 },
      { week: "W33", baseline: 1000, medicine: 1710, fever: 480, risk: 87 },
    ],
    status: "EARLY_WARNING",
  },
  {
    id: "area-2",
    name: "Ward 07 - Patia Sector 3",
    district: "Bhubaneswar",
    riskScore: 54,
    riskLevel: "MEDIUM",
    confidence: 68,
    trend: "INCREASING",
    persistenceWeeks: 1,
    population: 62400,
    coordinates: [20.3588, 85.8166],
    signals: {
      medicineDemand: { current: 1400, baseline: 950, deviation: "+47%" },
      feverIndicators: { current: 280, baseline: 260, deviation: "+7.6%" },
      clinicVisits: { current: 45, baseline: 42, deviation: "+7.1%" },
      geographicSpread: { affectedNeighbors: 1, totalNeighbors: 4, deviation: "+25%" },
    },
    factorScores: {
      medicine: 24.6,
      healthIndicators: 17.9,
      persistence: 6.7,
      geographicSpread: 5.0,
    },
    timeline: [
      { week: "W28", baseline: 950, medicine: 940, fever: 250, risk: 15 },
      { week: "W29", baseline: 950, medicine: 960, fever: 255, risk: 18 },
      { week: "W30", baseline: 950, medicine: 970, fever: 260, risk: 22 },
      { week: "W31", baseline: 950, medicine: 1100, fever: 265, risk: 38 },
      { week: "W32", baseline: 950, medicine: 1400, fever: 280, risk: 58 },
      { week: "W33", baseline: 950, medicine: 1450, fever: 295, risk: 54 },
    ],
    status: "WATCH",
  },
  {
    id: "area-3",
    name: "Ward 21 - Old Town",
    district: "Bhubaneswar",
    riskScore: 33,
    riskLevel: "LOW",
    confidence: 94,
    trend: "STABLE",
    persistenceWeeks: 0,
    population: 39500,
    coordinates: [20.2444, 85.8340],
    signals: {
      medicineDemand: { current: 810, baseline: 800, deviation: "+1.2%" },
      feverIndicators: { current: 150, baseline: 155, deviation: "-3.2%" },
      clinicVisits: { current: 30, baseline: 32, deviation: "-6.2%" },
      geographicSpread: { affectedNeighbors: 0, totalNeighbors: 3, deviation: "0%" },
    },
    factorScores: {
      medicine: 16.9,
      healthIndicators: 16.1,
      persistence: 0.0,
      geographicSpread: 0.0,
    },
    timeline: [
      { week: "W28", baseline: 800, medicine: 790, fever: 155, risk: 16 },
      { week: "W29", baseline: 800, medicine: 805, fever: 150, risk: 19 },
      { week: "W30", baseline: 800, medicine: 800, fever: 152, risk: 20 },
      { week: "W31", baseline: 800, medicine: 815, fever: 154, risk: 21 },
      { week: "W32", baseline: 800, medicine: 810, fever: 150, risk: 22 },
      { week: "W33", baseline: 800, medicine: 810, fever: 150, risk: 33 },
    ],
    status: "MONITOR",
  },
  {
    id: "area-4",
    name: "Ward 15 - Khandagiri",
    district: "Bhubaneswar",
    riskScore: 40,
    riskLevel: "MEDIUM",
    confidence: 88,
    trend: "STABLE",
    persistenceWeeks: 0,
    population: 51200,
    coordinates: [20.2588, 85.7925],
    signals: {
      medicineDemand: { current: 910, baseline: 890, deviation: "+2.2%" },
      feverIndicators: { current: 210, baseline: 200, deviation: "+5.0%" },
      clinicVisits: { current: 38, baseline: 35, deviation: "+8.5%" },
      geographicSpread: { affectedNeighbors: 1, totalNeighbors: 4, deviation: "+25%" },
    },
    factorScores: {
      medicine: 17.0,
      healthIndicators: 17.5,
      persistence: 0.0,
      geographicSpread: 5.0,
    },
    timeline: [
      { week: "W28", baseline: 890, medicine: 880, fever: 195, risk: 20 },
      { week: "W29", baseline: 890, medicine: 895, fever: 200, risk: 22 },
      { week: "W30", baseline: 890, medicine: 900, fever: 205, risk: 25 },
      { week: "W31", baseline: 890, medicine: 905, fever: 208, risk: 29 },
      { week: "W32", baseline: 890, medicine: 910, fever: 210, risk: 35 },
      { week: "W33", baseline: 890, medicine: 920, fever: 215, risk: 40 },
    ],
    status: "MONITOR",
  }
];

let mockAlerts = [
  {
    id: "alt-901",
    areaId: "area-1",
    areaName: "Ward 12 - Saheed Nagar",
    severity: "HIGH",
    title: "Multi-Signal Health Anomaly Detected",
    riskScore: 87,
    confidence: 89,
    detectedAt: "2026-08-22T12:00:00Z",
    evidence: [
      "Aggregated pharmacy fever/respiratory drug sales surged +62% above 4-week seasonal baseline.",
      "Community fever & respiratory symptom indicators elevated +48%.",
      "Signal anomaly has persisted across 3 consecutive observation cycles.",
      "Elevated activity observed in 3 adjacent monitoring sectors.",
    ],
    recommendedAction: "Initiate localized primary health center audit and verify syndromic reporting.",
    status: "ACTIVE",
    rrtDispatched: false,
  },
  {
    id: "alt-899",
    areaId: "area-2",
    areaName: "Ward 07 - Patia Sector 3",
    severity: "MEDIUM",
    title: "Isolated Medicine Demand Spike",
    riskScore: 54,
    confidence: 68,
    detectedAt: "2026-08-22T11:30:00Z",
    evidence: [
      "Pharmacy demand spike +47% without concurrent clinic symptom surges.",
      "Possible inventory restock or localized non-epidemic fluctuation.",
    ],
    recommendedAction: "Continue active surveillance; cross-reference next 48-hour clinic entries.",
    status: "ACTIVE",
    rrtDispatched: false,
  },
];

// GET: Summary of all areas
router.get('/areas/risk-summary', (req, res) => {
  res.json(mockAreas);
});

// GET: Active alerts
router.get('/alerts/active', (req, res) => {
  res.json(mockAlerts);
});

// PATCH: Update alert status
router.patch('/alerts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, rrtDispatched } = req.body;

  mockAlerts = mockAlerts.map((alert) => {
    if (alert.id === id) {
      return {
        ...alert,
        status: status || alert.status,
        rrtDispatched: rrtDispatched !== undefined ? rrtDispatched : alert.rrtDispatched,
      };
    }
    return alert;
  });

  const updated = mockAlerts.find((a) => a.id === id);
  res.json({ success: true, alert: updated });
});

// POST: Run Outbreak Step Simulation
router.post('/simulation/run', (req, res) => {
  const { stepIndex = 0, r0 = 2.4, archetype = 'DENGUE', intervention = 'NONE', epicenterWardId = 'area-1' } = req.body;

  const results = mockAreas.map((area) => {
    const isEpicenter = area.id === epicenterWardId;
    const distance = isEpicenter ? 0 : 1;

    const sim = simulateOutbreakStep({
      baseTimeline: area.timeline,
      stepIndex,
      r0,
      archetype,
      intervention,
      epicenterWardId,
      currentWardId: area.id,
      neighborDistance: distance,
    });

    return {
      ...area,
      riskScore: sim.activePoint.risk,
      riskLevel: sim.activePoint.risk >= 70 ? 'HIGH' : sim.activePoint.risk >= 40 ? 'MEDIUM' : 'LOW',
      timeline: sim.timeline,
      effectiveRt: sim.effectiveRt,
    };
  });

  res.json({
    stepIndex,
    archetype: DISEASE_ARCHETYPES[archetype] || DISEASE_ARCHETYPES.DENGUE,
    intervention: INTERVENTIONS[intervention] || INTERVENTIONS.NONE,
    areas: results,
  });
});

// POST: Differential Privacy Perturbation Engine
router.post('/privacy/perturb', (req, res) => {
  const { data = [], epsilon = 1.0, sensitivity = 1.0 } = req.body;
  const result = applyDifferentialPrivacy(data, epsilon, sensitivity);
  res.json(result);
});

// POST: Incident Response - Dispatch Rapid Response Team (RRT)
router.post('/response/dispatch-rrt', (req, res) => {
  const { alertId, wardId, wardName, teamComposition, priority = 'CRITICAL' } = req.body;

  const dispatchId = `RRT-${Date.now().toString().slice(-6)}`;
  const dispatchRecord = {
    dispatchId,
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
  };

  // Mark alert as RRT dispatched
  mockAlerts = mockAlerts.map((alert) =>
    alert.id === alertId ? { ...alert, rrtDispatched: true, status: 'IN_INVESTIGATION' } : alert
  );

  res.json({ success: true, dispatch: dispatchRecord });
});

// POST: Multilingual Public Health Advisory Generator
router.post('/response/generate-advisory', (req, res) => {
  const { wardName = 'Saheed Nagar', riskLevel = 'HIGH', diseaseType = 'Vector-Borne (Dengue)' } = req.body;

  const advisory = {
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

  res.json(advisory);
});

// POST: AI Epidemiologist Copilot Query
router.post('/copilot/query', (req, res) => {
  const { query, selectedAreaId, weights } = req.body;
  const selectedArea = mockAreas.find((a) => a.id === selectedAreaId) || mockAreas[0];
  const response = answerEpidemiologistQuery({
    query,
    selectedArea,
    allAreas: mockAreas,
    weights,
  });
  res.json(response);
});

// GET: Server-Sent Events (SSE) Live Telemetry Stream
router.get('/telemetry/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const intervalId = setInterval(() => {
    const randomArea = mockAreas[Math.floor(Math.random() * mockAreas.length)];
    const pharmacyDelta = Math.floor(Math.random() * 20) - 5;
    const feverDelta = Math.floor(Math.random() * 8) - 2;

    const eventPayload = {
      timestamp: new Date().toISOString(),
      areaId: randomArea.id,
      areaName: randomArea.name,
      pharmacyDelta,
      feverDelta,
      currentRisk: Math.min(98, Math.max(12, randomArea.riskScore + (pharmacyDelta > 10 ? 2 : -1))),
    };

    res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
  }, 4000);

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});

