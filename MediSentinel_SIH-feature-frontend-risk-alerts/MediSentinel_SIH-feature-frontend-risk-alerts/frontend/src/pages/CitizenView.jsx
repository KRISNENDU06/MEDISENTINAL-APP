import React, { useState } from 'react';
import { useRisk } from '../context/useRisk';
import { HEALTHCARE_FACILITIES } from '../data/mockRiskData';
import {
  ShieldCheck,
  AlertTriangle,
  Hospital,
  Phone,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export default function CitizenView() {
  const { areas, selectedAreaId, setSelectedAreaId } = useRisk();
  const [selectedWard, setSelectedWard] = useState(selectedAreaId || 'area-1');

  const activeArea = areas.find((a) => a.id === selectedWard) || areas[0];
  const isHigh = activeArea?.riskLevel === 'HIGH';
  const isMedium = activeArea?.riskLevel === 'MEDIUM';

  const nearbyFacilities = HEALTHCARE_FACILITIES.filter(
    (f) => f.wardId === activeArea?.id || f.type === 'GOVT_HOSPITAL'
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-2 border-b border-slate-200">
        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
          Public Citizen Health Advisory Portal
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          Bhubaneswar Neighborhood Health & Safety Index
        </h1>
        <p className="text-xs text-slate-500 max-w-xl mx-auto">
          Real-time community health advisory powered by privacy-preserving AI surveillance. Check your micro-ward safety rating and locate nearest fever triage clinics.
        </p>

        {/* Ward Selector */}
        <div className="pt-3 max-w-xs mx-auto">
          <label className="block text-xs font-semibold text-slate-700 mb-1 text-left">
            Select Your Neighborhood Ward:
          </label>
          <select
            value={selectedWard}
            onChange={(e) => {
              setSelectedWard(e.target.value);
              setSelectedAreaId(e.target.value);
            }}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs outline-none cursor-pointer focus:border-indigo-500"
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.riskLevel === 'HIGH' ? '⚠️ Alert Zone' : '✅ Stable'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Safety Status Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isHigh
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : isMedium
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-emerald-50 border-emerald-300 text-emerald-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div
            className={`p-3.5 rounded-2xl shrink-0 ${
              isHigh ? 'bg-rose-600 text-white' : isMedium ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isHigh ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-lg font-bold">
                {isHigh
                  ? 'Heightened Fever & Infection Alert Active'
                  : isMedium
                  ? 'Moderate Surveillance Watch in Progress'
                  : 'Low Risk — Neighborhood Transmission is Normal'}
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white/80 rounded border">
                Status: {activeArea?.riskLevel}
              </span>
            </div>

            <p className="text-xs opacity-90 leading-relaxed">
              {isHigh
                ? `MediSentinel has flagged a 60%+ increase in syndromic fever cases in ${activeArea?.name}. Residents are urged to adopt mosquito/vector precautions and avoid self-medication.`
                : isMedium
                ? `Minor symptom variations observed in ${activeArea?.name}. Community health centers are actively monitoring outpatient visits.`
                : `No anomalous infection clusters detected in ${activeArea?.name}. Standard seasonal hygiene is recommended.`}
            </p>
          </div>
        </div>
      </div>

      {/* Citizen Do's & Don'ts Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600" />
            Recommended Precautionary Guidelines
          </h3>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
              <span>Inspect water storage tanks and flower pot saucers twice a week for mosquito breeding.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
              <span>Drink boiled or filtered water, especially during monsoon and seasonal transitions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
              <span>Wear full-sleeve protective clothing during dusk and dawn vector-active hours.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600" />
            When to Seek Immediate Medical Evaluation
          </h3>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
              <span>High fever exceeding 102°F persisting for more than 48 hours.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
              <span>Severe headache, eye pain, joint stiffness, or unusual skin petechiae/rashes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
              <span>
                <strong>Do NOT consume OTC Aspirin, Ibuprofen, or unprescribed antibiotics</strong> without doctor consultation.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Nearest Healthcare Facilities */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Hospital size={16} className="text-indigo-600" />
              Nearest Designated Primary Health Centers & Testing Labs
            </h3>
            <p className="text-xs text-slate-500">
              Walk-in syndromic triage clinics accessible to {activeArea?.name} residents.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Emergency Helpline: <strong>108 / 1929</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {nearbyFacilities.map((fac) => (
            <div key={fac.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{fac.name}</h4>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">
                    {fac.type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                  {fac.bedsAvailable} Beds Open
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 text-slate-600">
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" /> {fac.contact}
                </span>
                <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-0.5">
                  Free OPD Triage <ExternalLink size={10} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
