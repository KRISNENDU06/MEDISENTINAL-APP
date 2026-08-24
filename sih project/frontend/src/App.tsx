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
import { SymptomCheckerModal } from './components/SymptomCheckerModal';
import { FacilitiesLocatorModal } from './components/FacilitiesLocatorModal';
import { CommunityReportModal } from './components/CommunityReportModal';
import { ToastContainer } from './components/ToastContainer';
import {
  HeartPulse,
  Volume2,
  VolumeX,
  MapPin,
  Building2,
  Users,
  ShieldCheck,
  Activity,
  Search,
} from 'lucide-react';

export const App: React.FC = () => {
  const { showToast } = useToast();
  const { user, isAdmin, isHealthOfficial, isViewer, canViewAnomalyMatrix } = useAuth();

  // Core Dashboard State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaSummary | null>(null);
  const [selectedRange, setSelectedRange] = useState<number>(30);

  // UI Modals & Panels State
  const [drillDownOpen, setDrillDownOpen] = useState<boolean>(false);
  const [observationModalOpen, setObservationModalOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [simulatorActive, setSimulatorActive] = useState<boolean>(false);
  const [chatbotOpen, setChatbotOpen] = useState<boolean>(false);
  const [symptomCheckerOpen, setSymptomCheckerOpen] = useState<boolean>(false);
  const [facilitiesOpen, setFacilitiesOpen] = useState<boolean>(false);
  const [communityReportOpen, setCommunityReportOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

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

  // Initial Load & on time range change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Run Risk Engine Action
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

  // Area Click Handler
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

  // Multilingual Speech Synthesis Audio Player
  const playAudioAdvisory = (lang: 'english' | 'odia' | 'hindi' = 'english') => {
    if (!('speechSynthesis' in window)) {
      showToast('error', 'Audio Unavailable', 'Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      showToast('info', 'Audio Stopped', 'Audio bulletin playback paused.');
      return;
    }

    window.speechSynthesis.cancel();
    let text = '';
    if (lang === 'odia') {
      text = 'ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା ବୁଲେଟିନ୍। ମେଡିସେଣ୍ଟିନେଲ୍ ତରଫରୁ ସମସ୍ତ ନାଗରିକଙ୍କୁ ସୂଚନା। ନିଜ ଘର ପାଖରେ ଜମି ରହିଥିବା ପାଣି ନଷ୍ଟ କରନ୍ତୁ, ମଶା ଧୂଆଁ ବ୍ୟବହାର କରନ୍ତୁ, ଏବଂ ଜ୍ୱର କିମ୍ବା ଶରୀର ଯନ୍ତ୍ରଣା ହେଲେ ତୁରନ୍ତ ନିକଟସ୍ଥ ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର କୁ ଯାଆନ୍ତୁ।';
    } else if (lang === 'hindi') {
      text = 'जन स्वास्थ्य बुलेटिन। मेडीसेंटिनल सर्विलांस द्वारा सूचित किया जाता है कि घर के आसपास जलजमाव न होने दें, मच्छरदानी का प्रयोग करें, और तेज बुखार या कमजोरी होने पर तुरंत नजदीकी स्वास्थ्य केंद्र पर जाएं।';
    } else {
      text = 'Public Health Advisory. MediSentinel early surveillance active. Inspect water containers, prevent vector breeding, maintain hydration with ORS, and visit your nearest Urban Primary Health Center if symptoms persist.';
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
    showToast('info', `Playing ${lang.toUpperCase()} Audio Advisory`, text.slice(0, 65) + '...');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] font-sans transition-colors duration-300">
      {/* Header */}
      <Header
        onRunRiskEngine={handleRunRiskEngine}
        isEngineRunning={isEngineRunning}
        onOpenObservationModal={() => setObservationModalOpen(true)}
        onOpenLoginModal={() => setLoginModalOpen(true)}
        onToggleSimulator={() => setSimulatorActive(!simulatorActive)}
        isSimulatorActive={simulatorActive}
        onOpenChatbot={() => setChatbotOpen(true)}
        onOpenSymptomChecker={() => setSymptomCheckerOpen(true)}
        onOpenFacilities={() => setFacilitiesOpen(true)}
        onOpenCommunityReport={() => setCommunityReportOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Control Ribbon with Time Range Selector */}
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

          {/* Time Range Selector */}
          <TimeRangeSelector
            selectedRange={selectedRange}
            onSelectRange={(days) => {
              setSelectedRange(days);
              showToast('info', 'Time Window Updated', `Surveillance window set to ${days} days.`);
            }}
          />
        </div>

        {/* Citizen Quick Action & Neighborhood Health Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-950/60 via-slate-900/80 to-emerald-950/60 border border-brand-500/30 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  📍 Check My Neighborhood Risk:
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-brand-300 border border-slate-700 font-semibold">
                  {selectedArea ? selectedArea.name : 'Saheed Nagar'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Status: <strong className={selectedArea?.riskLevel === 'HIGH' ? 'text-rose-400' : selectedArea?.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}>
                  {selectedArea?.riskLevel || 'LOW'} RISK ({selectedArea?.riskScore || 25}/100)
                </strong> • 24/7 Verified Emergency Care Ready
              </p>
            </div>
          </div>

          {/* Citizen Interactive Fast Action Chips */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setSymptomCheckerOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all active:scale-95"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              Symptom Checker
            </button>

            <button
              onClick={() => setFacilitiesOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5" />
              Find Care & Medicine
            </button>

            <button
              onClick={() => setCommunityReportOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all active:scale-95"
            >
              <Users className="w-3.5 h-3.5" />
              Community Watch
            </button>

            {/* Audio Voice Advisory Dropdown / Buttons */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 rounded-xl p-1 shrink-0">
              <span className="text-[10px] text-slate-400 px-1 font-semibold flex items-center gap-1">
                {isPlayingAudio ? <VolumeX className="w-3 h-3 text-rose-400 animate-pulse" /> : <Volume2 className="w-3 h-3 text-brand-400" />}
                Audio:
              </span>
              <button
                onClick={() => playAudioAdvisory('english')}
                className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                title="Play Advisory in English"
              >
                EN
              </button>
              <button
                onClick={() => playAudioAdvisory('odia')}
                className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition-colors"
                title="Play Advisory in Odia (ଓଡ଼ିଆ)"
              >
                ଓଡ଼ିଆ
              </button>
              <button
                onClick={() => playAudioAdvisory('hindi')}
                className="px-2 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg transition-colors"
                title="Play Advisory in Hindi (हिन्दी)"
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>

        {/* Metric Cards KPI Ribbon */}
        <MetricCards summary={summary} loading={loading} />

        {/* What-If Simulator Toggle Section (Educational & Scientific Simulation Lab) */}
        {simulatorActive && (
          <div className="animate-in fade-in zoom-in-95">
            <WhatIfSimulator />
          </div>
        )}

        {/* Geospatial Ward Surveillance Grid & Map */}
        <AreaMapGrid
          areas={areas}
          selectedArea={selectedArea}
          onSelectArea={handleSelectArea}
          loading={loading}
        />

        {/* Risk Explanation Diagnostics Panel */}
        <RiskExplanationPanel
          selectedArea={selectedArea || (areas.length > 0 ? areas[0] : null)}
          onOpenDrillDown={(area) => {
            setSelectedArea(area);
            setDrillDownOpen(true);
          }}
          onAskCopilot={handleAskCopilot}
        />

        {/* Historical Baseline vs Current Comparison Matrix (RESTRICTED: Admin & Health Official Only) */}
        {canViewAnomalyMatrix ? (
          <DataComparisonTable areas={areas} />
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Raw Statistical Anomaly Telemetry is managed by Health Officials & Municipal Epidemiologists.
            </span>
            <button
              onClick={() => setLoginModalOpen(true)}
              className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4"
            >
              Sign in as Health Official / Admin to inspect deep data
            </button>
          </div>
        )}

        {/* Alerts Management Hub */}
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
            <span>3-Tier RBAC</span>
            <span>•</span>
            <span>Community Health Early Warning</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Area Click Drill-Down Modal */}
      {drillDownOpen && selectedArea && (
        <AreaDrillDownModal
          area={selectedArea}
          onClose={() => setDrillDownOpen(false)}
          selectedRange={selectedRange}
        />
      )}

      {/* 2. Add Observation Modal (ADMIN ONLY) */}
      <AddObservationModal
        isOpen={observationModalOpen}
        onClose={() => setObservationModalOpen(false)}
        areas={areas}
        onObservationAdded={() => loadDashboardData(true)}
      />

      {/* 3. Role-Based Login Modal */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      {/* 4. Symptom Checker Modal */}
      <SymptomCheckerModal
        isOpen={symptomCheckerOpen}
        onClose={() => setSymptomCheckerOpen(false)}
        onOpenFacilities={() => setFacilitiesOpen(true)}
      />

      {/* 5. Healthcare & 24/7 Pharmacies Locator Modal */}
      <FacilitiesLocatorModal
        isOpen={facilitiesOpen}
        onClose={() => setFacilitiesOpen(false)}
      />

      {/* 6. Anonymous Community Watch Symptom Report Modal */}
      <CommunityReportModal
        isOpen={communityReportOpen}
        onClose={() => setCommunityReportOpen(false)}
      />

      {/* 7. MEDISENTINEL AI Health Assistant Chatbot */}
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

      {/* 8. Floating Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};
