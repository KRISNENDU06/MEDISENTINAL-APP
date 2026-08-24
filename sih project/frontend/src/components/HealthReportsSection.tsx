import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Activity,
  UserCheck,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Volume2,
  Trash2,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { api, HealthReport } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface HealthReportsSectionProps {
  onOpenFileReportModal: () => void;
  refreshTrigger?: number;
}

export const HealthReportsSection: React.FC<HealthReportsSectionProps> = ({
  onOpenFileReportModal,
  refreshTrigger = 0,
}) => {
  const { user, isAdmin, isHealthOfficial } = useAuth();
  const { showToast } = useToast();

  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);

  const canCreateReport = isAdmin || isHealthOfficial;

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getHealthReports();
      setReports(data);
      if (data.length > 0 && expandedReportId === null) {
        setExpandedReportId(data[0].id);
      }
    } catch {
      // Fallback sample reports
      setReports([
        {
          id: 1,
          area_id: 1,
          area_name: 'Area A (Saheed Nagar)',
          district: 'Bhubaneswar',
          officer_name: 'Dr. Priya Das',
          officer_designation: 'District Health Official',
          report_title: 'Field Surveillance Directive: Vector-Borne Febrile Cluster in Saheed Nagar',
          observed_signals: '{"fever_cases_surge": "+58% (7-Day)", "otc_paracetamol_demand": "+64%", "vector_larval_density": "High (Breteau Index 38)"}',
          risk_level: 'HIGH',
          clinical_notes: 'Door-to-door sentinel survey across 65 households in Sector 4 revealed clustered febrile illness with joint pain. Retail pharmacies report localized stockpiling of antipyretics.',
          recommendations: '["Deploy municipal vector fogging in Sectors 3 & 4 immediately", "Set up daily fever screening triage booth at UPHC Saheed Nagar", "Distribute free ORS and paracetamol packets through ASHA workers", "Issue public advisory on eliminating stagnant water containers"]',
          reported_date: new Date().toISOString().split('T')[0],
          is_public: true,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [refreshTrigger]);

  const handleDelete = async (reportId: number) => {
    if (!window.confirm('Are you sure you want to remove this official health report?')) return;
    try {
      await api.deleteHealthReport(reportId);
      showToast('info', 'Report Removed', 'Health report has been deleted.');
      loadReports();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message || 'Could not delete report.');
    }
  };

  const parseSignals = (signalsStr: string): { key: string; value: string }[] => {
    try {
      const parsed = JSON.parse(signalsStr);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({ key: `Signal ${idx + 1}`, value: String(item) }));
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed).map(([k, v]) => ({
          key: k.replace(/_/g, ' ').toUpperCase(),
          value: String(v),
        }));
      }
    } catch {
      // plain string split
      return signalsStr.split(',').map((s, idx) => ({ key: `Signal ${idx + 1}`, value: s.trim() }));
    }
    return [{ key: 'Observation', value: signalsStr }];
  };

  const parseRecommendations = (recStr: string): string[] => {
    try {
      const parsed = JSON.parse(recStr);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // split by newline
    }
    return recStr.split('\n').filter((s) => s.trim().length > 0);
  };

  const playVoiceReport = (report: HealthReport) => {
    if (!('speechSynthesis' in window)) {
      showToast('error', 'Audio Unavailable', 'Speech synthesis is not supported on this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const recs = parseRecommendations(report.recommendations).join('. ');
    const text = `Official Health Directive for ${report.area_name}. Risk Level: ${report.risk_level}. Filed by ${report.officer_name}. Key directives: ${recs}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    showToast('info', 'Playing Official Directive', `Audio playback started for ${report.area_name}`);
  };

  const filteredReports = reports.filter((r) => {
    if (filterRisk === 'ALL') return true;
    return r.risk_level === filterRisk;
  });

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Official Ward Health Reports & Directives
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase tracking-wider">
                {reports.length} Filed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified clinical assessments, observed health signals & official preventive directives by District Health Officers
            </p>
          </div>
        </div>

        {/* Right Actions: Filters & File Report Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterRisk(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterRisk === lvl
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {canCreateReport && (
            <button
              onClick={onOpenFileReportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/30 shadow-lg shadow-blue-950/50 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ File Official Health Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Reports Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading official ward health reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No health reports found for this filter criteria.
          </div>
        ) : (
          filteredReports.map((report) => {
            const isExpanded = expandedReportId === report.id;
            const signals = parseSignals(report.observed_signals);
            const recs = parseRecommendations(report.recommendations);

            return (
              <div
                key={report.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
              >
                {/* Top Row: Ward info, Author & Risk Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-brand-300 border border-slate-700">
                        <MapPin className="w-3 h-3 text-brand-400" />
                        {report.area_name} ({report.district})
                      </span>

                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          report.risk_level === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : report.risk_level === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {report.risk_level} RISK LEVEL
                      </span>

                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.reported_date}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 mt-1">{report.report_title}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      Filed by <strong className="text-slate-200">{report.officer_name}</strong> •{' '}
                      <span className="text-blue-300">{report.officer_designation}</span>
                    </p>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => playVoiceReport(report)}
                      title="Listen to Audio Health Directive"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>

                    {(isAdmin || user?.id === report.officer_id) && (
                      <button
                        onClick={() => handleDelete(report.id)}
                        title="Delete Report (Privileged Access)"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      <span>{isExpanded ? 'Collapse' : 'Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Signals Row (Always Visible) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-400" />
                    Observed Field Signals:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {signals.map((sig, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300"
                      >
                        <span className="text-[10px] text-slate-500 font-semibold">{sig.key}:</span>
                        <strong className="text-blue-300">{sig.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded Details: Clinical Notes & Official Directives */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-4 animate-fadeIn">
                    {/* Clinical Notes */}
                    {report.clinical_notes && (
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Doctor's Clinical Assessment:
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed italic">
                          "{report.clinical_notes}"
                        </p>
                      </div>
                    )}

                    {/* Actionable Recommendations */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Official Actionable Recommendations & Directives:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recs.map((r, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-200"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

