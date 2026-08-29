import React from 'react';
import { Calendar } from 'lucide-react';

interface TimeRangeSelectorProps {
  selectedRange: number;
  onSelectRange: (days: number) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onSelectRange,
}) => {
  const ranges = [
    { label: '7 Days', days: 7, desc: 'Immediate Surge' },
    { label: '30 Days', days: 30, desc: 'Monthly Baseline' },
    { label: '90 Days', days: 90, desc: 'Seasonal Trend' },
  ];

  return (
    <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 text-xs font-semibold text-slate-400">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <span>Time Range:</span>
      </div>
      <div className="flex items-center gap-1">
        {ranges.map((r) => (
          <button
            key={r.days}
            onClick={() => onSelectRange(r.days)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedRange === r.days
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
};

