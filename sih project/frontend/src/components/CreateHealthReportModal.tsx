import React, { useState } from 'react';
import {
  X,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Trash2,
  Send,
  Activity,
  Stethoscope,
  Sparkles,
  Droplets,
  Bug,
  Thermometer,
  Users,
  Building2,
  Radio,
  CheckCircle2,
  ChevronRight,
  Info,
  MapPin,
  Navigation,
  Calendar,
  Volume2,
  Microscope,
  Ambulance,
} from 'lucide-react';
import { api, AreaSummary } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ODISHA_ALL_DISTRICTS, DistrictConfig, SubLocation } from '../constants/odishaDistricts';

interface CreateHealthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: AreaSummary[];
  onReportCreated: () => void;
}


const OUTBREAK_ETIOLOGY = [
  { id: 'vector', label: '🦟 Vector-Borne (Dengue / Chikungunya / Malaria)', color: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
  { id: 'water', label: '💧 Water-Borne & Enteric (Cholera / Diarrhea / Typhoid)', color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10' },
  { id: 'respiratory', label: '🫁 Respiratory & Airborne (ILI / SARI / Influenza)', color: 'text-blue-300 border-blue-500/40 bg-blue-500/10' },
  { id: 'fever', label: '🌡️ Pyrexia of Unknown Origin (PUO / Acute Febrile)', color: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
  { id: 'zoonotic', label: '🐾 Zoonotic & Scrub Typhus / Leptospirosis', color: 'text-purple-300 border-purple-500/40 bg-purple-500/10' },
];

const PRESET_SIGNALS = [
  'Acute Fever Cluster Surge (+55%)',
  'OTC Paracetamol / Dolo Demand (+60%)',
  'Vector Larval Density High (Breteau Index >35)',
  'Drinking Water Turbidity & Coliform Detected',
  'Acute Diarrheal Footfall & ORS Demand (+40%)',
  'Upper Respiratory / SARI Triage Spike (+35%)',
  'Platelet Drop / Severe Arthralgia Clustered',
];

const PRESET_RECOMMENDATIONS = [
  'Deploy municipal chemical vector fogging & anti-larval Abate treatment immediately',
  'Establish 24/7 fever triage desk and rapid test booth at local UPHC',
  'Issue immediate drinking water boiling advisory and distribute chlorine/halogen tablets',
  'Distribute free ORS and antipyretics via ASHA and community mobile health workers',
  'Conduct door-to-door syndromic fever survey across 50 contiguous households',
  'Deploy District Rapid Response Team (RRT) & Mobile Medical Unit (MMU)',
];

export const CreateHealthReportModal: React.FC<CreateHealthReportModalProps> = ({
  isOpen,
  onClose,
  areas,
  onReportCreated,
}) => {
  const { user, isAdmin, isHealthOfficial, quickLogin } = useAuth();
  const { showToast } = useToast();

  // Location / Ward Selection State
  const [selectedDistrictKey, setSelectedDistrictKey] = useState<string>('Angul');
  const [district, setDistrict] = useState<string>('Angul');
  const [targetWard, setTargetWard] = useState<string>('Angul Town Ward 8 (Nalco Nagar)');

  // Epidemiological Classification
  const [outbreakEtiology, setOutbreakEtiology] = useState<string>(OUTBREAK_ETIOLOGY[0].id);
  const [reportTitle, setReportTitle] = useState<string>(
    'Field Directive: Syndromic Surveillance Assessment & Containment Protocol'
  );
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');

  // Quantitative Triage Metrics
  const [activeCases, setActiveCases] = useState<string>('24');
  const [hospitalizedCases, setHospitalizedCases] = useState<string>('5');
  const [vulnerableGroups, setVulnerableGroups] = useState<string[]>([
    'Infants & Children (<5 yrs)',
    'Elderly (>60 yrs)',
  ]);
  const [exposureSource, setExposureSource] = useState<string>(
    'Stagnant rainwater in construction plots & broken storm runoff'
  );

  // Field Lab & Testing Status
  const [labStatus, setLabStatus] = useState<string>(
    'Blood Serum Dispatched for NS1/IgM ELISA (RMRC/DPHL)'
  );

  // Rapid Response Team (RRT) Level
  const [rrtLevel, setRrtLevel] = useState<string>('Level 2: Medical Officer + Sanitary Squad on Site');

  // Multilingual Public Broadcast Checkbox
  const [broadcastMultilingual, setBroadcastMultilingual] = useState<boolean>(true);

  // Signals & SOP Recommendations
  const [selectedSignals, setSelectedSignals] = useState<string[]>([
    'Acute Fever Cluster Surge (+55%)',
    'OTC Paracetamol / Dolo Demand (+60%)',
  ]);
  const [customSignal, setCustomSignal] = useState<string>('');

  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'Door-to-door sentinel survey across households revealed clustered febrile illness with joint pain and thrombocytopenia. Localized pharmacy retail OTC purchases indicate elevated syndromic demand.'
  );

  const [recommendations, setRecommendations] = useState<string[]>([
    'Deploy municipal chemical vector fogging & anti-larval Abate treatment immediately',
    'Establish 24/7 fever triage desk and rapid test booth at local UPHC',
    'Conduct door-to-door syndromic fever survey across 50 contiguous households',
  ]);
  const [customRec, setCustomRec] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Apply district preset
  const handleApplyDistrictPreset = (presetKey: string) => {
    setSelectedDistrictKey(presetKey);
    const preset = ODISHA_ALL_DISTRICTS[presetKey];
    if (preset) {
      setDistrict(preset.district);
      setTargetWard(preset.defaultWard);
    }
  };

  // Toggle Signals
  const toggleSignal = (sig: string) => {
    setSelectedSignals((prev) =>
      prev.includes(sig) ? prev.filter((s) => s !== sig) : [...prev, sig]
    );
  };

  const addCustomSignal = () => {
    if (customSignal.trim() && !selectedSignals.includes(customSignal.trim())) {
      setSelectedSignals([...selectedSignals, customSignal.trim()]);
      setCustomSignal('');
    }
  };

  const removeSignal = (sig: string) => {
    setSelectedSignals(selectedSignals.filter((s) => s !== sig));
  };

  // Toggle Recommendations
  const toggleRecommendation = (rec: string) => {
    setRecommendations((prev) =>
      prev.includes(rec) ? prev.filter((r) => r !== rec) : [...prev, rec]
    );
  };

  const addCustomRec = () => {
    if (customRec.trim() && !recommendations.includes(customRec.trim())) {
      setRecommendations([...recommendations, customRec.trim()]);
      setCustomRec('');
    }
  };

  const removeRec = (rec: string) => {
    setRecommendations(recommendations.filter((r) => r !== rec));
  };

  // Toggle Vulnerable Groups
  const toggleVulnerable = (item: string) => {
    setVulnerableGroups((prev) =>
      prev.includes(item) ? prev.filter((g) => g !== item) : [...prev, item]
    );
  };

  // ✨ 1-Click AI Epidemiological IDSP Clinical Note Generator
  const generateAIClinicalNote = () => {
    const etiologyObj = OUTBREAK_ETIOLOGY.find((e) => e.id === outbreakEtiology);
    const etiologyText = etiologyObj ? etiologyObj.label.split('(')[0].trim() : 'Syndromic Outbreak';
    const vulnText = vulnerableGroups.length > 0 ? vulnerableGroups.join(', ') : 'General population';

    const generated = `[OFFICIAL IDSP / IHIP EPIDEMIOLOGICAL DIRECTIVE]
Location: ${targetWard.trim()} (${district.trim()}) | Date: ${new Date().toISOString().split('T')[0]}
Suspected Etiology: ${etiologyText} | Clinical Risk Status: ${riskLevel} RISK

EPIDEMIOLOGICAL TRIAGE METRICS:
- Active Symptomatic Cases: ${activeCases || '0'} identified in active cluster.
- Inpatient Hospitalizations: ${hospitalizedCases || '0'} admitted at CHC/DHH triage.
- High-Risk Populations: ${vulnText}.
- Primary Exposure Focus: ${exposureSource || 'Under active field investigation'}.

DIAGNOSTIC & SURVEILLANCE STATUS:
- Laboratory Pipeline: ${labStatus}.
- RRT Deployment: ${rrtLevel}.
- Multi-Signal Indicator: Observed ${selectedSignals.join('; ')}.

PUBLIC HEALTH CONTAINMENT DIRECTIVE:
Rapid containment cordon established. Medical mobile teams executing fever screening, point-of-care rapid testing, and distribution of prophylactic kits. Public advisories dispatched.`;

    setClinicalNotes(generated);
    showToast('success', 'AI IDSP Clinical Note Generated', 'Structured epidemiological summary synthesized successfully.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWard.trim()) {
      showToast('error', 'Validation Error', 'Please specify a target ward or location.');
      return;
    }
    if (!reportTitle.trim()) {
      showToast('error', 'Validation Error', 'Please enter a report title.');
      return;
    }
    if (selectedSignals.length === 0) {
      showToast('error', 'Validation Error', 'Please record at least one observed health signal.');
      return;
    }
    if (recommendations.length === 0) {
      showToast('error', 'Validation Error', 'Please specify at least one actionable recommendation.');
      return;
    }

    setSubmitting(true);
    try {
      // Auto-authenticate as Health Official if currently in viewer mode
      if (!isAdmin && !isHealthOfficial) {
        const loggedIn = await quickLogin('HEALTH_OFFICIAL');
        if (!loggedIn) {
          showToast('error', 'Authentication Required', 'Please log in as Health Official or Admin.');
          setSubmitting(false);
          return;
        }
      }

      const matchingArea =
        areas.find((a) => a.name.toLowerCase().includes(targetWard.toLowerCase().trim())) ||
        areas.find((a) => a.district.toLowerCase() === district.toLowerCase().trim()) ||
        areas[0];

      const numericAreaId = typeof matchingArea?.id === 'number' ? matchingArea.id : undefined;

      // Include rich structured epidemiological metadata in signals payload
      const richSignals = [
        ...selectedSignals,
        `Active Cases: ${activeCases}`,
        `Hospitalized: ${hospitalizedCases}`,
        `Etiology: ${outbreakEtiology.toUpperCase()}`,
        `RRT: ${rrtLevel}`,
        ...(broadcastMultilingual ? ['Multilingual Voice Advisory Broadcast: ACTIVE'] : []),
      ];

      await api.createHealthReport({
        area_id: numericAreaId,
        area_name: targetWard.trim(),
        report_title: reportTitle.trim(),
        observed_signals: richSignals,
        risk_level: riskLevel,
        clinical_notes: clinicalNotes.trim(),
        recommendations: recommendations,
        officer_name: user?.full_name || 'Dr. Priya Das (District Health Official)',
        officer_designation:
          user?.role === 'ADMIN' ? 'Chief Medical Administrator' : 'District Surveillance Officer (DSO / IDSP)',
        is_public: true,
      });

      showToast(
        'success',
        'Official Health Report Published',
        `Official IDSP Health Report for ${targetWard.trim()} (${district.trim()}) published to MEDISENTINEL feed.`
      );
      onReportCreated();
      onClose();
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message || 'Could not publish health report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  File Official Ward Health Report
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-bold">
                  IDSP / IHIP Protocol
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline font-semibold">
                  Authorized Officer Mode
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Record epidemiological triage, assign clinical risk level & issue actionable containment directives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Auth Banner for Viewer Mode */}
          {!isAdmin && !isHealthOfficial && (
            <div className="p-3.5 bg-blue-950/40 border border-blue-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  You are in Public Mode. Publishing will automatically verify you as <strong>District Health Official</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await quickLogin('HEALTH_OFFICIAL');
                  showToast('success', 'Health Official Session Active', 'Logged in as Dr. Priya Das (District Health Official)');
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[11px] whitespace-nowrap shadow-md transition-all active:scale-95"
              >
                1-Click Auth as Health Official
              </button>
            </div>
          )}

          {/* Section 1: Target Ward & Location Presets */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-3">
            {/* Quick District Presets Chips */}
            <div>
              <div className="text-[11px] text-blue-300 font-semibold mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Odisha District Presets:
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Click to auto-populate wards</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(ODISHA_ALL_DISTRICTS).map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => handleApplyDistrictPreset(cityName)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all font-mono active:scale-95 ${
                      district.toLowerCase().includes(cityName.toLowerCase())
                        ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-sm'
                        : 'bg-slate-900 hover:bg-blue-900/40 text-slate-300 hover:text-blue-200 border-slate-700 hover:border-blue-500/50'
                    }`}
                  >
                    +{cityName}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Location / Localities Chips */}
            {ODISHA_ALL_DISTRICTS[selectedDistrictKey]?.subLocations && (
              <div className="pt-1">
                <div className="text-[10px] text-blue-300 font-semibold mb-1 flex items-center justify-between">
                  <span>📍 Sub-Locations & Wards in {selectedDistrictKey}:</span>
                  <span className="text-[9px] text-slate-500">1-Click target ward selection</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ODISHA_ALL_DISTRICTS[selectedDistrictKey].subLocations.map((sub) => {
                    const isSelected = targetWard === sub.name;
                    return (
                      <button
                        key={sub.name}
                        type="button"
                        onClick={() => setTargetWard(sub.name)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          isSelected
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500 font-semibold shadow-sm'
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
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span>District Name *</span>
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Angul, Khurda, Cuttack, Puri"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Target Ward / Surveillance Location *</span>
                </label>
                <input
                  type="text"
                  value={targetWard}
                  onChange={(e) => setTargetWard(e.target.value)}
                  placeholder="e.g. Angul Town Ward 8 (Nalco Nagar), Pallahara"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Risk Level & Outbreak Etiology */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assigned Clinical Risk Level (Retained & Enhanced) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Assigned Clinical Risk Level *
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Officer Discretion</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setRiskLevel(lvl)}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all border text-center ${
                      riskLevel === lvl
                        ? lvl === 'HIGH'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                          : lvl === 'MEDIUM'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {lvl === 'HIGH' ? '🔴 HIGH' : lvl === 'MEDIUM' ? '🟡 MEDIUM' : '🟢 LOW'}
                  </button>
                ))}
              </div>
            </div>

            {/* Suspected Outbreak Etiology */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5 text-blue-400" />
                  Suspected Outbreak Etiology *
                </span>
                <span className="text-[10px] text-slate-500 font-normal">IDSP Category</span>
              </label>
              <select
                value={outbreakEtiology}
                onChange={(e) => setOutbreakEtiology(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                {OUTBREAK_ETIOLOGY.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Quantitative Field Triage Metrics */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Quantitative Field Triage & Impact Metrics
              </span>
              <span className="text-[10px] text-slate-500">IDSP Field Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Active Symptomatic Cases (Cluster Count)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={activeCases}
                    onChange={(e) => setActiveCases(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-1.5 text-[10px] text-slate-500">patients</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Inpatient Hospital / CHC Admissions
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={hospitalizedCases}
                    onChange={(e) => setHospitalizedCases(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-1.5 text-[10px] text-slate-500">admitted</span>
                </div>
              </div>
            </div>

            {/* Vulnerable Demographic Impact */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-purple-400" />
                <span>High-Risk Populations Affected:</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Infants & Children (<5 yrs)',
                  'Elderly (>60 yrs)',
                  'Pregnant Women',
                  'High-Density Slum / Informal Settlement',
                  'Immuno-compromised / Chronic Ill',
                ].map((group) => {
                  const active = vulnerableGroups.includes(group);
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => toggleVulnerable(group)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                        active
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {group}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Probable Exposure Source */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Probable Environmental / Exposure Source
              </label>
              <input
                type="text"
                value={exposureSource}
                onChange={(e) => setExposureSource(e.target.value)}
                placeholder="e.g. Stagnant rainwater in construction plots, broken drinking water pipeline"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 4: Laboratory & RRT Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Microscope className="w-3.5 h-3.5 text-cyan-400" />
                <span>Diagnostic & Lab Pipeline Status</span>
              </label>
              <select
                value={labStatus}
                onChange={(e) => setLabStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Blood Serum Dispatched for NS1/IgM ELISA (RMRC/DPHL)">
                  Blood Serum Dispatched for NS1/IgM ELISA (RMRC/DPHL)
                </option>
                <option value="Water Quality & Turbidity Samples Dispatched to PHED Lab">
                  Water Quality & Turbidity Samples Dispatched to PHED Lab
                </option>
                <option value="Stool & Rectal Swab Cultures under incubation">
                  Stool & Rectal Swab Cultures under incubation
                </option>
                <option value="Rapid Antigen / Malarial RDT Testing Completed on-site">
                  Rapid Antigen / Malarial RDT Testing Completed on-site
                </option>
                <option value="Awaiting Secondary Confirmation from SCB Medical College">
                  Awaiting Secondary Confirmation from SCB Medical College
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Ambulance className="w-3.5 h-3.5 text-rose-400" />
                <span>Rapid Response Team (RRT) Status</span>
              </label>
              <select
                value={rrtLevel}
                onChange={(e) => setRrtLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Level 1: ASHA & Anganwadi Door-to-Door Household Survey">
                  Level 1: ASHA & Anganwadi Door-to-Door Survey Active
                </option>
                <option value="Level 2: Medical Officer + Sanitary Squad on Site">
                  Level 2: Medical Officer + Sanitary Squad on Site
                </option>
                <option value="Level 3: Full District RRT + Mobile Health Unit (MMU) Deployed">
                  Level 3: Full District RRT + Mobile Health Unit Deployed
                </option>
              </select>
            </div>
          </div>

          {/* Section 5: Official Report Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Official Report Title / Surveillance Directive *
            </label>
            <input
              type="text"
              required
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g. Field Directive: Vector Surveillance & Screening at Nalco Nagar"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Section 6: Observed Health Signals */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Observed Health Signals & Field Data *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SIGNALS.map((sig) => {
                const active = selectedSignals.includes(sig);
                return (
                  <button
                    type="button"
                    key={sig}
                    onClick={() => toggleSignal(sig)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                      active
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {sig}
                  </button>
                );
              })}
            </div>

            {/* Custom Signal */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customSignal}
                onChange={(e) => setCustomSignal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSignal();
                  }
                }}
                placeholder="Or type custom observed field signal & press Enter..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addCustomSignal}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Add Signal
              </button>
            </div>
          </div>

          {/* Section 7: Doctor's Clinical Notes & AI Generator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Doctor's Clinical Notes & Sentinel Assessment
              </label>
              <button
                type="button"
                onClick={generateAIClinicalNote}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold transition-all active:scale-95 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>✨ Auto-Generate IDSP Clinical Note</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter epidemiological findings, syndromic pattern, or lab verification notes..."
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-mono"
            />
          </div>

          {/* Section 8: Actionable Recommendations */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Official Directives & Actionable Recommendations *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_RECOMMENDATIONS.map((rec) => {
                const active = recommendations.includes(rec);
                return (
                  <button
                    type="button"
                    key={rec}
                    onClick={() => toggleRecommendation(rec)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition-colors ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {rec}
                  </button>
                );
              })}
            </div>

            {/* Custom Recommendation */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customRec}
                onChange={(e) => setCustomRec(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomRec();
                  }
                }}
                placeholder="Or write custom recommendation directive & press Enter..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addCustomRec}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Add Directive
              </button>
            </div>
          </div>

          {/* Section 9: Multilingual Audio Broadcast Checkbox */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/30">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="multilingualBroadcast"
                checked={broadcastMultilingual}
                onChange={(e) => setBroadcastMultilingual(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
              />
              <label htmlFor="multilingualBroadcast" className="text-xs text-slate-200 cursor-pointer">
                <strong>Dispatch Multilingual Voice & Citizen Advisory</strong> (Auto-triggers Odia, Hindi & English voice pack)
              </label>
            </div>
            <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Published directly to MEDISENTINEL live surveillance feed
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Publishing Report...' : 'Publish Official Health Report'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

