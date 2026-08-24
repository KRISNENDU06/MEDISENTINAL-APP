import React, { useState } from 'react';
import { X, Activity, AlertTriangle, CheckCircle2, PhoneCall, HeartPulse, ShieldAlert, ArrowRight, RotateCcw } from 'lucide-react';

interface SymptomCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFacilities?: () => void;
}

const SYMPTOM_OPTIONS = [
  { id: 'fever_high', label: 'High Fever (>101°F)', weight: 3, icon: '🌡️' },
  { id: 'joint_pain', label: 'Severe Joint & Muscle Pain (Breakbone)', weight: 3, icon: '🦴' },
  { id: 'skin_rash', label: 'Skin Rashes or Petechiae', weight: 2, icon: '🔴' },
  { id: 'vomiting_diarrhea', label: 'Vomiting / Watery Diarrhea', weight: 3, icon: '💧' },
  { id: 'cough_throat', label: 'Dry Cough & Sore Throat', weight: 1, icon: '😷' },
  { id: 'bleeding_gum', label: 'Bleeding Gums or Nosebleeds (Red Flag)', weight: 5, icon: '⚠️' },
  { id: 'extreme_fatigue', label: 'Extreme Weakness / Inability to drink', weight: 3, icon: '⚡' },
];

export const SymptomCheckerModal: React.FC<SymptomCheckerModalProps> = ({ isOpen, onClose, onOpenFacilities }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>('1-2');
  const [ageGroup, setAgeGroup] = useState<string>('adult');

  if (!isOpen) return null;

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const calculateTriage = () => {
    const hasRedFlag = selectedSymptoms.includes('bleeding_gum') || (selectedSymptoms.includes('fever_high') && duration === '5+');
    const totalScore = selectedSymptoms.reduce((acc, sId) => {
      const opt = SYMPTOM_OPTIONS.find((o) => o.id === sId);
      return acc + (opt?.weight || 1);
    }, 0);

    if (hasRedFlag || totalScore >= 7) {
      return {
        level: 'CRITICAL',
        title: '🔴 Urgent Medical Attention Required',
        badge: 'Emergency Triage',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        summary: 'Your symptoms match critical indicators for Acute Vector-Borne (Dengue/Malaria) or Severe Dehydration. Do not self-medicate.',
        action: 'Visit nearest Government Hospital Emergency immediately or call 108 ambulance.',
        color: 'rose',
      };
    }

    if (totalScore >= 3 || duration === '3-5') {
      return {
        level: 'MODERATE',
        title: '🟡 Outpatient Primary Health Clinic Recommended',
        badge: 'Moderate Sentinel Watch',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        summary: 'Your symptom pattern indicates early syndromic viral or bacterial infection. Blood test (CBC / NS1 Antigen) is recommended within 24 hours.',
        action: 'Visit your nearest Urban Primary Health Centre (UPHC) for free fever checkup and hydration.',
        color: 'amber',
      };
    }

    return {
      level: 'MILD',
      title: '🟢 Mild Syndromic Symptoms — Home Care Protocol',
      badge: 'Routine Home Care',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      summary: 'Symptoms appear mild. Follow community preventive care, consume plenty of fluids & oral electrolytes (ORS).',
      action: 'Rest well, monitor temperature every 6 hours. If fever crosses 101°F for 48h, consult a doctor.',
      color: 'emerald',
    };
  };

  const triage = calculateTriage();

  const resetAll = () => {
    setSelectedSymptoms([]);
    setDuration('1-2');
    setAgeGroup('adult');
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Citizen Smart Symptom Checker
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Step {step} of 3
                </span>
              </h2>
              <p className="text-xs text-slate-400">Instant AI-assisted syndromic triage for you & your family</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* STEP 1: Select Symptoms */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">1. What symptoms are being experienced?</h3>
                <p className="text-xs text-slate-400">Select all symptoms present in the last 72 hours</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SYMPTOM_OPTIONS.map((opt) => {
                  const isSelected = selectedSymptoms.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleSymptom(opt.id)}
                      className={`flex items-center gap-3 p-3 text-left rounded-xl border transition-all text-xs ${
                        isSelected
                          ? 'bg-brand-500/15 border-brand-500 text-slate-100 shadow-md shadow-brand-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span className="font-medium flex-1">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Duration & Category */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">2. How long have the symptoms persisted?</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: '1-2', label: '1 - 2 Days', sub: 'Onset phase' },
                    { id: '3-5', label: '3 - 5 Days', sub: 'Persistent' },
                    { id: '5+', label: 'More than 5 Days', sub: 'Extended' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDuration(item.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        duration === item.id
                          ? 'bg-brand-500/20 border-brand-500 text-slate-100 font-semibold'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <p className="text-xs font-semibold">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Who is the assessment for?</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'child', label: '👶 Child (<12y)' },
                    { id: 'adult', label: '🧑 Adult (18-59y)' },
                    { id: 'senior', label: '👵 Senior (60y+)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setAgeGroup(item.id)}
                      className={`p-3 rounded-xl border text-center transition-all text-xs ${
                        ageGroup === item.id
                          ? 'bg-brand-500/20 border-brand-500 text-slate-100 font-semibold'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Triage Recommendation */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`p-4 rounded-xl border ${triage.badgeColor} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">{triage.badge}</span>
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-100">{triage.title}</h3>
                <p className="text-xs text-slate-200 leading-relaxed">{triage.summary}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-brand-400" />
                  Recommended Action SOP:
                </h4>
                <p className="text-xs text-slate-200 font-medium">{triage.action}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {triage.level === 'CRITICAL' && (
                  <a
                    href="tel:108"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Call 108 Emergency Ambulance
                  </a>
                )}
                {onOpenFacilities && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenFacilities();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-brand-600/20"
                  >
                    🏥 Find Nearest UPHC / Pharmacy
                  </button>
                )}
                <button
                  onClick={resetAll}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && selectedSymptoms.length === 0) {
                  return;
                }
                setStep((s) => (s + 1) as 2 | 3);
              }}
              disabled={step === 1 && selectedSymptoms.length === 0}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
                step === 1 && selectedSymptoms.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30'
              }`}
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            >
              Close Triage
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
