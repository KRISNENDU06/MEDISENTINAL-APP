import React, { useMemo, useState } from 'react';
import { Activity, CheckCircle2, MapPin, Play, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { ODISHA_ALL_DISTRICTS } from '../constants/odishaDistricts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const JuryDemoPanel: React.FC = () => {
  const { user, isAdmin, isHealthOfficial } = useAuth();
  const { showToast } = useToast();
  const districtEntries = useMemo(() => Object.entries(ODISHA_ALL_DISTRICTS), []);
  const [districtKey, setDistrictKey] = useState(districtEntries[0]?.[0] || '');
  const [wardIndex, setWardIndex] = useState(0);
  const [medicine, setMedicine] = useState('180');
  const [fever, setFever] = useState('140');
  const [water, setWater] = useState('12');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const district = ODISHA_ALL_DISTRICTS[districtKey];
  const wards = district?.subLocations || [];
  const ward = wards[wardIndex] || wards[0];

  if (!user || (!isAdmin && !isHealthOfficial)) return null;

  const selectDistrict = (key: string) => {
    setDistrictKey(key);
    setWardIndex(0);
    setLastResult(null);
  };

  const resetSignals = () => {
    setMedicine('180');
    setFever('140');
    setWater('12');
    setLastResult(null);
  };

  const runDemo = async () => {
    if (!district || !ward) return;
    setSubmitting(true);
    try {
      const result = await api.createMultiSignalObservation(
        {
          area_name: ward.name,
          district: district.district,
          latitude: ward.lat,
          longitude: ward.lng,
          observed_on: new Date().toISOString().slice(0, 10),
          medicine_demand: Number(medicine) || 0,
          fever_cases: Number(fever) || 0,
          water_quality: Number(water) || 0,
          pharmacy_source: 'Jury Demo • Pharmacy Telemetry',
          hospital_source: 'Jury Demo • Syndromic Health Telemetry',
          water_source: 'Jury Demo • Water Quality Telemetry',
          data_quality_score: 0.95,
        },
        true
      );
      setLastResult(result);
      showToast('success', 'Jury Demo Completed', `${district.district} • ${ward.name} was ingested and the risk engine was updated.`);
      window.dispatchEvent(new CustomEvent('medisentinel:dashboard-refresh'));
    } catch (error: any) {
      showToast('error', 'Jury Demo Failed', error.message || 'Could not run the demonstration scenario.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass-panel rounded-3xl border border-amber-500/30 overflow-hidden shadow-xl shadow-amber-950/10">
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-amber-950/30 via-slate-950/50 to-purple-950/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30"><Sparkles className="w-5 h-5" /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">Jury Demonstration Panel</h3>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">LIVE DEMO</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">{districtEntries.length} DISTRICTS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Choose any district and ward, change the surveillance signals, and demonstrate the real ingestion → risk → alert pipeline.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400"><ShieldCheck className="w-4 h-4" /> ADMIN / HEALTH OFFICIAL CONTROL</div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">District ({districtEntries.length} available)</span>
            <select value={districtKey} onChange={(e) => selectDistrict(e.target.value)} className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500">
              {districtEntries.map(([key, item]) => <option key={key} value={key}>{item.district}{key !== item.district ? ` — ${key}` : ''}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ward / Demonstration Location ({wards.length} available)</span>
            <select value={wardIndex} onChange={(e) => setWardIndex(Number(e.target.value))} className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500">
              {wards.map((item, index) => <option key={`${item.name}-${index}`} value={index}>{item.name}</option>)}
            </select>
          </label>
        </div>

        {ward && (
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0"><MapPin className="w-4 h-4 text-amber-400 shrink-0" /><span className="text-xs font-semibold text-slate-200 truncate">{ward.name}</span></div>
            <span className="text-[10px] font-mono text-slate-500">{ward.lat.toFixed(4)}, {ward.lng.toFixed(4)}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Medicine Demand</span><input type="number" min="0" value={medicine} onChange={(e) => setMedicine(e.target.value)} className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500" /></label>
          <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fever Cases</span><input type="number" min="0" value={fever} onChange={(e) => setFever(e.target.value)} className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500" /></label>
          <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Water Quality</span><input type="number" min="0" value={water} onChange={(e) => setWater(e.target.value)} className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500" /></label>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <button type="button" onClick={resetSignals} disabled={submitting} className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 disabled:opacity-50"><RotateCcw className="w-3.5 h-3.5" /> Reset Scenario</button>
          <button type="button" onClick={runDemo} disabled={submitting || !ward} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white text-xs font-black shadow-lg disabled:opacity-50"><Play className="w-3.5 h-3.5" /> {submitting ? 'RUNNING LIVE PIPELINE…' : 'RUN JURY DEMO'}</button>
        </div>

        {lastResult && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-black uppercase tracking-wider"><CheckCircle2 className="w-4 h-4" /> Changes Applied Successfully</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div><div className="text-[9px] text-slate-500 uppercase">District</div><div className="text-xs font-bold text-white mt-1">{district.district}</div></div>
              <div><div className="text-[9px] text-slate-500 uppercase">Ward</div><div className="text-xs font-bold text-white mt-1 truncate">{ward.name}</div></div>
              <div><div className="text-[9px] text-slate-500 uppercase">Risk Score</div><div className="text-sm font-black text-amber-300 mt-0.5">{lastResult.assessment?.risk_score ?? 'UPDATED'}/100</div></div>
              <div><div className="text-[9px] text-slate-500 uppercase">Pipeline</div><div className="text-xs font-black text-emerald-300 mt-1 flex items-center gap-1"><Activity className="w-3 h-3" /> RISK ENGINE UPDATED</div></div>
            </div>
            <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> The selected ward is now part of the dashboard's latest surveillance state.</div>
          </div>
        )}
      </div>
    </section>
  );
};
