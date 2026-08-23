import React from 'react';
import { Pill, Activity, Clock, MapPin } from 'lucide-react';

export default function FactorBreakdown({ factors, totalScore }) {
  const items = [
    {
      label: 'Medicine Demand Anomaly',
      score: factors.medicine,
      max: 30,
      icon: Pill,
      color: 'bg-blue-500',
    },
    {
      label: 'Health Indicators Anomaly',
      score: factors.healthIndicators,
      max: 30,
      icon: Activity,
      color: 'bg-teal-500',
    },
    {
      label: 'Persistence Weight',
      score: factors.persistence,
      max: 20,
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      label: 'Geographic Spread',
      score: factors.geographicSpread,
      max: 20,
      icon: MapPin,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Explainable Weight Attribution</h3>
          <p className="text-xs text-slate-500">Total Risk Contribution Breakdown</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-slate-900">{totalScore}</span>
          <span className="text-xs text-slate-500"> / 100</span>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon;
          const percentage = (item.score / item.max) * 100;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Icon size={14} className="text-slate-500" />
                  {item.label}
                </span>
                <span className="font-medium text-slate-800">
                  {item.score.toFixed(1)} <span className="text-slate-400">/ {item.max}</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                <div
                  className={`h-full ${item.color} transition-all duration-500`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}