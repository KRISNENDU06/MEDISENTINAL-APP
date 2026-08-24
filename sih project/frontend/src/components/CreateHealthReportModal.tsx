import React, { useState } from 'react';
import { X, FileText, AlertTriangle, ShieldCheck, Plus, Trash2, Send, Activity, Stethoscope, Sparkles } from 'lucide-react';
import { api, AreaSummary } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface CreateHealthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: AreaSummary[];
  onReportCreated: () => void;
}

const PRESET_SIGNALS = [
  'Fever Cluster Surge (+55%)',
  'OTC Antipyretic / Paracetamol Demand (+60%)',
  'Vector Larval Density High (Breteau Index >35)',
  'Water Sample Coliform / Turbidity Detected',
  'Acute GI / Diarrhea Symptoms (+40%)',
  'Upper Respiratory Infection Spike (+35%)',
];

const PRESET_RECOMMENDATIONS = [
  'Deploy municipal chemical vector fogging in priority blocks immediately',
  'Establish 24/7 fever triage desk and rapid test booth at local UPHC',
  'Issue immediate boiling water advisory and distribute halogen/chlorine tablets',
  'Distribute free ORS and antipyretics via ASHA and community mobile health workers',
  'Conduct door-to-door syndromic survey across 50 contiguous households',
];

