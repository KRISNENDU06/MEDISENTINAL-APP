import React from 'react';
import { AreaSummary } from '../services/api';
import {
  Microscope,
  AlertTriangle,
  Pill,
  Thermometer,
  Stethoscope,
  Share2,
  CheckCircle,
  ExternalLink,
  ClipboardCheck,
} from 'lucide-react';

interface RiskExplanationPanelProps {
  selectedArea: AreaSummary | null;
  onOpenDrillDown: (area: AreaSummary) => void;
  onAskCopilot: (areaName: string) => void;
}

export const RiskExplanationPanel: React.FC<RiskExplanationPanelProps> = ({
  selectedArea,
  onOpenDrillDown,
  onAskCopilot,
}) => {
  if (!selectedArea) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-400">
        <Microscope className="w-6 h-6 text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-medium">Select any area on the map to view syndromic factor attribution</p>
      </div>
    );
  }

  const { factorScores, signals, riskScore, riskLevel, explanation, recommendedAction } = selectedArea;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
            <Microscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Syndromic Anomaly Diagnostics: <span className="text-brand-300">{selectedArea.name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cross-validated multi-signal anomaly weighting & factor attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAskCopilot(selectedArea.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/30 transition-all"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Epidemiological Synthesis</span>
          </button>
          <button
            onClick={() => onOpenDrillDown(selectedArea)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <span>Full Drill-Down</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Explainable Breakdown (Requirement 8) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-5">
        {/* Left: Natural Language Diagnostic Explanation */}
        <div className="md:col-span-7 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Surveillance Engine Finding
            </span>
            <p className="text-sm font-semibold text-slate-100 leading-relaxed">
              "{explanation}"
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1.5">
              Recommended Public Health Action
            </span>
            <p className="text-xs font-medium text-amber-200/90 leading-relaxed">
              {recommendedAction}
            </p>
          </div>
        </div>

        {/* Right: Factor Contribution Weights (30% Meds, 30% Health, 20% Persist, 20% Spread) */}
        <div className="md:col-span-5 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Risk Factor Contribution Breakdown
          </span>

          {/* Medicine Factor (30%) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-brand-400" />
                Medicine Demand (30%)
              </span>
              <span className="font-bold text-white">{signals?.medicineDemand?.deviation || '+0%'}</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (factorScores?.medicine || 0) * 3.3)}%` }}
              />
            </div>
          </div>

          {/* Health Indicators Factor (30%) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                Fever & Health (30%)
              </span>
              <span className="font-bold text-white">{signals?.feverIndicators?.deviation || '+0%'}</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (factorScores?.healthIndicators || 0) * 3.3)}%` }}
              />
            </div>
          </div>

          {/* Persistence Factor (20%) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                Persistence (20%)
              </span>
              <span className="font-bold text-white">{selectedArea?.persistenceWeeks || 0} wks abnormal</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (factorScores?.persistence || 0) * 5)}%` }}
              />
            </div>
          </div>

          {/* Geographic Spread (20%) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                Geographic Spread (20%)
              </span>
              <span className="font-bold text-white">{signals?.geographicSpread?.deviation || '0%'}</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (factorScores?.geographicSpread || 0) * 5)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

