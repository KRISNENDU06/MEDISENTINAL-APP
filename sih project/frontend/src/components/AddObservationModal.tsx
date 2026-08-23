import React, { useState } from 'react';
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
} from 'lucide-react';

interface AddObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: AreaSummary[];
  onObservationAdded: () => void;
}

const DISTRICT_PRESETS: { [key: string]: { district: string; defaultWard: string; lat: number; lng: number } } = {
  Angul: { district: 'Angul', defaultWard: 'Angul Central (Nalco Nagar)', lat: 20.8444, lng: 85.1511 },
  Bhubaneswar: { district: 'Khurda', defaultWard: 'Saheed Nagar Ward 29', lat: 20.2883, lng: 85.8456 },
  Cuttack: { district: 'Cuttack', defaultWard: 'CDA Sector 6', lat: 20.4789, lng: 85.8364 },
  Puri: { district: 'Puri', defaultWard: 'Grand Road Ward 12', lat: 19.8135, lng: 85.8312 },
  Sambalpur: { district: 'Sambalpur', defaultWard: 'Sambalpur Town Ward 4', lat: 21.4669, lng: 83.9812 },
  Rourkela: { district: 'Sundargarh', defaultWard: 'Rourkela Steel Township', lat: 22.2604, lng: 84.8536 },
  Balasore: { district: 'Balasore', defaultWard: 'Balasore Station Ward', lat: 21.4934, lng: 86.9135 },
  Berhampur: { district: 'Ganjam', defaultWard: 'Berhampur Silk City Ward', lat: 19.3149, lng: 84.7941 },
  Koraput: { district: 'Koraput', defaultWard: 'Koraput Valley Ward', lat: 18.8135, lng: 82.7123 },
  Jharsuguda: { district: 'Jharsuguda', defaultWard: 'Jharsuguda Industrial Ward', lat: 21.8554, lng: 84.0062 },
  Bhadrak: { district: 'Bhadrak', defaultWard: 'Bhadrak Town Ward', lat: 21.0544, lng: 86.4957 },
  Baripada: { district: 'Mayurbhanj', defaultWard: 'Baripada Heritage Ward', lat: 21.9322, lng: 86.7233 },
};

