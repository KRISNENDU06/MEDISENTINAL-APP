import React, { useState } from 'react';
import { useRisk } from '../context/useRisk';
import RiskBadge from '../components/common/RiskBadge';
import FactorBreakdown from '../components/risk/FactorBreakdown';
import SignalComparisonCard from '../components/risk/SignalComparisonCard';
import AlertCard from '../components/alerts/AlertCard';
import TrendComparisonChart from '../components/charts/TrendComparisonChart';
import ModelConfigModal from '../components/risk/ModelConfigModal';
import GeoRiskMap from '../components/risk/GeoRiskMap';
import OutbreakSimulatorBar from '../components/simulator/OutbreakSimulatorBar';
import PrivacyStudioModal from '../components/privacy/PrivacyStudioModal';
import IncidentResponseModal from '../components/response/IncidentResponseModal';
import AICopilotDrawer from '../components/copilot/AICopilotDrawer';
import {
  Filter,
  Sliders,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Lock,
  Radio,
  Bot,
  FileDown,
  Sparkles,
  Users,
} from 'lucide-react';

export default function RiskAnalysis() {
  const {
    areas = [],
    selectedArea,
    selectedAreaId,
    setSelectedAreaId,
    alerts = [],
    weights,
    setWeights,
    highRiskCount = 0,
    telemetryActive,
    toggleTelemetry,
    rrtDispatches = [],
    addNotification,
  } = useRisk();

  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [selectedIncidentAlert, setSelectedIncidentAlert] = useState(null);

  if (!areas || areas.length === 0 || !selectedArea) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Loading Surveillance Data...</p>
        </div>
      </div>
    );
  }

  const safeTimeline = selectedArea?.timeline || [];
  const safeSignals = selectedArea?.signals || {
    medicineDemand: { current: 0, baseline: 0, deviation: '0%' },
    feverIndicators: { current: 0, baseline: 0, deviation: '0%' },
    clinicVisits: { current: 0, baseline: 0, deviation: '0%' },
    geographicSpread: { affectedNeighbors: 0, totalNeighbors: 0, deviation: '0%' },
  };
  const safeFactorScores = selectedArea?.factorScores || {
    medicine: 0,
    healthIndicators: 0,
    persistence: 0,
    geographicSpread: 0,
  };
  const averageConfidence =
    areas.reduce((total, area) => total + (area.confidence || 0), 0) / areas.length;

  const handlePrintReport = () => {
    addNotification('Generating printable Epidemiological Surveillance Audit Report...', 'info');
    setTimeout(() => {
      window.print();
    }, 600);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Model Calibration Modal */}
      {weights && setWeights && (
        <ModelConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          weights={weights}
          setWeights={setWeights}
          onReset={() =>
            setWeights({ medicine: 0.3, health: 0.3, persistence: 0.2, geographic: 0.2 })
          }
        />
      )}

      {/* Differential Privacy Studio Modal */}
      <PrivacyStudioModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        selectedArea={selectedArea}
      />

      {/* Incident Response & Advisory Dispatch Modal */}
      <IncidentResponseModal
        isOpen={!!selectedIncidentAlert}
        onClose={() => setSelectedIncidentAlert(null)}
        targetAlert={selectedIncidentAlert}
      />

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* Top Navigation & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              MediSentinel Early Warning & Disease Surveillance Command
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold">
              SIH 2026
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Privacy-preserving multi-signal syndromic, OTC pharmacy anomaly, and spatial diffusion surveillance engine.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Telemetry Toggle */}
          <button
            onClick={toggleTelemetry}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition border cursor-pointer ${
              telemetryActive
                ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
            }`}
          >
            <Radio size={13} className={telemetryActive ? 'animate-pulse text-rose-600' : 'text-slate-400'} />
            {telemetryActive ? 'Live Telemetry Active' : 'Start Live Feed'}
          </button>

          {/* Differential Privacy Button */}
          <button
            onClick={() => setIsPrivacyOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 font-medium px-3 py-2 rounded-lg transition border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Lock size={13} className="text-emerald-600" /> DP ($\epsilon$-Budget)
          </button>

          {/* Model Weights Calibrator */}
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 font-medium px-3 py-2 rounded-lg transition border border-slate-300 shadow-2xs cursor-pointer"
          >
            <Sliders size={13} className="text-indigo-600" /> Weights
          </button>

          {/* Export Audit Report */}
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 font-medium px-3 py-2 rounded-lg transition border border-slate-300 shadow-2xs cursor-pointer"
            title="Download Printable PDF Audit Report"
          >
            <FileDown size={13} /> Export Report
          </button>

          {/* Area Selector Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Filter size={14} className="text-slate-500" />
            <select
              value={selectedAreaId || ''}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="bg-transparent text-slate-800 text-xs outline-none cursor-pointer"
            >
              {areas.map((area) => (
                <option key={area.id} value={area.id} className="bg-white text-slate-800">
                  {area.name} ({area.riskLevel})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Outbreak Simulator Sandbox Bar */}
      <OutbreakSimulatorBar />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Sectors Monitored</span>
            <Building2 size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{areas.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Bhubaneswar Urban Region</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Critical Early Warnings</span>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{highRiskCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Requiring immediate SOP audit</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Active RRT Dispatches</span>
            <Users size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{rrtDispatches.length} Units</div>
          <p className="text-[11px] text-slate-500 mt-1">Rapid field inspection crews</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Model Confidence</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{averageConfidence.toFixed(1)}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Multi-signal cross-match</p>
        </div>
      </div>

      {/* Main Grid: Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TrendComparisonChart data={safeTimeline} areaName={selectedArea.name} />

          <GeoRiskMap
            areas={areas}
            selectedAreaId={selectedAreaId}
            onSelectArea={(id) => setSelectedAreaId(id)}
            onOpenIncidentModal={(alert) => setSelectedIncidentAlert(alert)}
          />

          <SignalComparisonCard signals={safeSignals} />
        </div>

        {/* Sidebar Focused Micro-Sector & Explainable Breakdown */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Focused Micro-Sector
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedArea.name}</h2>
            <p className="text-xs text-slate-500">{selectedArea.district}, Odisha</p>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Confidence</div>
                <div className="text-sm font-semibold text-slate-800">{selectedArea.confidence || 0}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Persistence</div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedArea.persistenceWeeks || 0} wks
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <RiskBadge level={selectedArea.riskLevel || 'LOW'} />
              </div>
            </div>

            {/* Quick Copilot Analysis trigger button */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 rounded-lg border border-indigo-200 transition cursor-pointer"
            >
              <Bot size={14} /> Analyze Anomalies with Copilot
            </button>
          </div>

          <FactorBreakdown
            factors={safeFactorScores}
            totalScore={selectedArea.riskScore || 0}
          />
        </div>
      </div>

      {/* Active Multi-Signal Alerts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Active Multi-Signal Alerts & SOP Actions</h3>
            <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
              {alerts.length} Triggered
            </span>
          </div>
          <span className="text-xs text-slate-500">Click actions to dispatch emergency response</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onOpenResponseModal={(alt) => setSelectedIncidentAlert(alt)}
            />
          ))}
        </div>
      </div>

      {/* Floating AI Copilot Trigger Button (Bottom Right) */}
      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-full shadow-2xl transition hover:scale-105 cursor-pointer border-2 border-white/20"
        >
          <Sparkles size={18} />
          <span className="text-xs">Ask MediSentinel AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}
    </div>
  );
}