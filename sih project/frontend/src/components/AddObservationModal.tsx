import React, { useState, useMemo } from 'react';
import { AreaSummary, api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  PlusCircle,
  Calendar,
  Tag,
  Database,
  Activity,
  CheckCircle2,
  MapPin,
  Sparkles,
  Navigation,
  Info,
  RotateCcw,
  Pill,
  Stethoscope,
  Droplets,
  Calculator,
  TrendingUp,
  AlertTriangle,
  Layers,
  Cpu,
} from 'lucide-react';

interface AddObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: AreaSummary[];
  onObservationAdded: () => void;
}

import { ODISHA_ALL_DISTRICTS as DISTRICT_PRESETS, SubLocation } from '../constants/odishaDistricts';


export const AddObservationModal: React.FC<AddObservationModalProps> = ({
  isOpen,
  onClose,
  areas,
  onObservationAdded,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  // Ingestion Mode: 'multi' (Epidemiological Multi-Parameter) vs 'single' (Single Telemetry Signal)
  const [ingestionMode, setIngestionMode] = useState<'multi' | 'single'>('multi');

  // Location Fields
  const [selectedDistrictKey, setSelectedDistrictKey] = useState<string>('Angul');
  const [district, setDistrict] = useState<string>('Angul');
  const [locationName, setLocationName] = useState<string>('Angul Town Ward 8 (Nalco Nagar)');
  const [latitude, setLatitude] = useState<string>('20.8444');
  const [longitude, setLongitude] = useState<string>('85.1511');

  // Common Date
  const [observedOn, setObservedOn] = useState<string>(todayStr);

  // Multi-Parameter Inputs
  const [medicineDemand, setMedicineDemand] = useState<string>('180');
  const [feverCases, setFeverCases] = useState<string>('140');
  const [waterQuality, setWaterQuality] = useState<string>('12');
  const [pharmacySource, setPharmacySource] = useState<string>('Retail Pharmacy Network (POS Telemetry)');
  const [hospitalSource, setHospitalSource] = useState<string>('Urban Primary Health Centre (UPHC / IDSP)');
  const [waterSource, setWaterSource] = useState<string>('PHED Water Testing Laboratory');

  // Single Signal Inputs
  const [signalType, setSignalType] = useState<string>('medicine_demand');
  const [customSignalName, setCustomSignalName] = useState<string>('');
  const [isCustomSignal, setIsCustomSignal] = useState<boolean>(false);
  const [singleValue, setSingleValue] = useState<string>('180');
  const [sourcePreset, setSourcePreset] = useState<string>('Pharmacy POS Network');
  const [customSource, setCustomSource] = useState<string>('District Central Pharmacy');
  const [isCustomSource, setIsCustomSource] = useState<boolean>(false);

  const [autoRunRisk, setAutoRunRisk] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Real-Time Explainable AI (XAI) Mathematical Formula Preview
  // -------------------------------------------------------------
  const liveCalculation = useMemo(() => {
    // 1. Medicine Telemetry
    const medVal = parseFloat(medicineDemand) || 0;
    const medBaseline = 100.0;
    const medDev = ((medVal - medBaseline) / medBaseline) * 100;
    const medAnomaly = Math.min(100, Math.max(0, medDev * 1.25));
    const medScore = medAnomaly * 0.30;

    // 2. Hospital Fever Telemetry
    const feverVal = parseFloat(feverCases) || 0;
    const feverBaseline = 80.0;
    const feverDev = ((feverVal - feverBaseline) / feverBaseline) * 100;
    const feverAnomaly = Math.min(100, Math.max(0, feverDev * 1.25));
    const feverScore = feverAnomaly * 0.30;

    // 3. Multi-Week Persistence (20% Weight)
    const maxSignal = Math.max(medAnomaly, feverAnomaly);
    const persistScore = (maxSignal >= 50 ? 50.0 : maxSignal >= 30 ? 25.0 : 0) * 0.20;

    // 4. Geographic Diffusion (20% Weight)
    const geoScore = (maxSignal >= 50 ? 50.0 : maxSignal >= 30 ? 25.0 : 0) * 0.20;

    // Weighted Composite vs Acute Surge Override
    const standardComposite = medScore + feverScore + persistScore + geoScore;
    let finalRisk = standardComposite;
    if (maxSignal >= 50) {
      const acuteOverride = maxSignal * 0.90 + Math.min(medAnomaly, feverAnomaly) * 0.10;
      finalRisk = Math.max(standardComposite, acuteOverride);
    }
    finalRisk = Math.min(100, Math.max(0, Math.round(finalRisk * 100) / 100));

    const level = finalRisk >= 70 ? 'HIGH' : finalRisk >= 40 ? 'MEDIUM' : 'LOW';

    return {
      medVal,
      medBaseline,
      medDev: Math.round(medDev * 10) / 10,
      medAnomaly: Math.round(medAnomaly * 10) / 10,
      medScore: Math.round(medScore * 100) / 100,

      feverVal,
      feverBaseline,
      feverDev: Math.round(feverDev * 10) / 10,
      feverAnomaly: Math.round(feverAnomaly * 10) / 10,
      feverScore: Math.round(feverScore * 100) / 100,

      persistScore: Math.round(persistScore * 100) / 100,
      geoScore: Math.round(geoScore * 100) / 100,

      finalRisk,
      level,
    };
  }, [medicineDemand, feverCases]);

  // Security guard: only open if user is ADMIN
  if (!isOpen || user?.role !== 'ADMIN') return null;

  const handleApplyDistrictPreset = (presetKey: string) => {
    setSelectedDistrictKey(presetKey);
    const preset = DISTRICT_PRESETS[presetKey];
    if (preset) {
      setDistrict(preset.district);
      setLocationName(preset.defaultWard);
      setLatitude(preset.lat.toString());
      setLongitude(preset.lng.toString());
    }
  };

  const handleSelectSubLocation = (sub: SubLocation) => {
    setLocationName(sub.name);
    setLatitude(sub.lat.toString());
    setLongitude(sub.lng.toString());
  };

  const handleResetForm = () => {
    setSelectedDistrictKey('Angul');
    setDistrict('Angul');
    setLocationName('Angul Town Ward 8 (Nalco Nagar)');
    setLatitude('20.8444');
    setLongitude('85.1511');
    setMedicineDemand('180');
    setFeverCases('140');
    setWaterQuality('12');
    setSingleValue('180');
    setObservedOn(todayStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationName.trim()) {
      showToast('error', 'Missing Location', 'Please enter a Location / Ward name.');
      return;
    }

    const finalDistrict = district.trim() || locationName.trim();
    setSubmitting(true);

    try {
      if (ingestionMode === 'multi') {
        const medNum = parseFloat(medicineDemand) || 0;
        const feverNum = parseFloat(feverCases) || 0;
        const waterNum = parseFloat(waterQuality) || 0;

        if (medNum <= 0 && feverNum <= 0) {
          showToast('error', 'Missing Signal Values', 'Please enter at least Medicine Demand or Fever Cases count.');
          setSubmitting(false);
          return;
        }

        const payload = {
          area_name: locationName.trim(),
          district: finalDistrict,
          latitude: parseFloat(latitude) || 20.8444,
          longitude: parseFloat(longitude) || 85.1511,
          observed_on: observedOn,
          medicine_demand: medNum,
          fever_cases: feverNum,
          water_quality: waterNum > 0 ? waterNum : null,
          pharmacy_source: pharmacySource,
          hospital_source: hospitalSource,
          water_source: waterSource,
          data_quality_score: 0.95,
        };

        const res = await api.createMultiSignalObservation(payload, autoRunRisk);

        showToast(
          'success',
          'Multi-Signal Ingestion Complete',
          res.message || `Health signals ingested for ${locationName.trim()} (${finalDistrict}). Risk Score: ${res.assessment?.risk_score ?? liveCalculation.finalRisk}/100.`
        );
      } else {
        const numValue = parseFloat(singleValue);
        if (isNaN(numValue) || numValue < 0) {
          showToast('error', 'Invalid Value', 'Please enter a positive numeric signal value.');
          setSubmitting(false);
          return;
        }

        const finalSignal = isCustomSignal ? (customSignalName.trim() || 'custom_signal') : signalType;
        const finalSource = isCustomSource ? (customSource.trim() || 'Custom Facility') : sourcePreset;

        const payload = {
          area_name: locationName.trim(),
          district: finalDistrict,
          latitude: parseFloat(latitude) || 20.8444,
          longitude: parseFloat(longitude) || 85.1511,
          observed_on: observedOn,
          signal_type: finalSignal,
          category:
            finalSignal.includes('medicine') || finalSignal.includes('pharmacy')
              ? 'fever_respiratory_medicines'
              : finalSignal.includes('fever')
              ? 'respiratory_fever'
              : 'general',
          value: numValue,
          source: finalSource,
          data_quality_score: 0.95,
        };

        const res = await api.createObservation(payload, autoRunRisk);

        showToast(
          'success',
          'Successfully Added',
          res.message || `Health signal for ${locationName.trim()} (${finalDistrict}) recorded & risk engine updated.`
        );
      }

      onObservationAdded();
      handleResetForm();
      onClose();
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message || 'Could not save observation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-panel-glow rounded-3xl p-6 sm:p-8 bg-slate-900 shadow-2xl border border-slate-700/80 my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Admin Health Signal Ingestion
                </h3>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Admin Access
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hidden sm:inline">
                  Explainable AI (XAI) Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Input multi-parameter epidemiological telemetry — automatically calculates mathematical risk score & updates real-world GIS map
              </p>
            </div>
          </div>
        </div>

        {/* Ingestion Mode Toggle */}
        <div className="mt-4 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIngestionMode('multi')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              ingestionMode === 'multi'
                ? 'bg-gradient-to-r from-purple-600 to-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4 text-purple-300" />
            <span>Multi-Parameter Epidemiological Ingestion (Recommended)</span>
          </button>

          <button
            type="button"
            onClick={() => setIngestionMode('single')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              ingestionMode === 'single'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Single Signal Mode</span>
          </button>
        </div>

        {/* Ingestion Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* District & Location Section */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-3">
            {/* Quick District Presets */}
            <div>
              <div className="text-[11px] text-purple-300 font-semibold mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Quick District Presets:
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Click to auto-populate</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(DISTRICT_PRESETS).map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => handleApplyDistrictPreset(cityName)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all font-mono active:scale-95 ${
                      district.toLowerCase().includes(cityName.toLowerCase())
                        ? 'bg-purple-600 text-white border-purple-400 font-bold'
                        : 'bg-slate-900 hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border-slate-700 hover:border-purple-500/50'
                    }`}
                  >
                    +{cityName}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Location / Localities Chips for Selected District */}
            {DISTRICT_PRESETS[selectedDistrictKey]?.subLocations && (
              <div className="pt-1">
                <div className="text-[10px] text-brand-300 font-semibold mb-1 flex items-center justify-between">
                  <span>📍 Sub-Locations & Wards in {selectedDistrictKey}:</span>
                  <span className="text-[9px] text-slate-500">1-Click precision autofill</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {DISTRICT_PRESETS[selectedDistrictKey].subLocations.map((sub) => {
                    const isSelected = locationName === sub.name;
                    return (
                      <button
                        key={sub.name}
                        type="button"
                        onClick={() => handleSelectSubLocation(sub)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          isSelected
                            ? 'bg-brand-500/20 text-brand-300 border-brand-500 font-semibold shadow-sm'
                            : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {sub.name.split('(')[0].trim()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* District & Location Name Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-purple-400" />
                  <span>District Name *</span>
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Angul, Khurda, Cuttack, Sambalpur"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-400" />
                  <span>Ward / Surveillance Location *</span>
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Angul Town Ward 8, Pallahara, Saheed Nagar"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            {/* GPS Coordinates & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-purple-400" />
                  <span>Latitude (GPS)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="20.8444"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-purple-400" />
                  <span>Longitude (GPS)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="85.1511"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Observation Date</span>
                </label>
                <input
                  type="date"
                  value={observedOn}
                  onChange={(e) => setObservedOn(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* MODE 1: MULTI-PARAMETER INGESTION */}
          {ingestionMode === 'multi' ? (
            <div className="space-y-4">
              {/* Parameter Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Pharmacy OTC Medicine Sales */}
                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-blue-500/30 hover:border-blue-500/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-blue-400" />
                      <span>1. Pharmacy OTC Medicine Demand</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                      30% Weight
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Total OTC Paracetamol/Dolo 650, ORS, & Antibiotic units sold in last 24–48h.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="any"
                        value={medicineDemand}
                        onChange={(e) => setMedicineDemand(e.target.value)}
                        placeholder="e.g. 180"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] text-slate-500">packs/day</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Normal Baseline: ~100 packs</span>
                    <span className={`font-bold ${liveCalculation.medDev > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {liveCalculation.medDev > 0 ? `+${liveCalculation.medDev}% Deviation` : `${liveCalculation.medDev}% Normal`}
                    </span>
                  </div>
                </div>

                {/* 2. Hospital Fever OPD Registrations */}
                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-emerald-400" />
                      <span>2. Hospital & PHC Fever Consultations</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      30% Weight
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Outpatient department (OPD) acute fever & ILI/SARI triage registries.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="any"
                        value={feverCases}
                        onChange={(e) => setFeverCases(e.target.value)}
                        placeholder="e.g. 140"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] text-slate-500">cases/day</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Normal Baseline: ~80 cases</span>
                    <span className={`font-bold ${liveCalculation.feverDev > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {liveCalculation.feverDev > 0 ? `+${liveCalculation.feverDev}% Deviation` : `${liveCalculation.feverDev}% Normal`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Optional Water Quality Index / Lab Positivity */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>3. Environmental Water Quality Index / Turbidity (Optional Lab Signal)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Laboratory Telemetry</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      value={waterQuality}
                      onChange={(e) => setWaterQuality(e.target.value)}
                      placeholder="e.g. 12 (NTU / Positivity Index)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-3 top-1.5 text-[10px] text-slate-500">NTU / CFU</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Normal: &lt;5.0 NTU</span>
                </div>
              </div>

              {/* 🌟 Real-Time Explainable AI (XAI) Mathematical Formula Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 border border-purple-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-purple-200 uppercase tracking-wider">
                        Real-Time Risk Engine Mathematical Preview (XAI)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Formula: <code className="text-purple-300 font-mono">(Med×0.30) + (Fever×0.30) + (Persist×0.20) + (Geo×0.20)</code>
                      </p>
                    </div>
                  </div>

                  {/* Predicted Risk Badge */}
                  <div className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md ${
                    liveCalculation.level === 'HIGH'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                      : liveCalculation.level === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {liveCalculation.level === 'HIGH' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                    <span>Score: {liveCalculation.finalRisk}/100 ({liveCalculation.level} RISK)</span>
                  </div>
                </div>

                {/* Live 4-Pillar Score Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  {/* Medicine Box */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-blue-500/20">
                    <div className="text-[10px] text-blue-400 font-bold flex items-center justify-between">
                      <span>💊 Pharmacy</span>
                      <span>30% Wt</span>
                    </div>
                    <div className="text-sm font-black text-white mt-1">
                      {liveCalculation.medScore} <span className="text-[10px] text-slate-500 font-normal">/ 30</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Anomaly: {liveCalculation.medAnomaly}%
                    </div>
                  </div>

                  {/* Fever Box */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-emerald-500/20">
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-between">
                      <span>🏥 Hospital OPD</span>
                      <span>30% Wt</span>
                    </div>
                    <div className="text-sm font-black text-white mt-1">
                      {liveCalculation.feverScore} <span className="text-[10px] text-slate-500 font-normal">/ 30</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Anomaly: {liveCalculation.feverAnomaly}%
                    </div>
                  </div>

                  {/* Persistence Box */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/20">
                    <div className="text-[10px] text-amber-400 font-bold flex items-center justify-between">
                      <span>⏳ Persistence</span>
                      <span>20% Wt</span>
                    </div>
                    <div className="text-sm font-black text-white mt-1">
                      {liveCalculation.persistScore} <span className="text-[10px] text-slate-500 font-normal">/ 20</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Multi-Week Signal
                    </div>
                  </div>

                  {/* Geographic Spread Box */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-purple-500/20">
                    <div className="text-[10px] text-purple-400 font-bold flex items-center justify-between">
                      <span>📍 Spatial Spread</span>
                      <span>20% Wt</span>
                    </div>
                    <div className="text-sm font-black text-white mt-1">
                      {liveCalculation.geoScore} <span className="text-[10px] text-slate-500 font-normal">/ 20</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Neighbor Contagion
                    </div>
                  </div>
                </div>

                {/* SOP Action Directive Preview */}
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-purple-300">Automated Public Health Directive: </strong>
                    {liveCalculation.level === 'HIGH' ? (
                      <span className="text-red-300">
                        Trigger Rapid Response Team (RRT) • Initiate door-to-door fever survey • Distribute ORS/Chlorine • Broadcast multilingual Odia/Hindi voice advisories.
                      </span>
                    ) : liveCalculation.level === 'MEDIUM' ? (
                      <span className="text-amber-300">
                        Elevated surveillance alert • Increase sentinel pharmacy logging • Verify water purification plants.
                      </span>
                    ) : (
                      <span className="text-emerald-300">
                        Routine seasonal monitoring • Baseline syndromic levels normal.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MODE 2: SINGLE SIGNAL INGESTION */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Single Value */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Observed Signal Value *</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={singleValue}
                    onChange={(e) => setSingleValue(e.target.value)}
                    placeholder="e.g. 180"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                {/* Signal Type */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Signal Type</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomSignal(!isCustomSignal)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 underline"
                    >
                      {isCustomSignal ? '← Standard' : '+ Custom'}
                    </button>
                  </div>

                  {isCustomSignal ? (
                    <input
                      type="text"
                      value={customSignalName}
                      onChange={(e) => setCustomSignalName(e.target.value)}
                      placeholder="e.g. Dengue NS1 Positives"
                      className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  ) : (
                    <select
                      value={signalType}
                      onChange={(e) => setSignalType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="medicine_demand">Medicine Demand (Antipyretic / Analgesic Units)</option>
                      <option value="fever_cases">Fever Indicators (Syndromic Outpatient Logs)</option>
                      <option value="clinic_visits">Clinic Visits (Primary Health Center Footfall)</option>
                      <option value="respiratory_symptoms">Respiratory Illness (ILI / SARI Cases)</option>
                      <option value="gi_symptoms">Gastrointestinal / Acute Waterborne Diarrhea</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Data Source */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    <span>Data Source</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSource(!isCustomSource)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 underline"
                  >
                    {isCustomSource ? '← Standard' : '+ Custom'}
                  </button>
                </div>

                {isCustomSource ? (
                  <input
                    type="text"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="e.g. District Central Pharmacy"
                    className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                ) : (
                  <select
                    value={sourcePreset}
                    onChange={(e) => setSourcePreset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Pharmacy POS Network">Pharmacy POS Network (Retail OTC Sales)</option>
                    <option value="Community Health Center (CHC)">Community Health Center (CHC / PHC Logs)</option>
                    <option value="District Hospital Emergency (HMIS)">District Hospital Emergency (IDSP / HMIS)</option>
                    <option value="Diagnostic Pathology Lab">Diagnostic Pathology Laboratory</option>
                    <option value="Field ASHA Mobile App">Field ASHA / Anganwadi Mobile App</option>
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Auto-Run Risk Engine Checkbox */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <input
              type="checkbox"
              id="autoRiskCheckbox"
              checked={autoRunRisk}
              onChange={(e) => setAutoRunRisk(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-700 rounded focus:ring-purple-500"
            />
            <label htmlFor="autoRiskCheckbox" className="text-xs text-slate-300 cursor-pointer">
              <strong>Auto-Recalculate 4-Pillar Risk Engine</strong> & update real-world GIS map instantly
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Fields</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-brand-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 shadow-lg shadow-purple-950/60 transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Ingesting & Calculating...' : 'Ingest Signals & Update Risk Engine'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

