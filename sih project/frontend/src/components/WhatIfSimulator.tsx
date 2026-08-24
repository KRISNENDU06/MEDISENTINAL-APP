import React, { useState, useEffect } from 'react';
import { api, WhatIfResult } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Sliders,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Activity,
  Bug,
  Calculator,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const WhatIfSimulator: React.FC = () => {
  const { showToast } = useToast();

  // Slider State (Requirement 7)
  const [medicineSpike, setMedicineSpike] = useState<number>(35);
  const [feverSpike, setFeverSpike] = useState<number>(25);
  const [clinicSpike, setClinicSpike] = useState<number>(20);
  const [spreadNeighbors, setSpreadNeighbors] = useState<number>(2);
  const [persistenceWeeks, setPersistenceWeeks] = useState<number>(2);
  const [archetype, setArchetype] = useState<string>('DENGUE');
  const [intervention, setIntervention] = useState<string>('NONE');

  // Simulation Result State
  const [simResult, setSimResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Recalculate whenever any slider changes (Instant reactive simulation!)
  useEffect(() => {
    let active = true;

    const runSim = async () => {
      setLoading(true);
      try {
        const res = await api.runWhatIf({
          medicineDemandSpike: medicineSpike,
          feverCasesSpike: feverSpike,
          clinicVisitsSpike: clinicSpike,
          geographicSpread: spreadNeighbors,
          persistenceWeeks,
          archetype,
          intervention,
        });
        if (active) {
          setSimResult(res);
        }
      } catch (err: any) {
        console.error('What-if calculation error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(runSim, 100);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [medicineSpike, feverSpike, clinicSpike, spreadNeighbors, persistenceWeeks, archetype, intervention]);

  const handleReset = () => {
    setMedicineSpike(0);
    setFeverSpike(0);
    setClinicSpike(0);
    setSpreadNeighbors(0);
    setPersistenceWeeks(1);
    setArchetype('DENGUE');
    setIntervention('NONE');
    showToast('info', 'Simulator Reset', 'All outbreak surge parameters reset to baseline.');
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'HIGH':
        return 'text-rose-400 border-rose-500/40 bg-rose-950/30';
      case 'MEDIUM':
        return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
      default:
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Sliders className="w-5 h-5" />
              </div>
              Outbreak Science & What-If Action Lab
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-bold uppercase tracking-wider">
              Educational Simulation
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test how community hygiene, vector fogging, and clean water flatten the transmission curve in real-time
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-850 hover:bg-slate-800 border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sliders</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders Control Panel (Requirement 7) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Disease Archetype & Intervention Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Disease Archetype</label>
              <select
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="DENGUE">Vector-Borne (Dengue / Chikungunya)</option>
                <option value="INFLUENZA">Viral Respiratory (Influenza)</option>
                <option value="CHOLERA">Waterborne (Cholera / Diarrhea)</option>
                <option value="PATHOGEN_X">Emerging Novel Pathogen X</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Intervention Protocol</label>
              <select
                value={intervention}
                onChange={(e) => setIntervention(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="NONE">No Active Intervention</option>
                <option value="FOGGING">Vector Fumigation (-35% Spread)</option>
                <option value="CONTAINMENT">Micro-Containment (-65% Spread)</option>
                <option value="PROPHYLAXIS">Targeted Prophylaxis (-50% Spread)</option>
              </select>
            </div>
          </div>

          {/* Slider 1: Medicine Demand +% */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-400" />
                Medicine Demand Spike
              </span>
              <span className="text-xs font-mono font-bold text-brand-400 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                {medicineSpike > 0 ? `+${medicineSpike}%` : `${medicineSpike}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="150"
              step="5"
              value={medicineSpike}
              onChange={(e) => setMedicineSpike(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-20% (Sub-baseline)</span>
              <span>+65% (Early Anomaly)</span>
              <span>+150% (Acute Surge)</span>
            </div>
          </div>

          {/* Slider 2: Fever Cases +% */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Fever Cases Spike
              </span>
              <span className="text-xs font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                {feverSpike > 0 ? `+${feverSpike}%` : `${feverSpike}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="150"
              step="5"
              value={feverSpike}
              onChange={(e) => setFeverSpike(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-20%</span>
              <span>+50% (Threshold Alert)</span>
              <span>+150%</span>
            </div>
          </div>

          {/* Slider 3: Clinic Visits +% */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Clinic Visits Spike
              </span>
              <span className="text-xs font-mono font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                {clinicSpike > 0 ? `+${clinicSpike}%` : `${clinicSpike}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="120"
              step="5"
              value={clinicSpike}
              onChange={(e) => setClinicSpike(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-20%</span>
              <span>+40%</span>
              <span>+120%</span>
            </div>
          </div>

          {/* Slider 4: Geographic Spread */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Geographic Spread (Neighbor Wards)
              </span>
              <span className="text-xs font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                {spreadNeighbors} of 4 Wards Elevated
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={spreadNeighbors}
              onChange={(e) => setSpreadNeighbors(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 (Isolated)</span>
              <span>2 (Cluster)</span>
              <span>4 (Regional Outbreak)</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Output & Visual Gauge */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
          {/* Simulated Score Gauge Card */}
          <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              Simulated Composite Risk Outcome
            </div>

            <div className="my-3 flex items-baseline justify-center gap-3">
              <span className="text-5xl font-black text-white tracking-tighter">
                {simResult ? simResult.riskScore : '--'}
              </span>
              <span className="text-lg text-slate-500 font-bold">/100</span>
            </div>

            {simResult && (
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1 rounded-full text-xs font-extrabold border ${getRiskColor(simResult.riskLevel)}`}>
                  {simResult.riskLevel} SEVERITY
                </span>
                <span className="text-xs text-slate-400">
                  Effective <strong className="text-white font-mono">Rt: {simResult.effectiveRt}</strong>
                </span>
              </div>
            )}

            {/* Explainable simulation result preview */}
            <p className="text-xs text-slate-300 mt-4 max-w-md font-medium leading-relaxed">
              {simResult ? simResult.explanation : 'Adjust sliders to preview early risk diagnosis.'}
            </p>
          </div>

          {/* 6-Week Projected Trajectory Chart */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
                Projected Trajectory Curve (6 Weeks)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">SEIR + Spatial Attenuation</span>
            </div>

            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simResult?.timeline || []} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="medicine"
                    name="Simulated Meds"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fever"
                    name="Simulated Fever"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    name="Simulated Risk"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

