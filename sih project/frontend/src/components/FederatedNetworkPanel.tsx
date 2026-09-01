import React, { useState } from 'react';
import { Network, ShieldCheck, Database, Activity, RefreshCw, Send, Loader2 } from 'lucide-react';
import { FederatedNode, federatedApi } from '../services/federatedApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface Props { nodes: FederatedNode[]; onRefresh: () => void; onSimulate: () => void; loading?: boolean; simulating?: boolean; lastRound?: { generated_alerts: number; signals_ingested: number; areas_assessed: number } | null; }

export const FederatedNetworkPanel: React.FC<Props> = ({ nodes, onRefresh, onSimulate, loading, simulating, lastRound }) => {
  const { user, isAdmin, isHealthOfficial } = useAuth();
  const { showToast } = useToast();
  const [nodeId, setNodeId] = useState('NODE-001');
  const [areaName, setAreaName] = useState('Saheed Nagar Ward 29');
  const [district, setDistrict] = useState('Khordha');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [medicine, setMedicine] = useState('120');
  const [fever, setFever] = useState('80');
  const [clinic, setClinic] = useState('60');
  const [respiratory, setRespiratory] = useState('25');
  const [gi, setGi] = useState('12');
  const [water, setWater] = useState('10');
  const [epsilon, setEpsilon] = useState('2');
  const [sending, setSending] = useState(false);
  const connected = nodes.filter((n) => n.status === 'CONNECTED').length;
  const canSubmit = !!user && (isAdmin || isHealthOfficial);

  const submitLocal = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      const result = await federatedApi.processLocal({
        node_id: nodeId, area_name: areaName.trim(), district: district.trim() || 'Odisha', observed_on: date,
        epsilon: Number(epsilon) || 2,
        signals: {
          medicine_demand: Number(medicine) || 0, fever_cases: Number(fever) || 0, clinic_visits: Number(clinic) || 0,
          respiratory_symptoms: Number(respiratory) || 0, gi_symptoms: Number(gi) || 0, water_quality: Number(water) || 0,
        },
      });
      showToast('success', 'Local Node Processed', `Protected signals sent to central server. Risk ${result.risk_score == null ? 'pending' : `${Math.round(result.risk_score)}/100`}.`);
      onRefresh();
      window.dispatchEvent(new CustomEvent('medisentinel:dashboard-refresh'));
    } catch (error: any) {
      showToast('error', 'Local Submission Failed', error.message || 'Unable to process federated node data.');
    } finally { setSending(false); }
  };

  const field = (label: string, value: string, setValue: (v: string) => void) => (
    <label className="block"><span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{label}</span><input type="number" min="0" step="any" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500" /></label>
  );

  return (
    <section className="glass-panel rounded-2xl border border-emerald-500/20 overflow-hidden">
      <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><div className="flex items-center gap-2"><Network className="w-5 h-5 text-emerald-400" /><h3 className="text-sm font-black text-white uppercase tracking-wider">Federated Health Network</h3><span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">PRIVACY-FIRST</span></div><p className="text-xs text-slate-400 mt-1">Local processing • differential privacy • aggregated signals only</p></div>
        <div className="flex gap-2"><button onClick={onRefresh} disabled={loading || simulating} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button><button onClick={onSimulate} disabled={simulating} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {simulating ? 'Processing…' : 'Run Federated Round'}</button></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800/60"><div className="bg-slate-950/60 p-3"><div className="text-[10px] text-slate-500 uppercase">Connected Nodes</div><div className="text-xl font-black text-emerald-400 mt-1">{connected}/{nodes.length}</div></div><div className="bg-slate-950/60 p-3"><div className="text-[10px] text-slate-500 uppercase">Raw Records Shared</div><div className="text-xl font-black text-white mt-1">0</div></div><div className="bg-slate-950/60 p-3"><div className="text-[10px] text-slate-500 uppercase">Privacy</div><div className="text-sm font-black text-emerald-400 mt-2">DIFFERENTIAL</div></div><div className="bg-slate-950/60 p-3"><div className="text-[10px] text-slate-500 uppercase">Risk Engine</div><div className="text-sm font-black text-cyan-400 mt-2">{lastRound ? 'EXECUTED' : 'READY'}</div></div></div>

      {canSubmit && <form onSubmit={submitLocal} className="p-4 border-b border-slate-800/70 bg-cyan-500/[0.03] space-y-3">
        <div className="flex items-center justify-between gap-3"><div><h4 className="text-xs font-black text-white uppercase tracking-wider">Health Official — Local Node Input</h4><p className="text-[10px] text-slate-500 mt-0.5">Enter aggregated/simulated telemetry. Individual patient records are not submitted.</p></div><div className="text-[9px] font-bold text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> RAW DATA PROTECTED</div></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"><label className="block"><span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Node</span><select value={nodeId} onChange={(e) => setNodeId(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500">{nodes.map((node) => <option key={node.node_id} value={node.node_id}>{node.name}</option>)}</select></label><label className="block"><span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Area / Ward</span><input value={areaName} onChange={(e) => setAreaName(e.target.value)} required className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500" /></label><label className="block"><span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">District</span><input value={district} onChange={(e) => setDistrict(e.target.value)} required className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500" /></label></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"><label className="block"><span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500" /></label>{field('Medicine Demand', medicine, setMedicine)}{field('Fever Cases', fever, setFever)}{field('Clinic Visits', clinic, setClinic)}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">{field('Respiratory', respiratory, setRespiratory)}{field('GI Symptoms', gi, setGi)}{field('Water Quality', water, setWater)}{field('Privacy ε', epsilon, setEpsilon)}</div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"><p className="text-[9px] text-slate-500">Local processing → differential privacy → protected aggregate → central risk engine.</p><button type="submit" disabled={sending || !areaName.trim()} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[10px] font-bold">{sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}{sending ? 'Processing Locally…' : 'Process & Send Protected Data'}</button></div>
      </form>}

      <div className="divide-y divide-slate-800/70">{loading ? <div className="p-5 text-xs text-slate-500">Loading federated nodes…</div> : nodes.map((node) => <div key={node.node_id} className="p-3.5 flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><span className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-400 shadow-lg shadow-emerald-400/40" /><div className="min-w-0"><div className="text-xs font-bold text-slate-200 truncate">{node.name}</div><div className="text-[10px] text-slate-500">{node.type} • {node.location} • {node.node_id}</div></div></div><div className="flex items-center gap-3 shrink-0 text-[10px]"><span className="hidden sm:flex items-center gap-1 text-slate-500"><Database className="w-3 h-3" /> {node.signals_sent} signals</span><span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="w-3 h-3" /> No raw data</span></div></div>)}</div>
      {lastRound && <div className="px-4 py-3 bg-emerald-500/5 text-[10px] text-emerald-300">Last round: {lastRound.areas_assessed} areas assessed • {lastRound.signals_ingested} noisy signals ingested • {lastRound.generated_alerts} alerts generated.</div>}
    </section>
  );
};
