import React from 'react';

const BADGE_STYLES = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-300',
  HIGH: 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse',
};

export default function RiskBadge({ level = 'LOW', showDot = true }) {
  const normalized = level.toUpperCase();
  const style = BADGE_STYLES[normalized] || BADGE_STYLES.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            normalized === 'HIGH'
              ? 'bg-rose-500'
              : normalized === 'MEDIUM'
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
        />
      )}
      {normalized} RISK
    </span>
  );
}