import React, { useState, useEffect } from 'react';
import { api, AreaSummary } from '../services/api';
import {
  BarChart3,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Pill,
  Thermometer,
  Stethoscope,
  Activity,
  Layers,
} from 'lucide-react';

interface ComparisonRowData {
  area_id: number;
  area_name: string;
  signal_type: string;
  current_value: number;
  baseline_value: number;
  deviation_percent: number;
  anomaly_score: number;
}

interface DataComparisonTableProps {
  areas: AreaSummary[];
}

export const DataComparisonTable: React.FC<DataComparisonTableProps> = ({ areas }) => {
  const [comparisonData, setComparisonData] = useState<ComparisonRowData[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [selectedSignal, setSelectedSignal] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchComparison = async () => {
      setLoading(true);
      try {
        const rows = await api.getObservations(); // or fallback to computed comparisons from areas
        // Generate comprehensive matrix from areas
        const matrix: ComparisonRowData[] = [];
        areas.forEach((area) => {
          const medDev = parseFloat(area.signals.medicineDemand.deviation.replace('%', '').replace('+', '')) || 0;
          const feverDev = parseFloat(area.signals.feverIndicators.deviation.replace('%', '').replace('+', '')) || 0;
          const clinicDev = parseFloat(area.signals.clinicVisits.deviation.replace('%', '').replace('+', '')) || 0;

          matrix.push({
            area_id: area.rawId,
            area_name: area.name,
            signal_type: 'Medicine Demand (OTC Anti-infectives)',
            current_value: area.signals.medicineDemand.current,
            baseline_value: area.signals.medicineDemand.baseline,
            deviation_percent: medDev,
            anomaly_score: Math.min(100, Math.round(Math.max(0, medDev * 1.25))),
          });

          matrix.push({
            area_id: area.rawId,
            area_name: area.name,
            signal_type: 'Fever & Respiratory Symptoms',
            current_value: area.signals.feverIndicators.current,
            baseline_value: area.signals.feverIndicators.baseline,
            deviation_percent: feverDev,
            anomaly_score: Math.min(100, Math.round(Math.max(0, feverDev * 1.25))),
          });

          matrix.push({
            area_id: area.rawId,
            area_name: area.name,
            signal_type: 'Clinic Outpatient Footfall',
            current_value: area.signals.clinicVisits.current,
            baseline_value: area.signals.clinicVisits.baseline,
            deviation_percent: clinicDev,
            anomaly_score: Math.min(100, Math.round(Math.max(0, clinicDev * 1.25))),
          });
        });
        setComparisonData(matrix);
      } catch (err) {
        console.error('Error loading comparison matrix:', err);
      } finally {
        setLoading(false);
      }
    };

    if (areas.length > 0) {
      fetchComparison();
    }
  }, [areas]);

  const filteredRows = comparisonData.filter((row) => {
    if (selectedAreaId !== 'ALL' && row.area_id.toString() !== selectedAreaId) {
      return false;
    }
    if (selectedSignal !== 'ALL' && !row.signal_type.toLowerCase().includes(selectedSignal.toLowerCase())) {
      return false;
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
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
      {/* Header & Filters (Sections 25, 29, 64) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            Historical Baseline vs Current Signal Matrix
          </h3>
          <p className="text-xs text-slate-400">
            Multi-signal deviation metrics comparing current observations against historical moving baselines
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Monitored Wards</option>
              {areas.map((a) => (
                <option key={a.id} value={a.rawId.toString()}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Layers className="w-3 h-3 text-slate-400" />
            <select
              value={selectedSignal}
              onChange={(e) => setSelectedSignal(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Signal Types</option>
              <option value="Medicine">Medicine Demand</option>
              <option value="Fever">Fever & Respiratory</option>
              <option value="Clinic">Clinic Visits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="pb-3 font-semibold">Ward / Catchment</th>
              <th className="pb-3 font-semibold">Signal Category</th>
              <th className="pb-3 font-semibold text-right">Current Obs</th>
              <th className="pb-3 font-semibold text-right">Normal Baseline</th>
              <th className="pb-3 font-semibold text-right">Deviation (%)</th>
              <th className="pb-3 font-semibold text-center">Anomaly Score</th>
              <th className="pb-3 font-semibold text-right">Surveillance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 text-slate-300">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  No matching baseline comparison records found.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 font-medium text-slate-200">{row.area_name}</td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

