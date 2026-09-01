import React, { useEffect, useState } from 'react';
import { DashboardSummary } from '../services/api';
import { ShieldAlert, MapPin, Database, Gauge } from 'lucide-react';
import { FederatedNetworkPanel } from './FederatedNetworkPanel';
import { JuryDemoPanel } from './JuryDemoPanel';
import { federatedApi, FederatedNode } from '../services/federatedApi';
import { useToast } from '../context/ToastContext';

interface MetricCardsProps { summary: DashboardSummary | null; loading: boolean; }

export const MetricCards: React.FC<MetricCardsProps> = ({ summary, loading }) => {
  const { showToast } = useToast();
  const [nodes, setNodes] = useState<FederatedNode[]>([]);
  const [federatedLoading, setFederatedLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [lastRound, setLastRound] = useState<{ generated_alerts: number; signals_ingested: number; areas_assessed: number } | null>(null);

  const loadFederatedNodes = async () => {
    try { const result = await federatedApi.getNodes(); setNodes(result.nodes); }
    catch (error) { console.warn('Federated nodes unavailable:', error); }
    finally { setFederatedLoading(false); }
  };

  useEffect(() => { loadFederatedNodes(); }, []);

  const runFederatedRound = async () => {
    setSimulating(true);
    try {
      const result = await federatedApi.runRound();
      setLastRound({ generated_alerts: result.generated_alerts, signals_ingested: result.signals_ingested, areas_assessed: result.areas_assessed });
      await loadFederatedNodes();
      showToast('success', 'Federated Round Complete', `${result.nodes_processed} nodes processed and ${result.signals_ingested} privacy-preserving signals ingested.`);
      window.dispatchEvent(new CustomEvent('medisentinel:dashboard-refresh'));
    } catch (error: any) {
      showToast('error', 'Federated Round Failed', error.message || 'Unable to execute federated round.');
    } finally { setSimulating(false); }
  };

  const getRiskColor = (level?: string) => { switch (level) { case 'HIGH': return 'text-rose-400 border-rose-500/30 bg-rose-950/20'; case 'MEDIUM': return 'text-amber-400 border-amber-500/30 bg-amber-950/20'; default: return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'; } };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-all"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Health Risk</span><Gauge className="w-4 h-4 text-brand-400" /></div><div className="mt-3 flex items-baseline gap-2.5"><span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{loading || !summary ? '--' : `${summary.overall_risk_score}/100`}</span>{summary && <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${getRiskColor(summary.overall_risk_level)}`}>{summary.overall_risk_level} RISK</span>}</div><p className="text-[11px] text-slate-400 mt-2">Avg Confidence: <span className="text-slate-200 font-medium">{summary ? `${summary.average_confidence}%` : '--'}</span></p></div>
        <div className="glass-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-all"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Alerts</span><ShieldAlert className="w-4 h-4 text-rose-400" /></div><div className="mt-3 flex items-baseline gap-2"><span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{loading || !summary ? '--' : summary.active_alerts}</span>{summary && summary.active_alerts > 0 && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />Action Needed</span>}</div><p className="text-[11px] text-slate-400 mt-2">{summary ? `${summary.high_risk_areas} High • ${summary.medium_risk_areas} Medium` : 'Loading...'}</p></div>
        <div className="glass-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-all"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monitored Wards</span><MapPin className="w-4 h-4 text-sky-400" /></div><div className="mt-3 flex items-baseline gap-2"><span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{loading || !summary ? '--' : summary.areas_monitored}</span><span className="text-xs text-slate-400 font-medium">Odisha Pilot</span></div><p className="text-[11px] text-slate-400 mt-2">{summary ? `${summary.low_risk_areas} Safe Zones (${Math.round((summary.low_risk_areas / (summary.areas_monitored || 1)) * 100)}%)` : '--'}</p></div>
        <div className="glass-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-all"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signals Processed</span><Database className="w-4 h-4 text-purple-400" /></div><div className="mt-3 flex items-baseline gap-2"><span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{loading || !summary ? '--' : summary.signals_processed.toLocaleString()}</span><span className="text-xs text-emerald-400 font-medium">Daily Ingestion</span></div><p className="text-[11px] text-slate-400 mt-2">Pharmacies, Clinics & Labs</p></div>
      </div>
      <div className="mt-4"><FederatedNetworkPanel nodes={nodes} loading={federatedLoading} onRefresh={loadFederatedNodes} onSimulate={runFederatedRound} simulating={simulating} lastRound={lastRound} /></div>
      <div className="mt-4"><JuryDemoPanel /></div>
    </>
  );
};
