import React, { useMemo, useState } from 'react';
import { AreaSummary, api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, MapPin, CalendarDays, Activity, Pill, Stethoscope, Building2, UploadCloud, CheckCircle2 } from 'lucide-react';

interface AddObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: AreaSummary[];
  onObservationAdded: () => void;
}

type ProviderType = 'PRIVATE_CLINIC'|'GOVERNMENT_CLINIC'|'HOSPITAL'|'DOCTOR'|'MUNICIPAL_HEALTH_AUTHORITY'|'GOVERNMENT_HEALTH_OFFICIAL'|string;

const PROVIDER_LABELS: Record<string,string> = {
  PRIVATE_CLINIC: 'Private Clinic',
  GOVERNMENT_CLINIC: 'Government Clinic',
  HOSPITAL: 'Hospital',
  DOCTOR: 'Doctor',
  MUNICIPAL_HEALTH_AUTHORITY: 'Municipal Health Authority',
  GOVERNMENT_HEALTH_OFFICIAL: 'Government Health Official',
};

const DISEASES = ['Dengue','Malaria','Chikungunya','Influenza / ILI','Acute Diarrhoeal Disease','Typhoid'];

function recommendedDisease(): string {
  const month = new Date().getMonth() + 1;
  if ([6,7,8,9,10].includes(month)) return 'Dengue';
  if ([3,4,5].includes(month)) return 'Acute Diarrhoeal Disease';
  if ([11,12,1,2].includes(month)) return 'Influenza / ILI';
  return 'Dengue';
}

export const AddObservationModal: React.FC<AddObservationModalProps> = ({ isOpen, onClose, areas, onObservationAdded }) => {
  const { user, canAddObservations } = useAuth();
  const { showToast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const recommended = useMemo(() => recommendedDisease(), []);

  const [areaId, setAreaId] = useState<number>(() => areas[0]?.rawId || 0);
  const [observedOn, setObservedOn] = useState(today);
  const [disease, setDisease] = useState(recommended);
  const [medicineDemand, setMedicineDemand] = useState('');
  const [feverCases, setFeverCases] = useState('');
  const [clinicVisits, setClinicVisits] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !canAddObservations) return null;

  const providerType = (user?.provider_type || 'GOVERNMENT_HEALTH_OFFICIAL') as ProviderType;
  const providerLabel = PROVIDER_LABELS[providerType] || 'Authorized Health Data Provider';
  const selectedArea = areas.find(area => area.rawId === areaId);

  const reset = () => {
    setAreaId(areas[0]?.rawId || 0);
    setObservedOn(today);
    setDisease(recommended);
    setMedicineDemand('');
    setFeverCases('');
    setClinicVisits('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!areaId) {
      showToast('error','Area Required','Select the reporting area first.');
      return;
    }
    const medicine = Number(medicineDemand) || 0;
    const fever = Number(feverCases) || 0;
    const visits = Number(clinicVisits) || 0;
    if (medicine <= 0 && fever <= 0 && visits <= 0) {
      showToast('error','Enter Record Data','Add at least one numeric health record.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.createProviderObservation({
        area_id: areaId,
        observed_on: observedOn,
        disease,
        medicine_demand: medicine,
        fever_cases: fever,
        clinic_visits: visits,
        data_quality_score: 0.95,
      });
      showToast('success','Data Uploaded',`${providerLabel}: ${result.message} Risk score: ${result.assessment?.risk_score ?? 'updated'}/100.`);
      onObservationAdded();
      reset();
      onClose();
    } catch (error: any) {
      showToast('error','Upload Failed',error.message || 'Could not save the health record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-cyan-500/30 via-blue-600/20 to-emerald-500/10" />
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -left-20 top-24 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />

        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>

        <div className="relative px-6 pb-5 pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white">Official Health Data Upload</h2>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">Authorized</span>
              </div>
              <p className="text-xs text-slate-300">Minimal entry. Area-level numbers only. MEDISENTINEL recalculates the risk assessment automatically.</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-400/10 px-3 py-1.5 text-[11px] font-semibold text-blue-100">
                <Building2 className="h-3.5 w-3.5" /> {providerLabel}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="relative space-y-4 px-6 pb-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Reporting Area</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-cyan-300" />
                <select value={areaId} onChange={e => setAreaId(Number(e.target.value))} className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/90 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-400">
                  {areas.map(area => <option key={area.rawId} value={area.rawId}>{area.name} — {area.district}</option>)}
                </select>
              </div>
              {selectedArea && <p className="mt-1 text-[10px] text-slate-500">Dashboard target: {selectedArea.name}</p>}
            </label>

            <label>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Record Date</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-blue-300" />
                <input type="date" value={observedOn} onChange={e => setObservedOn(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-400" />
              </div>
            </label>

            <label>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Priority Disease</span>
              <select value={disease} onChange={e => setDisease(e.target.value)} className="w-full rounded-xl border border-cyan-400/30 bg-slate-900/90 py-3 px-3 text-sm font-semibold text-white outline-none focus:border-cyan-400">
                {DISEASES.map(item => <option key={item} value={item}>{item}{item === recommended ? ' — Recommended now' : ''}</option>)}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Enter record counts</p>
                <p className="text-[10px] text-slate-500">Use aggregated records from your facility. Do not enter patient names or IDs.</p>
              </div>
              <Activity className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <NumberField icon={<Pill className="h-4 w-4" />} label="Medicine Demand" value={medicineDemand} onChange={setMedicineDemand} />
              <NumberField icon={<Stethoscope className="h-4 w-4" />} label="Fever / Suspected Cases" value={feverCases} onChange={setFeverCases} />
              <NumberField icon={<Activity className="h-4 w-4" />} label="Clinic / OPD Visits" value={clinicVisits} onChange={setClinicVisits} />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3 text-[10px] leading-relaxed text-emerald-100/80">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            Only aggregate counts are uploaded. The source account is authorized for ingestion; individual patient identity is not part of the assessment.
          </div>

          <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
            <UploadCloud className="h-4 w-4" />
            {submitting ? 'Processing & Updating Dashboard…' : 'Upload & Recalculate Area Risk'}
          </button>
        </form>
      </div>
    </div>
  );
};

function NumberField({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-slate-400">{icon}{label}</span>
      <input type="number" min="0" step="1" value={value} onChange={e => onChange(e.target.value)} placeholder="0" className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-700 focus:border-cyan-400" />
    </label>
  );
}
