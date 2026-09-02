import React, { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, Clock3, Info, MapPin, ShieldCheck, ThumbsDown, ThumbsUp, TrendingDown, TrendingUp } from 'lucide-react';
import { api, CivicRating } from '../services/api';
import { useToast } from '../context/ToastContext';

const statusClass = (status: CivicRating['status']) => {
  if (status === 'HIGH') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
  if (status === 'MODERATE') return 'text-amber-300 bg-amber-500/15 border-amber-500/30';
  if (status === 'LOW') return 'text-rose-300 bg-rose-500/15 border-rose-500/30';
  return 'text-slate-300 bg-slate-800 border-slate-700';
};

const scoreLabel = (score: number | null) => score == null ? '—' : `${Math.round(score)}/100`;

export const CivicRatingPanel: React.FC = () => {
  const { showToast } = useToast();
  const [ratings, setRatings] = useState<CivicRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setRatings(await api.getCivicOverview());
    } catch (error) {
      console.warn('Civic rating unavailable:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  const submit = async (rating: CivicRating, response: 'FOLLOWING' | 'NOT_FOLLOWING' | 'NOT_APPLICABLE') => {
    setSending(rating.alert_id);
    try {
      const result = await api.submitCivicFeedback(rating.area_id, rating.alert_id, response);
      showToast('success', 'Civic Signal Recorded', 'Your anonymous response helps estimate area-level compliance.');
      setRatings(prev => prev.map(item => item.alert_id === rating.alert_id ? result.rating : item));
    } catch (error: any) {
      showToast('error', 'Could Not Record Signal', error.message || 'Please try again.');
    } finally {
      setSending(null);
    }
  };

  return (
    <section className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-cyan-950/30 via-slate-900/40 to-emerald-950/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-300"><Activity className="w-5 h-5" /></div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">Civic Compliance Rating</h3>
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold">Live</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-2xl">Area-level estimate of how the public is responding to active advisories. Non-participation is never treated as non-compliance.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Clock3 className="w-3.5 h-3.5" /> Refreshes every 30 seconds
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="text-sm text-slate-400 py-6 text-center">Loading civic signals…</div>
        ) : ratings.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 text-center">
            <Info className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">No active civic-rated advisory yet</p>
            <p className="text-xs text-slate-500 mt-1">When an active alert is available, MediSentinel can collect anonymous feedback and display its area-level compliance.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {ratings.slice(0, 6).map(rating => (
              <div key={`${rating.area_id}-${rating.alert_id}`} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200"><MapPin className="w-3.5 h-3.5 text-cyan-400" /> {rating.area_name}</div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">{rating.alert_title}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${statusClass(rating.status)}`}>{rating.status.replace('_', ' ')}</span>
                </div>

                <div className="flex items-end justify-between mt-4">
                  <div>
                    <div className="text-3xl font-black text-white tracking-tight">{scoreLabel(rating.score)}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Civic compliance estimate</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-bold">
                      {rating.trend === 'IMPROVING' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : rating.trend === 'DECLINING' ? <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> : <Activity className="w-3.5 h-3.5 text-slate-400" />}
                      <span className={rating.trend === 'IMPROVING' ? 'text-emerald-400' : rating.trend === 'DECLINING' ? 'text-rose-400' : 'text-slate-400'}>{rating.trend.replace('_', ' ')}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Confidence {Math.round(rating.confidence)}%</div>
                  </div>
                </div>

                <div className="mt-4 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${rating.score ?? 0}%` }} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {rating.sample_count} available signals</span>
                  <div className="flex gap-1.5">
                    <button disabled={sending === rating.alert_id} onClick={() => submit(rating, 'FOLLOWING')} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Following</button>
                    <button disabled={sending === rating.alert_id} onClick={() => submit(rating, 'NOT_FOLLOWING')} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50 flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Not following</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-500 mt-4 flex items-start gap-1.5"><Info className="w-3 h-3 shrink-0 mt-0.5" /> This is an area-level estimate based on available aggregated signals, not an individual citizen score. External/official signals can be ingested through the authorized signal API.</p>
      </div>
    </section>
  );
};
