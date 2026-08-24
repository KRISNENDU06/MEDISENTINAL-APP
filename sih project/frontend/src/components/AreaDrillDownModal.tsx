import React, { useState } from 'react';
import { AreaSummary, api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  X,
  MapPin,
  Pill,
  Thermometer,
  Stethoscope,
  Share2,
  AlertOctagon,
  ShieldCheck,
  TrendingUp,
  Activity,
  Send,
  FileText,
  Microscope,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface AreaDrillDownModalProps {
  area: AreaSummary | null;
  onClose: () => void;
  selectedRange: number;
}

export const AreaDrillDownModal: React.FC<AreaDrillDownModalProps> = ({
  area,
  onClose,
  selectedRange,
}) => {
  const { showToast } = useToast();
  const [dispatching, setDispatching] = useState(false);
  const [advisoryOpen, setAdvisoryOpen] = useState(false);
  const [advisoryText, setAdvisoryText] = useState<{ en?: string; odia?: string; hi?: string } | null>(null);
  const [playingAdvisoryLang, setPlayingAdvisoryLang] = useState<string | null>(null);
  const [advisoryAudio, setAdvisoryAudio] = useState<HTMLAudioElement | null>(null);

  if (!area) return null;

  const handleDispatchRRT = async () => {
    setDispatching(true);
    try {
      const res = await api.dispatchRRT(area.id, area.name, `Dispatched via drill-down for risk score ${area.riskScore}`);
      showToast(
        'success',
        'Rapid Response Team Dispatched',
        `${res.dispatch.teamLeader} en route to ${area.name} (ETA: ${res.dispatch.etaMinutes}m).`
      );
    } catch (err: any) {
      showToast('error', 'Dispatch Failed', err.message || 'Could not connect to response service');
    } finally {
      setDispatching(false);
    }
  };

  const handleGenerateAdvisory = () => {
    setAdvisoryOpen(true);
    setAdvisoryText({
      en: `PUBLIC HEALTH ADVISORY (${area.name}): Early syndromic surveillance has detected anomalous fever and antipyretic drug purchasing (+${area.signals.medicineDemand.deviation}). Community members experiencing persistent fever or body ache are advised to visit the nearest Primary Health Center. Mosquito breeding control & vector management activated.`,
      odia: `ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା ସୂଚନା (${area.name}): ସିଣ୍ଡ୍ରୋମିକ୍ ନିରୀକ୍ଷଣରୁ ଜ୍ୱର ଓ ଔଷଧ ଚାହିଦା ବୃଦ୍ଧି ପାଇବା ଜଣାପଡିଛି । ଜ୍ୱର କିମ୍ବା ଶରୀର ଯନ୍ତ୍ରଣା ଲକ୍ଷଣ ଥିଲେ ତୁରନ୍ତ ନିକଟସ୍ଥ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ଯାଆନ୍ତୁ । ମଶା ନିୟନ୍ତ୍ରଣ ବ୍ୟବସ୍ଥା ଗ୍ରହଣ କରାଯାଉଛି ।`,
      hi: `जन स्वास्थ्य चेतावनी (${area.name}): सिंड्रोमिक सर्विलांस द्वारा बुखार और दवाओं की मांग में वृद्धि दर्ज की गई है (+${area.signals.medicineDemand.deviation})। तेज बुखार या शरीर दर्द होने पर तुरंत नजदीकी स्वास्थ्य केंद्र पर जाएं। मच्छर नियंत्रण अभियान सक्रिय किया गया है।`,
    });
  };

  const playAdvisoryAudio = (lang: 'english' | 'odia' | 'hindi', text: string) => {
    // If already playing this language, clicking again turns it OFF!
    if (playingAdvisoryLang === lang && advisoryAudio) {
      advisoryAudio.pause();
      advisoryAudio.currentTime = 0;
      setAdvisoryAudio(null);
      setPlayingAdvisoryLang(null);
      showToast('info', 'Audio Turned Off', `${lang.toUpperCase()} advisory playback stopped.`);
      return;
    }

    if (advisoryAudio) {
      advisoryAudio.pause();
      advisoryAudio.currentTime = 0;
    }

    const audioUrl = api.getAudioTTSUrl(lang, text);
    const audio = new Audio(audioUrl);
    setAdvisoryAudio(audio);
    setPlayingAdvisoryLang(lang);

    audio.onplay = () => {
      showToast('info', `Playing ${lang.toUpperCase()} Advisory Audio`, `Click button again anytime to turn off.`);
    };
    audio.onended = () => {
      setPlayingAdvisoryLang(null);
      setAdvisoryAudio(null);
    };
    audio.onerror = () => {
      setPlayingAdvisoryLang(null);
      setAdvisoryAudio(null);
      showToast('error', 'Audio Error', 'Unable to stream audio.');
    };
    audio.play().catch((err) => console.warn('Audio play warning:', err));
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl glass-panel-glow rounded-3xl p-6 sm:p-8 bg-slate-900/95 shadow-2xl border border-slate-700/80 my-8">
        {/* Return / Close Buttons */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-brand-400" />
            <span>← Return to Overview</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                <MapPin className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {area.name} Drill-Down
                </h2>
                <p className="text-xs text-slate-400">
                  {area.district} District • {area.state} • Coordinates: {area.latitude?.toFixed(4)}, {area.longitude?.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-extrabold text-white">{area.riskScore}/100</div>
              <div className="text-[11px] font-semibold text-slate-400">Composite Risk Score</div>
            </div>
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                area.riskLevel === 'HIGH'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : area.riskLevel === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {area.riskLevel} RISK
            </span>
          </div>
        </div>

        {/* 4 Pillars Signal Cards (Requirement 1) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
          {/* Medicine Demand */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-brand-400" />
                Medicine Demand
              </span>
            </div>
            <div className="mt-2 text-lg font-bold text-white">
              {area?.signals?.medicineDemand?.current ?? 0}{' '}
              <span className="text-xs text-slate-400 font-normal">units</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Baseline: {area?.signals?.medicineDemand?.baseline ?? 0}</span>
              <span
                className={`font-bold ${
                  (area?.signals?.medicineDemand?.deviation || '').startsWith('+') ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {area?.signals?.medicineDemand?.deviation || '+0%'}
              </span>
            </div>
          </div>

          {/* Fever Cases */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                Fever Cases
              </span>
            </div>
            <div className="mt-2 text-lg font-bold text-white">
              {area?.signals?.feverIndicators?.current ?? 0}{' '}
              <span className="text-xs text-slate-400 font-normal">cases</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Baseline: {area?.signals?.feverIndicators?.baseline ?? 0}</span>
              <span
                className={`font-bold ${
                  (area?.signals?.feverIndicators?.deviation || '').startsWith('+') ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {area?.signals?.feverIndicators?.deviation || '+0%'}
              </span>
            </div>
          </div>

          {/* Clinic Visits */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
                Clinic Visits
              </span>
            </div>
            <div className="mt-2 text-lg font-bold text-white">
              {area?.signals?.clinicVisits?.current ?? 0}{' '}
              <span className="text-xs text-slate-400 font-normal">visits</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Baseline: {area?.signals?.clinicVisits?.baseline ?? 0}</span>
              <span className="text-sky-400 font-bold">{area?.signals?.clinicVisits?.deviation || '+0%'}</span>
            </div>
          </div>

          {/* Geographic Spread */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                Geographic Spread
              </span>
            </div>
            <div className="mt-2 text-lg font-bold text-white">
              {area?.signals?.geographicSpread?.affectedNeighbors ?? 0} / {area?.signals?.geographicSpread?.totalNeighbors ?? 0}
              <span className="text-xs text-slate-400 font-normal"> wards</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Adjacent elevated</span>
              <span className="text-purple-400 font-bold">{area?.signals?.geographicSpread?.deviation || '0%'}</span>
            </div>
          </div>
        </div>

        {/* Risk Explanation Panel & Recommended Action (Requirement 8) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Explanation */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">
              <Microscope className="w-4 h-4" />
              Statistical Anomaly & Surveillance Diagnostics
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {area.explanation}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              <span>Confidence: <strong className="text-white">{area.confidence}%</strong></span>
              <span>•</span>
              <span>Trend: <strong className="text-white">{area.trend}</strong></span>
              <span>•</span>
              <span>Persistence: <strong className="text-white">{area.persistenceWeeks} weeks</strong></span>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                <AlertOctagon className="w-4 h-4" />
                Standard Operating Procedure (SOP)
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {area.recommendedAction}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleDispatchRRT}
                disabled={dispatching}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/40 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dispatching ? 'Dispatching...' : 'Dispatch RRT'}</span>
              </button>
              <button
                onClick={handleGenerateAdvisory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Public Advisory</span>
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Signal Interactive Timeline Chart (Requirement 6 Range Aware) */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              Multi-Signal Progression Timeline ({selectedRange} Days Window)
            </h4>
            <span className="text-[11px] text-slate-400">Medicine vs Fever vs Risk</span>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={area.timeline} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="medicine"
                  name="Medicine Demand"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="fever"
                  name="Fever Cases"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  name="Baseline Demand"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="risk"
                  name="Risk Score"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Observation Signals Table */}
        {area.recentObservations && area.recentObservations.length > 0 && (
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Recent Ingested Signals ({area.name})
              </h4>
              <span className="text-[10px] text-slate-400">Automated Data Pipelines</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Signal Type</th>
                    <th className="pb-2 font-semibold">Value</th>
                    <th className="pb-2 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {area.recentObservations.slice(0, 5).map((obs) => (
                    <tr key={obs.id} className="hover:bg-slate-800/30">
                      <td className="py-2 font-mono text-[11px] text-slate-400">{obs.date}</td>
                      <td className="py-2 capitalize font-medium text-slate-200">
                        {obs.signalType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 font-bold text-brand-400">{obs.value}</td>
                      <td className="py-2 text-slate-400">{obs.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Multilingual Advisory Modal */}
        {advisoryOpen && advisoryText && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-700 animate-in fade-in space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-400 uppercase flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Generated Multilingual Public Health Advisory & Voice Bulletins
              </span>
              <button
                onClick={() => setAdvisoryOpen(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-900 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* English Card */}
              {advisoryText.en && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-blue-400">English (EN):</span>
                    <button
                      onClick={() => playAdvisoryAudio('english', advisoryText.en!)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        playingAdvisoryLang === 'english'
                          ? 'bg-blue-600 text-white ring-1 ring-blue-400 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title={playingAdvisoryLang === 'english' ? "Click to Stop Audio" : "Click to Listen to English Advisory"}
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{playingAdvisoryLang === 'english' ? 'Stop Audio' : 'Listen (EN)'}</span>
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{advisoryText.en}</p>
                </div>
              )}

              {/* Odia Card */}
              {advisoryText.odia && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-amber-400">Odia (ଓଡ଼ିଆ):</span>
                    <button
                      onClick={() => playAdvisoryAudio('odia', advisoryText.odia!)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        playingAdvisoryLang === 'odia'
                          ? 'bg-amber-600 text-white ring-1 ring-amber-400 animate-pulse'
                          : 'bg-slate-800 hover:bg-amber-950/40 text-amber-300 border border-amber-500/20'
                      }`}
                      title={playingAdvisoryLang === 'odia' ? "Click to Stop Audio (ଓଡ଼ିଆ ବନ୍ଦ କରନ୍ତୁ)" : "Click to Listen in Odia (ଓଡ଼ିଆ ଶୁଣନ୍ତୁ)"}
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{playingAdvisoryLang === 'odia' ? 'Stop Audio' : 'Listen (ଓଡ଼ିଆ)'}</span>
                    </button>
                  </div>
                  <p className="text-amber-100 leading-relaxed font-sans">{advisoryText.odia}</p>
                </div>
              )}

              {/* Hindi Card */}
              {advisoryText.hi && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-sky-500/30 text-sky-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sky-400">Hindi (हिन्दी):</span>
                    <button
                      onClick={() => playAdvisoryAudio('hindi', advisoryText.hi!)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        playingAdvisoryLang === 'hindi'
                          ? 'bg-sky-600 text-white ring-1 ring-sky-400 animate-pulse'
                          : 'bg-slate-800 hover:bg-sky-950/40 text-sky-300 border border-sky-500/20'
                      }`}
                      title={playingAdvisoryLang === 'hindi' ? "Click to Stop Audio (हिन्दी बंद करें)" : "Click to Listen in Hindi (हिन्दी सुनें)"}
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{playingAdvisoryLang === 'hindi' ? 'Stop Audio' : 'Listen (हिन्दी)'}</span>
                    </button>
                  </div>
                  <p className="text-sky-100 leading-relaxed">{advisoryText.hi}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Bottom Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-brand-400" />
            <span>← Return to Surveillance Map</span>
          </button>
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            MEDISENTINEL • Integrated Community Disease Early Warning System
          </span>
        </div>
      </div>
    </div>
  );
};

