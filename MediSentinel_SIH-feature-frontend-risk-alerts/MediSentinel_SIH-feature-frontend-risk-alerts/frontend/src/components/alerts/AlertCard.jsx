import React from 'react';
import { useRisk } from '../../context/useRisk';
import {
  AlertTriangle,
  ShieldAlert,
  Send,
  CheckCircle2,
  Clock,
  Check,
} from 'lucide-react';
import RiskBadge from '../common/RiskBadge';

export default function AlertCard({ alert, onOpenResponseModal }) {
  const { updateAlert } = useRisk();
  const isHigh = alert.severity === 'HIGH';
  const isResolved = alert.status === 'RESOLVED';
  const isAcknowledged = alert.status === 'ACKNOWLEDGED' || alert.status === 'IN_INVESTIGATION';

  return (
    <div
      className={`border rounded-xl p-5 transition-all duration-200 bg-white ${
        isResolved
          ? 'border-slate-200 opacity-60'
          : isHigh
          ? 'border-rose-300 shadow-rose-100 shadow-md'
          : 'border-slate-200 shadow-xs'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isHigh ? (
            <ShieldAlert className="text-rose-600" size={20} />
          ) : (
            <AlertTriangle className="text-amber-600" size={20} />
          )}
          <h4 className="font-semibold text-slate-900">{alert.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={alert.severity} />
          <span className="text-xs text-slate-500 font-mono">
            Conf: {alert.confidence}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
        <p>
          Target Location: <span className="text-slate-800 font-medium">{alert.areaName}</span> &bull;{' '}
          {new Date(alert.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
            alert.status === 'RESOLVED'
              ? 'bg-emerald-100 text-emerald-800'
              : alert.rrtDispatched
              ? 'bg-purple-100 text-purple-800'
              : alert.status === 'ACKNOWLEDGED'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {alert.rrtDispatched ? 'RRT EN ROUTE' : alert.status}
        </span>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mb-3 space-y-1.5">
        <p className="text-xs font-semibold text-slate-700">Signal Cross-Validation Evidence:</p>
        <ul className="text-xs text-slate-600 space-y-1">
          {alert.evidence.map((point, index) => (
            <li key={index} className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">&bull;</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2 border-t border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-slate-600">
          <strong className="text-slate-800">Action:</strong> {alert.recommendedAction}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isResolved && (
            <>
              {!isAcknowledged && (
                <button
                  onClick={() => updateAlert(alert.id, 'ACKNOWLEDGED')}
                  className="flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer"
                >
                  <Clock size={12} /> Acknowledge
                </button>
              )}

              <button
                onClick={() => onOpenResponseModal(alert)}
                className="flex items-center gap-1 text-[11px] bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-semibold shadow-xs transition cursor-pointer"
              >
                <Send size={12} /> Dispatch RRT / Advisory
              </button>

              <button
                onClick={() => updateAlert(alert.id, 'RESOLVED')}
                className="flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer"
                title="Mark Resolved"
              >
                <Check size={12} /> Resolve
              </button>
            </>
          )}

          {isResolved && (
            <span className="text-emerald-600 font-medium flex items-center gap-1 text-xs">
              <CheckCircle2 size={13} /> Anomaly Resolved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}