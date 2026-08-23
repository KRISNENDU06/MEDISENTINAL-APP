import React from 'react';
import { Pill, Activity, Users, Radio } from 'lucide-react';

export default function SignalComparisonCard({ signals }) {
  const signalList = [
    {
      title: 'Medicine Demand',
      icon: Pill,
      current: signals.medicineDemand.current,
      baseline: signals.medicineDemand.baseline,
      deviation: signals.medicineDemand.deviation,
      isAnomaly: signals.medicineDemand.deviation.includes('+') && parseFloat(signals.medicineDemand.deviation) > 20,
    },
    {
      title: 'Fever & Respiratory',
      icon: Activity,
      current: signals.feverIndicators.current,
      baseline: signals.feverIndicators.baseline,
      deviation: signals.feverIndicators.deviation,
      isAnomaly: signals.feverIndicators.deviation.includes('+') && parseFloat(signals.feverIndicators.deviation) > 20,
    },
    {
      title: 'Primary Clinic Visits',
      icon: Users,
      current: signals.clinicVisits.current,
      baseline: signals.clinicVisits.baseline,
      deviation: signals.clinicVisits.deviation,
      isAnomaly: signals.clinicVisits.deviation.includes('+') && parseFloat(signals.clinicVisits.deviation) > 20,
    },
    {
      title: 'Geographic Spread',
      icon: Radio,
      current: `${signals.geographicSpread.affectedNeighbors}/${signals.geographicSpread.totalNeighbors}`,
      baseline: `0/${signals.geographicSpread.totalNeighbors}`,
      deviation: signals.geographicSpread.deviation,
      isAnomaly: parseFloat(signals.geographicSpread.deviation) > 30,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Independent Signal Cross-Validation</h3>
          <p className="text-xs text-slate-500">Current observation vs Historical Baseline</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {signalList.map((sig) => {
          const Icon = sig.icon;
          return (
            <div
              key={sig.title}
              className={`p-3 rounded-lg border transition-all ${
                sig.isAnomaly
                  ? 'bg-rose-50/60 border-rose-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  size={16}
                  className={sig.isAnomaly ? 'text-rose-600' : 'text-slate-500'}
                />
                <span
                  className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                    sig.isAnomaly
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {sig.deviation}
                </span>
              </div>
              <p className="text-xs text-slate-600 truncate">{sig.title}</p>
              <div className="mt-1">
                <span className="text-base font-bold text-slate-900">{sig.current}</span>
                <span className="text-xs text-slate-400 ml-1">/ {sig.baseline}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}