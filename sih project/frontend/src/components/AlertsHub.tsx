import React, { useState } from 'react';
import { AlertItem, api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface AlertsHubProps {
  alerts: AlertItem[];
  onRefreshAlerts: () => void;
  onSelectAreaByName?: (name: string) => void;
}

export const AlertsHub: React.FC<AlertsHubProps> = ({
  alerts,
  onRefreshAlerts,
  onSelectAreaByName,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);
  const { showToast } = useToast();
  const { canManageAlerts } = useAuth();

  // Filter alerts by tab and search
  const filteredAlerts = alerts.filter((alert) => {
    const statusUpper = alert.status?.toUpperCase() || 'OPEN';
    const severityUpper = alert.severity?.toUpperCase() || 'LOW';

    // Tab Filter
    let matchesTab = true;
    if (activeTab === 'HIGH') matchesTab = severityUpper === 'HIGH';
    else if (activeTab === 'MEDIUM') matchesTab = severityUpper === 'MEDIUM';
    else if (activeTab === 'LOW') matchesTab = severityUpper === 'LOW';
    else if (activeTab === 'ACTIVE') matchesTab = statusUpper !== 'RESOLVED';
    else if (activeTab === 'RESOLVED') matchesTab = statusUpper === 'RESOLVED';

    if (!matchesTab) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = alert.title.toLowerCase().includes(q);
      const matchArea = alert.areaName.toLowerCase().includes(q);
      const matchEvidence = alert.evidence?.some((e) => e.toLowerCase().includes(q));
      return matchTitle || matchArea || matchEvidence;
    }

    return true;
  });

  // Calculate counts for badges
  const counts = {
    ALL: alerts.length,
    ACTIVE: alerts.filter((a) => a.status !== 'RESOLVED').length,
    HIGH: alerts.filter((a) => a.severity === 'HIGH').length,
    MEDIUM: alerts.filter((a) => a.severity === 'MEDIUM').length,
    LOW: alerts.filter((a) => a.severity === 'LOW').length,
    RESOLVED: alerts.filter((a) => a.status === 'RESOLVED').length,
  };

  const handleUpdateStatus = async (alertId: string | number, newStatus: 'ACKNOWLEDGED' | 'RESOLVED') => {
    setActionLoadingId(alertId);
    try {
      const res = await api.updateAlertStatus(alertId, newStatus);
      showToast(
        'success',
        `Alert ${newStatus === 'RESOLVED' ? 'Resolved' : 'Acknowledged'}`,
        res.message || `Alert status updated to ${newStatus}`
      );
      onRefreshAlerts();
    } catch (err: any) {
      showToast('error', 'Status Update Failed', err.message || 'Could not update alert status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Epidemic Alert & Early Warning Hub
          </h3>
          <p className="text-xs text-slate-400">
            Real-time syndromic anomalies with triage verification & resolution workflows
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts or wards..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs (Requirement 5: All | High | Medium | Low | Active | Resolved) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
        {(['ACTIVE', 'ALL', 'HIGH', 'MEDIUM', 'LOW', 'RESOLVED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === tab
                ? 'bg-slate-800 text-white border border-slate-600 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>{tab === 'ACTIVE' ? 'Active Alerts' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                tab === 'HIGH'
                  ? 'bg-rose-500/30 text-rose-300'
                  : tab === 'ACTIVE'
                  ? 'bg-brand-500/30 text-brand-300'
                  : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3 pt-1">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-medium text-slate-300">No alerts matching "{activeTab}" filter</p>
            <p className="text-xs text-slate-500 mt-0.5">All monitored signals within acceptable baseline thresholds.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isResolved = alert.status === 'RESOLVED';
            const isAcknowledged = alert.status === 'ACKNOWLEDGED';
            const isLoading = actionLoadingId === alert.id;

            return (
              <div
                key={alert.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isResolved
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : alert.severity === 'HIGH'
                    ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400/50'
                    : alert.severity === 'MEDIUM'
                    ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400/50'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity} PRIORITY
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-tight">{alert.title}</h4>
                      <button
                        onClick={() => onSelectAreaByName && onSelectAreaByName(alert.areaName)}
                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
                      >
                        <MapPin className="w-3 h-3" />
                        {alert.areaName}
                      </button>
                    </div>

                    {/* Evidence & Message */}
                    <div className="mt-2 space-y-1">
                      {alert.evidence && alert.evidence.length > 0 ? (
                        alert.evidence.map((line, idx) => (
                          <p key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
                            <span className="text-brand-400 font-bold">•</span>
                            <span>{line}</span>
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-slate-300">{alert.recommendedAction}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Detected: {new Date(alert.detectedAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>Risk Score: <strong className="text-slate-200">{alert.riskScore}/100</strong></span>
                      <span>•</span>
                      <span>Confidence: <strong className="text-slate-200">{alert.confidence}%</strong></span>
                    </div>
                  </div>

                  {/* Alert Action Buttons (Requirement 3: Acknowledge, Resolve) */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
                    {!isResolved && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'ACKNOWLEDGED')}
                          disabled={isLoading || isAcknowledged}
                          title="Acknowledge alert and mark under investigation"
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            isAcknowledged
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 cursor-default'
                              : 'bg-slate-850 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(alert.id, 'RESOLVED')}
                          disabled={isLoading}
                          title="Mark alert as resolved after field verification"
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 border border-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      </>
                    )}

                    {isResolved && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