export const AddObservationModal: React.FC<AddObservationModalProps> = ({
  isOpen,
  onClose,
  areas,
  onObservationAdded,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  // Location Fields (Pure District & Location Name - No area IDs)
  const [district, setDistrict] = useState<string>('Angul');
  const [locationName, setLocationName] = useState<string>('Angul Central (Nalco Nagar)');
  const [latitude, setLatitude] = useState<string>('20.8444');
  const [longitude, setLongitude] = useState<string>('85.1511');

  // Observation Details
  const [observedOn, setObservedOn] = useState<string>(todayStr);
  const [signalType, setSignalType] = useState<string>('medicine_demand');
  const [customSignalName, setCustomSignalName] = useState<string>('');
  const [isCustomSignal, setIsCustomSignal] = useState<boolean>(false);
  const [value, setValue] = useState<string>('220');

  // Data Source Details
  const [sourcePreset, setSourcePreset] = useState<string>('Pharmacy POS Network');
  const [customSource, setCustomSource] = useState<string>('District Central Pharmacy');
  const [isCustomSource, setIsCustomSource] = useState<boolean>(false);

  const [autoRunRisk, setAutoRunRisk] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Security guard: only open if user is ADMIN
  if (!isOpen || user?.role !== 'ADMIN') return null;

  const handleApplyDistrictPreset = (presetKey: string) => {
    const preset = DISTRICT_PRESETS[presetKey];
    if (preset) {
      setDistrict(preset.district);
      setLocationName(preset.defaultWard);
      setLatitude(preset.lat.toString());
      setLongitude(preset.lng.toString());
    }
  };

  const handleResetForm = () => {
    setDistrict('Angul');
    setLocationName('Angul Central (Nalco Nagar)');
    setLatitude('20.8444');
    setLongitude('85.1511');
    setValue('180');
    setObservedOn(todayStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      showToast('error', 'Invalid Value', 'Please enter a positive numeric signal value.');
      return;
    }

    if (!locationName.trim()) {
      showToast('error', 'Missing Location', 'Please enter a Location / Ward name.');
      return;
    }

    const finalSignal = isCustomSignal ? (customSignalName.trim() || 'custom_signal') : signalType;
    const finalSource = isCustomSource ? (customSource.trim() || 'Custom Facility') : sourcePreset;
    const finalDistrict = district.trim() || locationName.trim();

    setSubmitting(true);
    try {
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
      <div className="relative w-full max-w-2xl glass-panel-glow rounded-3xl p-6 sm:p-8 bg-slate-900 shadow-2xl border border-slate-700/80 my-8 max-h-[92vh] overflow-y-auto">
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
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Admin Health Signal Ingestion
                </h3>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Admin Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Input syndromic telemetry by District & Location name — automatically updates real-world map & risk scores
              </p>
            </div>
          </div>
        </div>

        {/* Ingestion Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
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
                  placeholder="e.g. Angul Central, Nalco Nagar, Saheed Nagar"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            {/* GPS Coordinates */}
            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>

          {/* Date & Observed Signal Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Observation Date</span>
              </label>
              <input
                type="date"
                value={observedOn}
                onChange={(e) => setObservedOn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Observed Value */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Observed Signal Value</span>
              </label>
              <input
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 180"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
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
                {isCustomSignal ? '← Choose Standard Signal' : '+ Type Custom Signal Name'}
              </button>
            </div>

            {isCustomSignal ? (
              <input
                type="text"
                value={customSignalName}
                onChange={(e) => setCustomSignalName(e.target.value)}
                placeholder="e.g. Dengue NS1 Antigen Positives, Acute Diarrhea Logs"
                className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            ) : (
              <select
                value={signalType}
                onChange={(e) => setSignalType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="medicine_demand">Medicine Demand (Antipyretic / Analgesic Units)</option>
                <option value="fever_cases">Fever Indicators (Syndromic Outpatient Logs)</option>
                <option value="clinic_visits">Clinic Visits (Primary Health Center Footfall)</option>
                <option value="respiratory_symptoms">Respiratory Illness (ILI / SARI Cases)</option>
                <option value="gi_symptoms">Gastrointestinal / Acute Waterborne Diarrhea</option>
              </select>
            )}
          </div>

          {/* Data Source */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Data Source (Facility / Network)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomSource(!isCustomSource)}
                className="text-[11px] text-purple-400 hover:text-purple-300 underline"
              >
                {isCustomSource ? '← Choose Standard Facility' : '+ Custom Facility / Lab Name'}
              </button>
            </div>

            {isCustomSource ? (
              <input
                type="text"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                placeholder="e.g. Angul District Headquarters Hospital, Apollo Pharmacy Angul"
                className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            ) : (
              <select
                value={sourcePreset}
                onChange={(e) => setSourcePreset(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Pharmacy POS Network">Pharmacy POS Network (Retail OTC Sales Telemetry)</option>
                <option value="Community Health Center (CHC)">Community Health Center (CHC / PHC Syndromic Logs)</option>
                <option value="District Hospital Emergency (HMIS)">District Hospital Emergency Triage (HMIS / IDSP)</option>
                <option value="Diagnostic Pathology Lab">Diagnostic Pathology Laboratory Positivity</option>
                <option value="Field ASHA Mobile App">Field ASHA / Anganwadi Mobile Health Telemetry</option>
                <option value="Water Quality & Sanitation Dept">Water Quality & Sanitation Testing Unit</option>
              </select>
            )}
          </div>

          {/* Auto-Run Risk Engine Checkbox */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <input
              type="checkbox"
              id="autoRiskCheckbox"
              checked={autoRunRisk}
              onChange={(e) => setAutoRunRisk(e.target.checked)}
              className="w-4 h-4 text-brand-600 bg-slate-900 border-slate-700 rounded focus:ring-brand-500"
            />
            <label htmlFor="autoRiskCheckbox" className="text-xs text-slate-300 cursor-pointer">
              <strong>Auto-Recalculate 4-Pillar Risk Engine</strong> & update geospatial map instantly
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-brand-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 shadow-lg shadow-purple-950/60 transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Adding & Updating...' : 'Successfully Add Signal'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
