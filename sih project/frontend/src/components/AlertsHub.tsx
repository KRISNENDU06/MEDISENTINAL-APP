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
  RefreshCw,
  Trash2,
  Megaphone,
  Ambulance,
  X,
  Volume2,
  FileCheck,
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Advisory Modal State
  const [advisoryModalAlert, setAdvisoryModalAlert] = useState<AlertItem | null>(null);
  const [generatedAdvisory, setGeneratedAdvisory] = useState<any | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryLang, setAdvisoryLang] = useState<'english' | 'odia' | 'hindi'>('odia');

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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshAlerts();
      showToast('info', 'Surveillance Alerts Synchronized', 'Latest alert signals refreshed from Risk Engine.');
    } catch {
      showToast('error', 'Sync Failed', 'Could not refresh alert signals.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
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

  const handleDeleteAlert = async (alertId: string | number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete this epidemic alert:\n"${title}"?`)) {
      return;
    }
    setActionLoadingId(alertId);
    try {
      await api.deleteAlert(alertId);
      showToast('info', 'Alert Deleted', `Alert "${title}" has been removed from active surveillance.`);
      onRefreshAlerts();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message || 'Could not delete alert.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDispatchRRT = async (alert: AlertItem) => {
    setActionLoadingId(alert.id);
    try {
      const res = await api.dispatchRRT(
        alert.areaId,
        alert.areaName,
        `Emergency outbreak response for ${alert.title} (Severity: ${alert.severity})`
      );
      showToast(
        'success',
        `🚨 Rapid Response Team (RRT) Dispatched`,
        `Team Leader: ${res.dispatch.teamLeader} deployed to ${alert.areaName}. ETA: ${res.dispatch.etaMinutes} mins.`
      );
      onRefreshAlerts();
    } catch (err: any) {
      showToast('error', 'Dispatch Error', err.message || 'Unable to deploy Rapid Response Team.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenAdvisoryModal = async (alert: AlertItem) => {
    setAdvisoryModalAlert(alert);
    setAdvisoryLoading(true);
    try {
      const res = await api.generateAdvisory({
        wardName: alert.areaName,
        riskLevel: alert.severity,
        diseaseType: alert.title,
      });
      setGeneratedAdvisory(res);
    } catch (err: any) {
      showToast('error', 'Advisory Generation Error', err.message || 'Could not generate advisory.');
    } finally {
      setAdvisoryLoading(false);
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
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Epidemic Alert & Early Warning Hub
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase tracking-wider">
              {counts.ACTIVE} Active Alerts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time syndromic anomalies with triage verification, RRT deployment & multi-channel resolution workflows
          </p>
        </div>

        {/* Search & Refresh Bar */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts or wards..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh All Alerts & Signals"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
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
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity} PRIORITY
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-tight">{alert.title}</h4>
                      <button
                        onClick={() => onSelectAreaByName && onSelectAreaByName(alert.areaName)}
                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium bg-brand-950/40 px-2 py-0.5 rounded-lg border border-brand-500/30"
                      >
                        <MapPin className="w-3 h-3" />
                        {alert.areaName}
                      </button>
                    </div>

                    {/* Evidence & Message */}
                    <div className="space-y-1 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
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

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Detected: {new Date(alert.detectedAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>Risk Score: <strong className="text-slate-200">{alert.riskScore}/100</strong></span>
                      <span>•</span>
                      <span>Confidence: <strong className="text-slate-200">{alert.confidence}%</strong></span>
                      <span>•</span>
                      <span className="text-xs text-emerald-400 font-medium">SOP: {alert.recommendedAction}</span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end sm:items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                    {/* RBAC Protected Management Actions: ONLY for Admin and Health Official */}
                    {canManageAlerts ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {/* 1. Dispatch RRT Button */}
                        <button
                          onClick={() => handleDispatchRRT(alert)}
                          disabled={isLoading}
                          title="Deploy Rapid Response Team to field"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/40 border border-rose-400/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Ambulance className="w-3.5 h-3.5" />
                          <span>Dispatch RRT</span>
                        </button>

                        {/* 2. Generate Public Advisory Button */}
                        <button
                          onClick={() => handleOpenAdvisoryModal(alert)}
                          disabled={isLoading}
                          title="Generate Multilingual Citizen Public Advisory"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-950/40 border border-indigo-400/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>Advisory</span>
                        </button>

                        {/* 3. Acknowledge Alert */}
                        {!isResolved && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'ACKNOWLEDGED')}
                            disabled={isLoading || isAcknowledged}
                            title="Acknowledge alert and mark under field investigation"
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                              isAcknowledged
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 cursor-default'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            }`}
                          >
                            {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                          </button>
                        )}

                        {/* 4. Resolve Alert */}
                        {!isResolved && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'RESOLVED')}
                            disabled={isLoading}
                            title="Mark alert as resolved after containment"
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 border border-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Resolve
                          </button>
                        )}

                        {isResolved && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolved
                          </span>
                        )}

                        {/* 5. Delete Alert Button */}
                        <button
                          onClick={() => handleDeleteAlert(alert.id, alert.title)}
                          disabled={isLoading}
                          title="Delete this alert record"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      /* Citizen / Public Customer View */
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Under Official Monitoring</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Multilingual Public Advisory Modal */}
      {advisoryModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Public Health Advisory Bulletin</h3>
                  <p className="text-xs text-slate-400">
                    Location: <strong className="text-white">{advisoryModalAlert.areaName}</strong> • Risk Level:{' '}
                    <strong className="text-rose-400">{advisoryModalAlert.severity}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAdvisoryModalAlert(null);
                  setGeneratedAdvisory(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              {(['odia', 'english', 'hindi'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setAdvisoryLang(l)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    advisoryLang === l
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l === 'odia' ? 'ଓଡ଼ିଆ (Odia)' : l === 'hindi' ? 'हिन्दी (Hindi)' : 'English'}
                </button>
              ))}
            </div>

            {/* Content */}
            {advisoryLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                Generating verified epidemiological advisory in {advisoryLang.toUpperCase()}...
              </div>
            ) : generatedAdvisory && generatedAdvisory.languages ? (
              <div className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                <h4 className="text-sm font-bold text-white">
                  {generatedAdvisory.languages[advisoryLang]?.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {generatedAdvisory.languages[advisoryLang]?.body}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h5 className="text-xs font-bold text-brand-300 uppercase tracking-wider">
                    Preventive Health Directives:
                  </h5>
                  <ul className="space-y-1.5">
                    {generatedAdvisory.languages[advisoryLang]?.precautions?.map((p: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">Advisory content ready for broadcast.</div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  showToast('success', 'Public Broadcast Sent', `Advisory broadcasted to citizen SMS/WhatsApp channels for ${advisoryModalAlert.areaName}.`);
                  setAdvisoryModalAlert(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
              >
                Broadcast to Citizens
              </button>
              <button
                onClick={() => setAdvisoryModalAlert(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