export const CreateHealthReportModal: React.FC<CreateHealthReportModalProps> = ({
  isOpen,
  onClose,
  areas,
  onReportCreated,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedAreaId, setSelectedAreaId] = useState<number>(
    areas.length > 0 ? parseInt(areas[0].id.replace('area-', '')) || 1 : 1
  );
  const [reportTitle, setReportTitle] = useState<string>('Field Directive: Surveillance Assessment & Preventive Protocol');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'Door-to-door sentinel survey across households revealed clustered febrile illness with joint pain. Localized pharmacy retail OTC purchases indicate elevated syndromic demand.'
  );

  // Selected signals
  const [selectedSignals, setSelectedSignals] = useState<string[]>([
    'Fever Cluster Surge (+55%)',
    'OTC Antipyretic / Paracetamol Demand (+60%)',
  ]);
  const [customSignal, setCustomSignal] = useState<string>('');

  // Selected recommendations
  const [recommendations, setRecommendations] = useState<string[]>([
    'Deploy municipal chemical vector fogging in priority blocks immediately',
    'Establish 24/7 fever triage desk and rapid test booth at local UPHC',
  ]);
  const [customRec, setCustomRec] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleSignal = (sig: string) => {
    setSelectedSignals((prev) =>
      prev.includes(sig) ? prev.filter((s) => s !== sig) : [...prev, sig]
    );
  };

  const addCustomSignal = () => {
    if (customSignal.trim() && !selectedSignals.includes(customSignal.trim())) {
      setSelectedSignals([...selectedSignals, customSignal.trim()]);
      setCustomSignal('');
    }
  };

  const removeSignal = (sig: string) => {
    setSelectedSignals(selectedSignals.filter((s) => s !== sig));
  };

  const toggleRecommendation = (rec: string) => {
    setRecommendations((prev) =>
      prev.includes(rec) ? prev.filter((r) => r !== rec) : [...prev, rec]
    );
  };

  const addCustomRec = () => {
    if (customRec.trim() && !recommendations.includes(customRec.trim())) {
      setRecommendations([...recommendations, customRec.trim()]);
      setCustomRec('');
    }
  };

  const removeRec = (rec: string) => {
    setRecommendations(recommendations.filter((r) => r !== rec));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) {
      showToast('error', 'Validation Error', 'Please enter a report title.');
      return;
    }
    if (selectedSignals.length === 0) {
      showToast('error', 'Validation Error', 'Please record at least one observed health signal.');
      return;
    }
    if (recommendations.length === 0) {
      showToast('error', 'Validation Error', 'Please specify at least one actionable recommendation.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createHealthReport({
        area_id: selectedAreaId,
        report_title: reportTitle.trim(),
        observed_signals: selectedSignals,
        risk_level: riskLevel,
        clinical_notes: clinicalNotes.trim(),
        recommendations: recommendations,
        officer_name: user?.full_name || 'Dr. Priya Das',
        officer_designation: user?.role === 'ADMIN' ? 'Chief Medical Administrator' : 'District Health Official',
        is_public: true,
      });

      showToast(
        'success',
        'Official Health Report Published',
        `Report successfully published to MEDISENTINEL dashboard.`
      );
      onReportCreated();
      onClose();
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message || 'Could not publish health report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                File Official Ward Health Report
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-bold">
                  Authorized Officer Protocol
                </span>
              </h2>
              <p className="text-xs text-slate-400">Record field signals, assign clinical risk & issue public directives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Row 1: Target Area & Risk Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Ward / Monitored Area *
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              >
                {areas.map((area) => {
                  const numId = parseInt(area.id.replace('area-', '')) || 1;
                  return (
                    <option key={area.id} value={numId}>
                      {area.name} ({area.district})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Assigned Clinical Risk Level *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setRiskLevel(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      riskLevel === lvl
                        ? lvl === 'HIGH'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10'
                          : lvl === 'MEDIUM'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Report Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Official Report Title / Surveillance Directive *
            </label>
            <input
              type="text"
              required
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g. Field Directive: Vector Surveillance & Screening at Saheed Nagar"
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Row 3: Observed Health Signals */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Observed Health Signals & Field Data *
            </label>
            <p className="text-[11px] text-slate-400">Click quick signals or type custom telemetry observations</p>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_SIGNALS.map((sig) => {
                const active = selectedSignals.includes(sig);
                return (
                  <button
                    type="button"
                    key={sig}
                    onClick={() => toggleSignal(sig)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                      active
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {sig}
                  </button>
                );
              })}
            </div>

            {/* Active Selected Signals List */}
            {selectedSignals.length > 0 && (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Recorded Signals ({selectedSignals.length}):</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSignals.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-950/60 border border-blue-500/30 text-blue-200 rounded-md"
                    >
                      <Activity className="w-3 h-3 text-blue-400" />
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSignal(s)}
                        className="text-slate-400 hover:text-rose-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add Custom Signal */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSignal}
                onChange={(e) => setCustomSignal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSignal();
                  }
                }}
                placeholder="Or type custom observed signal & press Enter..."
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addCustomSignal}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Add Signal
              </button>
            </div>
          </div>

          {/* Row 4: Clinical Notes & Assessment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Doctor's Clinical Notes & Sentinel Assessment
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter epidemiological findings, syndromic pattern, or lab verification notes..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Row 5: Actionable Recommendations */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Official Directives & Actionable Recommendations *
            </label>
            <p className="text-[11px] text-slate-400">Select standard SOP actions or write custom medical recommendations</p>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_RECOMMENDATIONS.map((rec) => {
                const active = recommendations.includes(rec);
                return (
                  <button
                    type="button"
                    key={rec}
                    onClick={() => toggleRecommendation(rec)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition-colors ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {rec}
                  </button>
                );
              })}
            </div>

            {/* Active Selected Recommendations List */}
            {recommendations.length > 0 && (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Directives ({recommendations.length}):</span>
                <ul className="space-y-1">
                  {recommendations.map((r, idx) => (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-2 text-xs text-slate-200 bg-slate-800/40 p-2 rounded-lg border border-slate-800"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        {r}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRec(r)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add Custom Recommendation */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customRec}
                onChange={(e) => setCustomRec(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomRec();
                  }
                }}
                placeholder="Or write custom recommendation directive & press Enter..."
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addCustomRec}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Add Directive
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Published directly to Live Dashboard Feed
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Publishing Report...' : 'Publish Official Report'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
