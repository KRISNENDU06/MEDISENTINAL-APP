import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AreaSummary } from '../services/api';
import { RealWorldSurveillanceMap } from './RealWorldSurveillanceMap';
import {
  MapPin,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Pill,
  Thermometer,
  Stethoscope,
  Globe,
  Grid,
  RotateCcw,
  CheckCircle2,
  Search,
  Filter,
} from 'lucide-react';

interface AreaMapGridProps {
  areas: AreaSummary[];
  selectedArea: AreaSummary | null;
  onSelectArea: (area: AreaSummary) => void;
  loading: boolean;
}

const JURY_CHANGE_KEY = 'medisentinel:last-jury-change';

export const AreaMapGrid: React.FC<AreaMapGridProps> = ({
  areas,
  selectedArea,
  onSelectArea,
  loading,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Prevent the same persisted jury scenario from reopening the drill-down
  // every time App.tsx re-renders. A new scenario gets a new raw value.
  const lastAutoOpenedJuryChange = useRef<string | null>(null);

  const distinctDistricts = useMemo(() => {
    const set = new Set<string>();
    areas.forEach((a) => {
      if (a.district) set.add(a.district);
    });
    return Array.from(set).sort();
  }, [areas]);

  const filteredAreas = useMemo(() => {
    return areas.filter((a) => {
      const matchesDistrict =
        selectedDistrict === 'ALL' ||
        a.district.toLowerCase() === selectedDistrict.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.district.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDistrict && matchesSearch;
    });
  }, [areas, selectedDistrict, searchQuery]);

  // After a NEW Jury Demo, focus the exact ward and open the existing
  // drill-down once. Closing the modal must not cause it to reopen.
  useEffect(() => {
    if (loading || !areas.length) return;
    try {
      const raw = localStorage.getItem(JURY_CHANGE_KEY);
      if (!raw || raw === lastAutoOpenedJuryChange.current) return;

      const change = JSON.parse(raw);
      if (!change?.ward || !change?.district) return;

      const match = areas.find(
        (a) =>
          a.name.toLowerCase() === String(change.ward).toLowerCase() &&
          a.district.toLowerCase() === String(change.district).toLowerCase()
      );

      if (match) {
        // Mark this exact scenario before opening. App re-renders will not
        // reopen it because the persisted value is already acknowledged.
        lastAutoOpenedJuryChange.current = raw;
        setSelectedDistrict(match.district);
        onSelectArea(match);
      }
    } catch {
      // Ignore malformed browser-local demo state.
    }
  }, [areas, loading, onSelectArea]);

  const getRiskBorder = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'border-rose-500/50 bg-rose-950/20 hover:border-rose-400';
      case 'MEDIUM':
        return 'border-amber-500/50 bg-amber-950/20 hover:border-amber-400';
      default:
        return 'border-emerald-500/30 bg-slate-900/40 hover:border-emerald-400';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  let latestJuryChange: any = null;
  try {
    latestJuryChange = JSON.parse(localStorage.getItem(JURY_CHANGE_KEY) || 'null');
  } catch {}

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-400" />
            Geospatial Ward Surveillance Model
          </h3>
          <p className="text-xs text-slate-400">
            Real-world geographic telemetry mapping across all 30 districts & sub-divisions of Odisha
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-brand-400" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              aria-label="Filter by District"
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                All 30 Districts ({areas.length} Locations)
              </option>
              {distinctDistricts.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  {d} ({areas.filter((a) => a.district === d).length})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ward/locality..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-36 sm:w-48 transition-all"
            />
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'map' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Ward Cards ({filteredAreas.length})</span>
            </button>
          </div>
        </div>
      </div>

      {latestJuryChange && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">Latest Jury Change Synced</div>
              <div className="text-xs text-slate-300 truncate">{latestJuryChange.district} • {latestJuryChange.ward}</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono shrink-0">
            Med {latestJuryChange.medicine} • Fever {latestJuryChange.fever} • Water {latestJuryChange.water}
          </div>
        </div>
      )}

      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <RealWorldSurveillanceMap
              areas={filteredAreas}
              selectedArea={selectedArea}
              onSelectArea={onSelectArea}
            />
          </div>

          <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">
                  Target Catchment Telemetry
                </span>
                {selectedArea && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRiskBadge(selectedArea.riskLevel)}`}>
                    {selectedArea.riskLevel}
                  </span>
                )}
              </div>

              {selectedArea ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-white">{selectedArea.name}</h4>
                    <p className="text-xs text-slate-400">District: {selectedArea.district}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300"><Pill className="w-3.5 h-3.5 text-brand-400" />Medicine Demand</span>
                      <span className="font-bold text-white font-mono">{selectedArea.signals?.medicineDemand?.current ?? 0} ({selectedArea.signals?.medicineDemand?.deviation || '+0%'})</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300"><Thermometer className="w-3.5 h-3.5 text-rose-400" />Fever Symptoms</span>
                      <span className="font-bold text-white font-mono">{selectedArea.signals?.feverIndicators?.current ?? 0} ({selectedArea.signals?.feverIndicators?.deviation || '+0%'})</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300"><Stethoscope className="w-3.5 h-3.5 text-sky-400" />Clinic Visits</span>
                      <span className="font-bold text-white font-mono">{selectedArea.signals?.clinicVisits?.current ?? 0} ({selectedArea.signals?.clinicVisits?.deviation || '+0%'})</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 italic">"{selectedArea.explanation}"</div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">Click on any ward node on the map to inspect its real-time telemetry.</div>
              )}
            </div>

            {selectedArea && (
              <button
                onClick={() => onSelectArea(selectedArea)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 shadow-lg shadow-emerald-950/50 border border-brand-400/30 transition-all active:scale-95"
              >
                <span>Open Full Drill-Down Analysis</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        filteredAreas.length === 0 ? (
          <div className="py-12 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400">
            <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">No surveillance locations found</p>
            <p className="text-xs text-slate-500">Try adjusting your district filter or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredAreas.map((area) => {
              const isSelected = selectedArea?.id === area.id;
              return (
                <div
                  key={area.id}
                  onClick={() => onSelectArea(area)}
                  className={`glass-panel rounded-2xl p-4 cursor-pointer transition-all duration-200 border relative overflow-hidden flex flex-col justify-between min-h-[170px] ${isSelected ? 'ring-2 ring-brand-500 shadow-lg shadow-emerald-950/30' : ''} ${getRiskBorder(area.riskLevel)}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[10px] font-mono text-slate-400 truncate">{area.district}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${getRiskBadge(area.riskLevel)}`}>{area.riskLevel}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug line-clamp-1">{area.name}</h4>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Composite Risk</span>
                      <span className="font-bold text-white font-mono">{area.riskScore}/100</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><Pill className="w-3 h-3 text-brand-400" />Meds Spike:</span>
                      <span className="font-bold text-white">{area.signals?.medicineDemand?.deviation || '+0%'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-rose-400" />Fever Spike:</span>
                      <span className="font-bold text-white">{area.signals?.feverIndicators?.deviation || '+0%'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
