import React, { useState } from 'react';
import { Building2, Send, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';
const NODES = [
  { id: 'NODE-001', name: 'SCB Medical Node' },
  { id: 'NODE-002', name: 'Campus Clinic Node' },
  { id: 'NODE-003', name: 'District Clinic Node' },
  { id: 'NODE-004', name: 'Water & Environment Node' },
];

export const FederatedDataEntry: React.FC = () => {
  const { user, isAdmin, isHealthOfficial } = useAuth();
  const { showToast } = useToast();
  const [nodeId, setNodeId] = useState('NODE-001');
  const [areaName, setAreaName] = useState('Saheed Nagar Ward 29');
  const [district, setDistrict] = useState('Khordha');
  const [observedOn, setObservedOn] = useState(new Date().toISOString().slice(0, 10));
  const [medicine, setMedicine] = useState('120');
  const [fever, setFever] = useState('80');
  const [clinic, setClinic] = useState('60');
  const [respiratory, setRespiratory] = useState('25');
  const [gi, setGi] = useState('12');
  const [water, setWater] = useState('10');
  const [epsilon, setEpsilon] = useState('2');
  const [submitting, setSubmitting] = useState(false);

  if (!user || (!isAdmin && !isHealthOfficial)) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('sih_auth_token');
      const response = await fetch(`${API_BASE}/api/federated/process-local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          node_id: nodeId,
          area_name: areaName.trim(),
          district: district.trim() || 'Odisha',
          observed_on: observedOn,
          epsilon: Number(epsilon) || 2,
          signals: {
            medicine_demand: Number(medicine) || 0,
            fever_cases: Number(fever) || 0,
            clinic_visits: Number(clinic) || 0,
            respiratory_symptoms: Number(respiratory) || 0,
            gi_symptoms: Number(gi) || 0,
            water_quality: Number(water) || 0,
          },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || 'Federated submission failed');
      showToast('success', 'Federated Data Processed', `Local data protected and sent to central server.${body.risk_score != null ? ` Risk: ${Math.round(body.risk_score)}/100.` : ''}`);
      window.dispatchEvent(new Event('medisentinel:federated-submitted'));
    } catch (error: any) {
      showToast('error', 'Federated Submission Failed', error.message || 'Could not process local node data.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label: string, value: string, setValue: (value: string) => void) => (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <input value={value} onChange={(e) => setValue(e.target.value)} type="number" min="0" step="any" className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" />
    </label>
  );

  return (
    <section className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400"><Building2 className="w-5 h-5" /></div><div><h3 className="text-sm font-black text-white uppercase tracking-wider">Local Node Data Entry</h3><p className="text-[11px] text-slate-400 mt-0.5">Health Official prototype input • aggregate data only</p></div></div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-emerald-400"><ShieldCheck className="w-4 h-4" /> RAW RECORDS STAY LOCAL</div>
      </div>
      <form onSubmit={submit} className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Federated Node</span><select value={nodeId} onChange={(e) => setNodeId(e.target.value)} className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500">{NODES.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select></label>
          <label className="block"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Area / Ward</span><input value={areaName} onChange={(e) => setAreaName(e.target.value)} required className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" /></label>
          <label className="block"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">District</span><input value={district} onChange={(e) => setDistrict(e.target.value)} required className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" /></label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="block"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Observation Date</span><input value={observedOn} onChange={(e) => setObservedOn(e.target.value)} type="date" required className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" /></label>
          {field('Medicine Demand', medicine, setMedicine)}{field('Fever Cases', fever, setFever)}{field('Clinic Visits', clinic, setClinic)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {field('Respiratory', respiratory, setRespiratory)}{field('GI Symptoms', gi, setGi)}{field('Water Quality', water, setWater)}{field('Privacy ε', epsilon, setEpsilon)}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <p className="text-[10px] text-slate-500 max-w-2xl">These values represent aggregated local-node telemetry. Differential privacy is applied before protected signals are stored centrally and passed to the risk engine.</p>
          <button type="submit" disabled={submitting || !areaName.trim()} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950/30">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{submitting ? 'Processing Locally…' : 'Process & Send Protected Data'}</button>
        </div>
      </form>
    </section>
  );
};
