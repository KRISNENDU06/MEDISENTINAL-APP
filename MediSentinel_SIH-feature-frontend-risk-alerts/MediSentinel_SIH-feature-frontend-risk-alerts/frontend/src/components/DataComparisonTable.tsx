import React, { useState, useEffect } from 'react';
import { api, AreaSummary } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ODISHA_ALL_DISTRICTS } from '../constants/odishaDistricts';
import {
  BarChart3,
  Filter,
  ArrowUpRight,
  Minus,
  Pill,
  Thermometer,
  Stethoscope,
  Layers,
  Trash2,
  RefreshCw,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

interface ComparisonRowData {
  area_id: number;
  area_name: string;
  district: string;
  risk_level: string;
  signal_type: string;
  current_value: number;
  baseline_value: number;
  deviation_percent: number;
  anomaly_score: number;
}

interface DataComparisonTableProps {
  areas: AreaSummary[];
  onRefreshAll?: () => void;
}

export const DataComparisonTable: React.FC<DataComparisonTableProps> = ({
  areas,
  onRefreshAll,
}) => {
  const { isAdmin, isHealthOfficial } = useAuth();
  const { showToast } = useToast();

  const [comparisonData, setComparisonData] = useState<ComparisonRowData[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [selectedSignal, setSelectedSignal] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [deletingAreaId, setDeletingAreaId] = useState<number | null>(null);

  const canDelete = isAdmin || isHealthOfficial;

  useEffect(() => {
    const buildMatrix = () => {
      const matrix: ComparisonRowData[] = [];
      areas.forEach((area) => {
        const medDev = parseFloat(area.signals.medicineDemand.deviation.replace('%', '').replace('+', '')) || 0;
        const feverDev = parseFloat(area.signals.feverIndicators.deviation.replace('%', '').replace('+', '')) || 0;
        const clinicDev = parseFloat(area.signals.clinicVisits.deviation.replace('%', '').replace('+', '')) || 0;

        // Inferred district from area name or coordinates
        let district = 'Odisha';
        for (const [dist, config] of Object.entries(ODISHA_ALL_DISTRICTS)) {
          if (
            config.subLocations.some(
              (s) =>
                area.name.toLowerCase().includes(s.name.toLowerCase()) ||
                s.name.toLowerCase().includes(area.name.toLowerCase())
            ) ||
            area.name.toLowerCase().includes(dist.toLowerCase())
          ) {
            district = dist;
            break;
          }
        }

        matrix.push({
          area_id: area.rawId,
          area_name: area.name,
          district: district,
          risk_level: area.riskLevel,
          signal_type: 'Medicine Demand (OTC Anti-infectives)',
          current_value: area.signals.medicineDemand.current,
          baseline_value: area.signals.medicineDemand.baseline,
          deviation_percent: medDev,
          anomaly_score: Math.min(100, Math.round(Math.max(0, medDev * 1.25))),
        });

        matrix.push({
          area_id: area.rawId,
          area_name: area.name,
          district: district,
          risk_level: area.riskLevel,
          signal_type: 'Fever & Respiratory Symptoms',
          current_value: area.signals.feverIndicators.current,
          baseline_value: area.signals.feverIndicators.baseline,
          deviation_percent: feverDev,
          anomaly_score: Math.min(100, Math.round(Math.max(0, feverDev * 1.25))),
        });

        matrix.push({
          area_id: area.rawId,
          area_name: area.name,
          district: district,
          risk_level: area.riskLevel,
          signal_type: 'Clinic Outpatient Footfall',
          current_value: area.signals.clinicVisits.current,
          baseline_value: area.signals.clinicVisits.baseline,
          deviation_percent: clinicDev,
          anomaly_score: Math.min(100, Math.round(Math.max(0, clinicDev * 1.25))),
        });
      });
      setComparisonData(matrix);
    };

    buildMatrix();
  }, [areas]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshAll) {
        await onRefreshAll();
      }
      showToast('info', 'Matrix Synchronized', 'Updated moving baseline vs current observations matrix.');
    } catch {
      showToast('error', 'Sync Failed', 'Could not refresh baseline telemetry.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleDeleteWardData = async (areaId: number, areaName: string) => {
    if (!window.confirm(`Are you sure you want to delete all historical observations & signal telemetry for:\n"${areaName}"?\n\nThis will re-calculate the Risk Engine across all tabs.`)) {
      return;
    }

    setDeletingAreaId(areaId);
    try {
      const res = await api.deleteAreaObservations(areaId);
      showToast('success', 'Ward Data Deleted', res.message || `Deleted telemetry for ${areaName}.`);
      if (onRefreshAll) {
        onRefreshAll();
      }
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message || 'Could not delete ward observations.');
    } finally {
      setDeletingAreaId(null);
    }
  };

  const filteredAreas =
    selectedDistrict === 'ALL'
      ? areas
      : areas.filter((a) => {
          const config = ODISHA_ALL_DISTRICTS[selectedDistrict];
          if (!config) return true;
          return (
            config.subLocations.some(
              (s) =>
                a.name.toLowerCase().includes(s.name.toLowerCase()) ||
                s.name.toLowerCase().includes(a.name.toLowerCase())
            ) || a.name.toLowerCase().includes(selectedDistrict.toLowerCase())
          );
        });

  const filteredRows = comparisonData.filter((row) => {
    if (selectedDistrict !== 'ALL' && row.district !== selectedDistrict) {
      return false;
    }
    if (selectedAreaId !== 'ALL' && row.area_id.toString() !== selectedAreaId) {
      return false;
    }
    if (selectedSignal !== 'ALL' && !row.signal_type.toLowerCase().includes(selectedSignal.toLowerCase())) {
      return false;
    }
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'CRITICAL' && (row.anomaly_score < 60 && row.deviation_percent < 45)) return false;
      if (selectedStatus === 'ELEVATED' && ((row.anomaly_score < 30 || row.anomaly_score >= 60) && (row.deviation_percent < 20 || row.deviation_percent >= 45))) return false;
      if (selectedStatus === 'NORMAL' && (row.anomaly_score >= 30 || row.deviation_percent >= 20)) return false;
    }
    return true;
  });

  const getSignalIcon = (type: string) => {
    if (type.includes('Medicine')) return <Pill className="w-3.5 h-3.5 text-brand-400" />;
    if (type.includes('Fever')) return <Thermometer className="w-3.5 h-3.5 text-rose-400" />;
    return <Stethoscope className="w-3.5 h-3.5 text-sky-400" />;
  };

  const getStatusBadge = (deviation: number, anomalyScore: number) => {
    if (anomalyScore >= 60 || deviation >= 45) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <ArrowUpRight className="w-3 h-3 text-rose-400" />
          Critical Anomaly
        </span>
      );
    }
    if (anomalyScore >= 30 || deviation >= 20) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <ArrowUpRight className="w-3 h-3 text-amber-400" />
          Elevated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        <Minus className="w-3 h-3 text-emerald-400" />
        Baseline Normal
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4 shadow-xl">
      {/* Header & Global Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-400" />
              Historical Baseline vs Current Signal Matrix
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase">
              All 30 Districts Monitored
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-signal deviation metrics comparing real-time telemetry against 90-day moving baselines
          </p>
        </div>

        {/* Refresh & Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh and Sync Baseline Matrix"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>Refresh & Sync</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon: District, Ward, Signal Type & Status */}
      <div className="flex flex-wrap items-center gap-2.5 pb-1">
        {/* District Filter (All 30 Districts) */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <MapPin className="w-3 h-3 text-brand-400" />
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedAreaId('ALL');
            }}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All 30 Districts (Odisha)</option>
            {Object.keys(ODISHA_ALL_DISTRICTS).sort().map((d) => (
              <option key={d} value={d}>
                {d} District
              </option>
            ))}
          </select>
        </div>

        {/* Ward Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Filter className="w-3 h-3 text-slate-400" />
          <select
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Wards ({filteredAreas.length})</option>
            {filteredAreas.map((a) => (
              <option key={a.id} value={a.rawId.toString()}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Signal Category */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Layers className="w-3 h-3 text-slate-400" />
          <select
            value={selectedSignal}
            onChange={(e) => setSelectedSignal(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Signal Streams</option>
            <option value="Medicine">Medicine OTC Demand</option>
            <option value="Fever">Fever & Respiratory OPD</option>
            <option value="Clinic">Clinic Footfall</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <ShieldAlert className="w-3 h-3 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Surveillance Statuses</option>
            <option value="CRITICAL">🔴 Critical Anomaly</option>
            <option value="ELEVATED">🟡 Elevated</option>
            <option value="NORMAL">🟢 Baseline Normal</option>
          </select>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="pb-3 font-semibold">Ward & District</th>
              <th className="pb-3 font-semibold">Clinical Risk</th>
              <th className="pb-3 font-semibold">Signal Category</th>
              <th className="pb-3 font-semibold text-right">Current Obs</th>
              <th className="pb-3 font-semibold text-right">90-Day Baseline</th>
              <th className="pb-3 font-semibold text-right">Deviation (%)</th>
              <th className="pb-3 font-semibold text-center">Anomaly Score</th>
              <th className="pb-3 font-semibold text-right">Surveillance Status</th>
              {canDelete && <th className="pb-3 font-semibold text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 text-slate-300">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={canDelete ? 9 : 8} className="py-8 text-center text-slate-500">
                  No matching baseline telemetry records found for current filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 font-medium text-slate-200">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{row.area_name}</span>
                      <span className="text-[10px] text-slate-400">{row.district} District</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        row.risk_level === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : row.risk_level === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {row.risk_level}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {getSignalIcon(row.signal_type)}
                      <span>{row.signal_type}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-white">
                    {row.current_value.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-400">
                    {row.baseline_value.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono font-bold">
                    <span
                      className={
                        row.deviation_percent > 30
                          ? 'text-rose-400'
                          : row.deviation_percent > 10
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {row.deviation_percent > 0 ? `+${row.deviation_percent}%` : `${row.deviation_percent}%`}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            row.anomaly_score >= 60
                              ? 'bg-rose-500'
                              : row.anomaly_score >= 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, row.anomaly_score)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{row.anomaly_score}/100</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    {getStatusBadge(row.deviation_percent, row.anomaly_score)}
                  </td>
                  {canDelete && (
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleDeleteWardData(row.area_id, row.area_name)}
                        disabled={deletingAreaId === row.area_id}
                        title={`Delete telemetry observations for ${row.area_name}`}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


