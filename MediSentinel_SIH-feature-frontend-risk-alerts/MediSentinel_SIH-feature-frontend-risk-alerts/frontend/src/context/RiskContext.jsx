import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { riskService } from '../services/riskService';
import { MOCK_AREAS, MOCK_ALERTS, DISEASE_ARCHETYPES, INTERVENTIONS } from '../data/mockRiskData';
import { RiskContext } from './riskContextValue';

const DEFAULT_WEIGHTS = {
  medicine: 0.30,
  health: 0.30,
  persistence: 0.20,
  geographic: 0.20,
};

export function RiskProvider({ children }) {
  const [role, setRole] = useState('analyst'); // 'analyst' | 'officer' | 'citizen'
  const [rawAreas, setRawAreas] = useState(MOCK_AREAS);
  const [selectedAreaId, setSelectedAreaId] = useState(MOCK_AREAS[0]?.id || 'area-1');
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  // Simulation State
  const [stepIndex, setStepIndexState] = useState(5); // 0 (W28) to 5 (W33)
  const [isPlaying, setIsPlaying] = useState(false);
  const [r0, setR0State] = useState(2.4);
  const [archetype, setArchetypeState] = useState('DENGUE');
  const [intervention, setInterventionState] = useState('NONE');
  const [effectiveRt, setEffectiveRt] = useState(2.4);
  const [isSimulated, setIsSimulated] = useState(false);

  // Differential Privacy & Incident Response State
  const [epsilon, setEpsilon] = useState(1.0);
  const [telemetryActive, setTelemetryActive] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [rrtDispatches, setRrtDispatches] = useState([]);
  const [activeAdvisory, setActiveAdvisory] = useState(null);

  // Map GIS Layers
  const [mapLayers, setMapLayers] = useState({
    showVectors: true,
    showBuffers: true,
    showFacilities: true,
  });

  const timerRef = useRef(null);

  // Notification helper
  const addNotification = useCallback((message, type = 'info', title = 'MediSentinel Alert') => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setNotifications((prev) => [{ id, title, message, type, time: new Date() }, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const toggleMapLayer = (layerName) => {
    setMapLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [fetchedAreas, fetchedAlerts] = await Promise.all([
        riskService.getAreas(),
        riskService.getActiveAlerts(),
      ]);
      setRawAreas(fetchedAreas);
      setAlerts(fetchedAlerts);
    }
    loadData();
  }, []);

  // Recalculate dynamic scores based on calibrated weights and current timeline point
  const calculatedAreas = useMemo(() => {
    return rawAreas.map((area) => {
      const medScore =
        (area.signals.medicineDemand.current / (area.signals.medicineDemand.baseline * 1.8)) *
        100 *
        weights.medicine;
      const hlthScore =
        (area.signals.feverIndicators.current / (area.signals.feverIndicators.baseline * 1.8)) *
        100 *
        weights.health;
      const persScore = (area.persistenceWeeks / 3) * 100 * weights.persistence;
      const geoScore =
        (area.signals.geographicSpread.affectedNeighbors /
          area.signals.geographicSpread.totalNeighbors) *
        100 *
        weights.geographic;

      const dynamicTotal = Math.min(100, Math.round(medScore + hlthScore + persScore + geoScore));
      const dynamicLevel = dynamicTotal >= 70 ? 'HIGH' : dynamicTotal >= 40 ? 'MEDIUM' : 'LOW';

      return {
        ...area,
        riskScore: dynamicTotal,
        riskLevel: dynamicLevel,
        factorScores: {
          medicine: Math.min(weights.medicine * 100, medScore),
          healthIndicators: Math.min(weights.health * 100, hlthScore),
          persistence: Math.min(weights.persistence * 100, persScore),
          geographicSpread: Math.min(weights.geographic * 100, geoScore),
        },
      };
    });
  }, [rawAreas, weights]);

  const selectedArea =
    calculatedAreas.find((a) => a.id === selectedAreaId) || calculatedAreas[0];

  // Simulation execution engine
  const executeSimulationStep = useCallback(
    async (targetStep, targetR0, targetArchetype, targetIntervention) => {
      const res = await riskService.runSimulation({
        stepIndex: targetStep,
        r0: targetR0,
        archetype: targetArchetype,
        intervention: targetIntervention,
        epicenterWardId: 'area-1',
      });

      if (res.areas) {
        setRawAreas(res.areas);
      }
      if (res.effectiveRt) {
        setEffectiveRt(res.effectiveRt);
      }
      setIsSimulated(true);
    },
    []
  );

  const setStepIndex = (newIndex) => {
    const clamped = Math.max(0, Math.min(5, newIndex));
    setStepIndexState(clamped);
    executeSimulationStep(clamped, r0, archetype, intervention);
  };

  const setR0 = (newR0) => {
    setR0State(newR0);
    executeSimulationStep(stepIndex, newR0, archetype, intervention);
  };

  const setArchetype = (newArchetype) => {
    setArchetypeState(newArchetype);
    const defaultR0 = DISEASE_ARCHETYPES[newArchetype]?.defaultR0 || 2.4;
    setR0State(defaultR0);
    executeSimulationStep(stepIndex, defaultR0, newArchetype, intervention);
    addNotification(`Switched disease model to ${DISEASE_ARCHETYPES[newArchetype]?.name}`, 'info');
  };

  const setIntervention = (newIntervention) => {
    setInterventionState(newIntervention);
    executeSimulationStep(stepIndex, r0, archetype, newIntervention);
    const label = INTERVENTIONS[newIntervention]?.label || 'None';
    addNotification(`Applied Intervention Protocol: ${label}`, 'success');
  };

  // Playback loop for timeline
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStepIndexState((prev) => {
          if (prev >= 5) {
            setIsPlaying(false);
            return 5;
          }
          const next = prev + 1;
          executeSimulationStep(next, r0, archetype, intervention);
          return next;
        });
      }, 1600);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, r0, archetype, intervention, executeSimulationStep]);

  const playSimulation = () => {
    if (stepIndex >= 5) {
      setStepIndexState(0);
      executeSimulationStep(0, r0, archetype, intervention);
    }
    setIsPlaying(true);
  };

  const pauseSimulation = () => {
    setIsPlaying(false);
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setStepIndexState(5);
    setR0State(2.4);
    setArchetypeState('DENGUE');
    setInterventionState('NONE');
    setRawAreas(MOCK_AREAS);
    setSelectedAreaId(MOCK_AREAS[0]?.id || 'area-1');
    setAlerts(MOCK_ALERTS);
    setWeights(DEFAULT_WEIGHTS);
    setIsSimulated(false);
    setEffectiveRt(2.4);
    addNotification('Simulation reset to surveillance baseline.', 'info');
  };

  // Live Telemetry Streamer Simulation
  useEffect(() => {
    if (!telemetryActive) return;

    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * calculatedAreas.length);
      const targetArea = calculatedAreas[randomIdx];
      const delta = Math.floor(Math.random() * 25) - 5;

      if (delta > 12) {
        addNotification(
          `Incoming Telemetry: Sudden +${delta}% OTC Anti-Infective spike detected in ${targetArea.name}!`,
          'warning',
          'Live Anomaly Detection'
        );
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [telemetryActive, calculatedAreas, addNotification]);

  const toggleTelemetry = () => {
    setTelemetryActive((prev) => {
      const next = !prev;
      addNotification(
        next ? 'Live Real-Time Telemetry Stream Activated' : 'Live Stream Paused',
        next ? 'success' : 'info'
      );
      return next;
    });
  };

  // Incident response actions
  const dispatchRRT = async (dispatchData) => {
    const res = await riskService.dispatchRRT(dispatchData);
    if (res.dispatch) {
      setRrtDispatches((prev) => [res.dispatch, ...prev]);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === dispatchData.alertId
            ? { ...a, rrtDispatched: true, status: 'IN_INVESTIGATION' }
            : a
        )
      );
      addNotification(
        `RRT Unit Dispatched (${res.dispatch.dispatchId}) to ${dispatchData.wardName}`,
        'success',
        'Emergency Action Dispatched'
      );
    }
  };

  const updateAlert = async (alertId, status) => {
    await riskService.updateAlertStatus(alertId, status);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status } : a))
    );
    addNotification(`Alert status updated to: ${status}`, 'info');
  };

  const generateAdvisory = async (wardName, riskLevel, diseaseType) => {
    const adv = await riskService.generateAdvisory({ wardName, riskLevel, diseaseType });
    setActiveAdvisory(adv);
    return adv;
  };

  const value = {
    role,
    setRole,
    areas: calculatedAreas,
    selectedArea,
    selectedAreaId,
    setSelectedAreaId,
    alerts,
    updateAlert,
    weights,
    setWeights,
    // Simulator controls
    stepIndex,
    setStepIndex,
    isPlaying,
    playSimulation,
    pauseSimulation,
    r0,
    setR0,
    archetype,
    setArchetype,
    intervention,
    setIntervention,
    effectiveRt,
    isSimulated,
    resetSimulation,
    // Differential privacy
    epsilon,
    setEpsilon,
    // Live Telemetry
    telemetryActive,
    toggleTelemetry,
    notifications,
    addNotification,
    removeNotification,
    // Incident response
    rrtDispatches,
    dispatchRRT,
    activeAdvisory,
    generateAdvisory,
    // Map GIS Layers
    mapLayers,
    toggleMapLayer,
    highRiskCount: calculatedAreas.filter((a) => a.riskLevel === 'HIGH').length,
    mediumRiskCount: calculatedAreas.filter((a) => a.riskLevel === 'MEDIUM').length,
  };

  return <RiskContext.Provider value={value}>{children}</RiskContext.Provider>;
}
