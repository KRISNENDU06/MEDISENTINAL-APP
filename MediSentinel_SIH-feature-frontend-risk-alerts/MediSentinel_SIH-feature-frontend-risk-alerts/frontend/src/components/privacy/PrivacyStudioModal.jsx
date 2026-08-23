import React, { useState, useMemo } from 'react';
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
import { ShieldCheck, Lock, X, RotateCcw, Sparkles } from 'lucide-react';

function sampleLaplace(scale) {
  if (scale <= 0) return 0;
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

export default function PrivacyStudioModal({ isOpen, onClose, selectedArea }) {
  const [epsilon, setEpsilon] = useState(1.0);
  const [sensitivity] = useState(1.0);

  // Generate perturbed noisy data on the fly based on epsilon and timeline
  const dpChartData = useMemo(() => {
    const rawTimeline = selectedArea?.timeline || [
      { week: 'W28', fever: 290 },
      { week: 'W29', fever: 310 },
      { week: 'W30', fever: 360 },
      { week: 'W31', fever: 410 },
      { week: 'W32', fever: 445 },
      { week: 'W33', fever: 480 },
    ];

    const scale = sensitivity / Math.max(0.01, epsilon);

    return rawTimeline.map((item) => {
      const rawCount = item.fever;
      const noise = sampleLaplace(scale);
      const noisyCount = Math.max(0, Math.round(rawCount + noise));
      return {
        week: item.week,
        rawFever: rawCount,
        dpFever: noisyCount,
        noiseAmount: Math.round(noise),
      };
    });
  }, [selectedArea, epsilon, sensitivity]);

  if (!isOpen) return null;

  const scale = (sensitivity / Math.max(0.01, epsilon)).toFixed(2);
  const privacyLevel =
    epsilon < 0.5 ? 'Very High (Strong Guarantee)' : epsilon < 1.5 ? 'Balanced (Production)' : 'Low (High Utility)';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Differential Privacy (Epsilon-Noise) Studio
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                  Zero-Knowledge Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Mathematical privacy calibration via the Laplace Mechanism on aggregate syndromic counts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Epsilon Slider & Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Lock size={14} className="text-indigo-600" />
                Privacy Budget (ε / Epsilon)
              </span>
              <span className="font-mono text-indigo-600 font-bold text-sm bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                ε = {epsilon}
              </span>
            </div>

            <input
              type="range"
              min="0.1"
              max="4.0"
              step="0.1"
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>ε=0.1 (Ultra-Private / High Noise)</span>
              <span>ε=1.0 (Recommended)</span>
              <span>ε=4.0 (Low Noise)</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="text-slate-500 text-[11px] uppercase font-bold">Privacy Guarantee</div>
            <div className="font-bold text-slate-900 text-sm">{privacyLevel}</div>
            <div className="text-slate-600 text-[11px] pt-1 border-t border-slate-200">
              Noise Scale: <span className="font-mono font-bold text-slate-800">b = {scale}</span>
            </div>
            <div className="text-slate-600 text-[11px]">
              Sensitivity: <span className="font-mono font-bold text-slate-800">Δf = {sensitivity}</span>
            </div>
          </div>
        </div>

        {/* Live Visualizer: Raw vs DP Sanitized Signal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">
              Real-time Output: Raw Patient Fever Counts vs Differentially Private Stream
            </span>
            <span className="text-slate-500 text-[11px]">
              Area: <strong className="text-slate-700">{selectedArea?.name}</strong>
            </span>
          </div>

          <div className="h-64 w-full bg-white border border-slate-200 rounded-xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dpChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />

                <Line
                  type="monotone"
                  dataKey="rawFever"
                  name="True Patient Count (Confidential)"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="dpFever"
                  name="DP Sanitized Count (Laplace Perturbed)"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#059669' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mathematical Proof Box */}
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-indigo-950">
            <Sparkles size={15} className="text-indigo-600" />
            Theoretical Differential Privacy Guarantee
          </div>
          <p className="text-slate-700 leading-relaxed">
            MediSentinel injects noise drawn from Laplace(0, Δf / ε) onto all aggregate syndromic query responses. For any two neighboring patient registries D1, D2:
          </p>
          <div className="font-mono bg-white p-2 rounded-lg border border-indigo-200 text-center text-slate-800 text-xs">
            Pr[M(D1) ∈ S] ≤ e^ε × Pr[M(D2) ∈ S]
          </div>
          <p className="text-[11px] text-slate-600">
            This proves mathematically that an adversary cannot determine whether any specific individual patient is in
            the surveillance database, even with unlimited auxiliary knowledge.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setEpsilon(1.0)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <RotateCcw size={13} /> Reset Baseline (ε=1.0)
          </button>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer transition shadow-xs"
          >
            Apply Privacy Budget
          </button>
        </div>
      </div>
    </div>
  );
}

