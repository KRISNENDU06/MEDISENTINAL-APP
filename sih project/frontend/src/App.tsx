import React, { useState, useEffect, useCallback } from 'react';
import { api, DashboardSummary, AreaSummary, AlertItem } from './services/api';
import { useToast } from './context/ToastContext';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { TimeRangeSelector } from './components/TimeRangeSelector';
import { AreaMapGrid } from './components/AreaMapGrid';
import { AreaDrillDownModal } from './components/AreaDrillDownModal';
import { RiskExplanationPanel } from './components/RiskExplanationPanel';
import { AlertsHub } from './components/AlertsHub';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AddObservationModal } from './components/AddObservationModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { DataComparisonTable } from './components/DataComparisonTable';
import { AIChatbotWidget } from './components/AIChatbotWidget';
import { ToastContainer } from './components/ToastContainer';
import {
  Activity,
  AlertOctagon,
  Sliders,
  Shield,
  Layers,
  HeartPulse,
} from 'lucide-react';

export const App: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  // Core Dashboard State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaSummary | null>(null);
  const [selectedRange, setSelectedRange] = useState<number>(30); // 7, 30, 90 days (Requirement 6)

  // UI Modals & Panels State
  const [drillDownOpen, setDrillDownOpen] = useState<boolean>(false);
  const [observationModalOpen, setObservationModalOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [simulatorActive, setSimulatorActive] = useState<boolean>(false);
  const [chatbotOpen, setChatbotOpen] = useState<boolean>(false);
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Dashboard Data
  const loadDashboardData = useCallback(async (showNotification: boolean = false) => {
    try {
      const [sumData, areaData, alertData] = await Promise.all([
        api.getDashboardSummary().catch(() => null),
        api.getAreaRiskSummary(selectedRange).catch(() => []),
        api.getAlerts().catch(() => []),
      ]);

      if (sumData) setSummary(sumData);
      if (areaData && areaData.length > 0) {
        setAreas(areaData);
        // Default selected area to first or highest risk
        setSelectedArea((prev) => {
          if (!prev) return areaData[0];
          const updated = areaData.find((a) => a.id === prev.id);
          return updated || areaData[0];
        });
      }
      if (alertData) setAlerts(alertData);

      if (showNotification) {
        showToast('info', 'Dashboard Refreshed', 'Latest community syndromic signals loaded.');
      }
    } catch (err: any) {
      console.error('Data loading error:', err);
      showToast('error', 'Sync Failed', 'Could not fetch surveillance data from backend.');
    } finally {
      setLoading(false);
    }
  }, [selectedRange, showToast]);

  // Initial Load & on time range change (Requirement 6)
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Run Risk Engine Action (Requirement 2)
  const handleRunRiskEngine = async () => {
    setIsEngineRunning(true);
    try {
      const res = await api.runRiskEngine();
      showToast(
        'success',
        'Risk Engine Execution Complete',
        `Evaluated ${res.processed_areas} areas • ${res.generated_alerts} new alert signals generated.`
      );
      await loadDashboardData(false);
    } catch (err: any) {
      showToast('error', 'Execution Error', err.message || 'Risk engine execution failed');
    } finally {
      setIsEngineRunning(false);
    }
  };

  // Area Click Handler (Requirement 1)
  const handleSelectArea = (area: AreaSummary) => {
    setSelectedArea(area);
    setDrillDownOpen(true);
  };

  // Copilot / AI Assistant Request
  const handleAskCopilot = (areaName: string) => {
    showToast(
      'info',
      `MEDISENTINEL AI Assistant (${areaName})`,
      `Opening epidemiological intelligence assistant for ${areaName}...`
    );
    setChatbotOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] font-sans transition-colors duration-300">
      {/* Header (MEDISENTINEL • YOUR HEALTH, OUR WATCH) */}
      <Header
        onRunRiskEngine={handleRunRiskEngine}
        isEngineRunning={isEngineRunning}
        onOpenObservationModal={() => setObservationModalOpen(true)}
        onOpenLoginModal={() => setLoginModalOpen(true)}
        onToggleSimulator={() => setSimulatorActive(!simulatorActive)}
        isSimulatorActive={simulatorActive}
        onOpenChatbot={() => setChatbotOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Control Ribbon with Time Range Selector (Requirement 6) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <HeartPulse className="w-6 h-6 text-brand-400" />
                MEDISENTINEL Surveillance Hub
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                "YOUR HEALTH, OUR WATCH"
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Continuous multi-signal cross-validation correlating pharmacy OTC demand, syndromic fever cases, and clinic visits
            </p>
          </div>

          {/* Time Range Selector (Requirement 6) */}
          <TimeRangeSelector
            selectedRange={selectedRange}
            onSelectRange={(days) => {
              setSelectedRange(days);
              showToast('info', 'Time Window Updated', `Surveillance window set to ${days} days.`);
            }}
          />
        </div>

        {/* Metric Cards KPI Ribbon */}
        <MetricCards summary={summary} loading={loading} />

        {/* What-If Simulator Toggle Section (Requirement 7) */}
        {simulatorActive && (
          <div className="animate-in fade-in zoom-in-95">
            <WhatIfSimulator />
          </div>
        )}

        {/* Geospatial Ward Surveillance Grid & Map (Requirement 1: Real-World Map & Area Click Drill-Down) */}
        <AreaMapGrid
          areas={areas}
          selectedArea={selectedArea}
          onSelectArea={handleSelectArea}
          loading={loading}
        />

        {/* Risk Explanation Diagnostics Panel (Requirement 8) */}
        <RiskExplanationPanel
          selectedArea={selectedArea || (areas.length > 0 ? areas[0] : null)}
          onOpenDrillDown={(area) => {
            setSelectedArea(area);
            setDrillDownOpen(true);
          }}
          onAskCopilot={handleAskCopilot}
        />

        {/* Historical Baseline vs Current Comparison Matrix (Sections 25, 29, 64) */}
        <DataComparisonTable areas={areas} />

        {/* Alerts Management Hub (Requirement 3 & 5) */}
        <AlertsHub
          alerts={alerts}
          onRefreshAlerts={() => loadDashboardData(false)}
          onSelectAreaByName={(name) => {
            const match = areas.find((a) => a.name.toLowerCase().includes(name.toLowerCase()));
            if (match) {
              setSelectedArea(match);
              setDrillDownOpen(true);
            }
          }}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="font-semibold text-slate-300">MEDISENTINEL</span>
            <span>—</span>
            <span className="italic text-emerald-400">"YOUR HEALTH, OUR WATCH"</span>
          </div>
          <div className="flex items-center gap-4">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>Real-World Spatial Mesh</span>
            <span>•</span>
            <span>Community Health Early Warning</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Area Click Drill-Down Modal (Requirement 1) */}
      {drillDownOpen && selectedArea && (
        <AreaDrillDownModal
          area={selectedArea}
          onClose={() => setDrillDownOpen(false)}
          selectedRange={selectedRange}
        />
      )}

      {/* 2. Add Observation Modal (Requirement 4) */}
      <AddObservationModal
        isOpen={observationModalOpen}
        onClose={() => setObservationModalOpen(false)}
        areas={areas}
        onObservationAdded={() => loadDashboardData(true)}
      />

      {/* 3. Admin Login Modal (Requirement 9) */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      {/* 4. MEDISENTINEL AI Health Assistant Chatbot */}
      <AIChatbotWidget
        selectedArea={selectedArea}
        isOpen={chatbotOpen}
        onToggle={() => setChatbotOpen(!chatbotOpen)}
        onOpenDrillDown={(area) => {
          setSelectedArea(area);
          setDrillDownOpen(true);
        }}
        onToggleSimulator={() => setSimulatorActive(!simulatorActive)}
      />

      {/* 5. Floating Toast Notification Container (Requirement 10) */}
      <ToastContainer />
    </div>
  );
};

