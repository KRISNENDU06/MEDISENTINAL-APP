import React from 'react';
import { useRisk } from '../../context/useRisk';
import { DISEASE_ARCHETYPES, INTERVENTIONS } from '../../data/mockRiskData';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Shield,
  Zap,
  Activity,
  Flame,
} from 'lucide-react';

export default function OutbreakSimulatorBar() {
  const {
    stepIndex,
    setStepIndex,
    isPlaying,
    playSimulation,
    pauseSimulation,
    r0,
    setR0,
    archetype,
    setArchetype,
    intervention,
    setIntervention,
    effectiveRt,
    resetSimulation,
    isSimulated,
  } = useRisk();

  const weeks = ['W28 (Baseline)', 'W29', 'W30 (Emergence)', 'W31', 'W32 (Surge)', 'W33 (Peak)'];

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
            <Zap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Interactive Outbreak & Transmission Sandbox
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded border border-rose-500/40">
                SEIR Diffusion Model
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Scrub timeline, calibrate transmission $R_0$, and test municipal containment protocols in real time.
            </p>
          </div>
        </div>

        {/* Effective Rt Indicator & Reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <Activity size={14} className="text-indigo-400" />
            <span className="text-xs text-slate-300">Effective $R_t$:</span>
            <span
              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                effectiveRt > 1.8
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : effectiveRt > 1.0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {effectiveRt} {effectiveRt > 1.0 ? '▲ Epidemic' : '▼ Suppressed'}
            </span>
          </div>

          {isSimulated && (
            <button
              onClick={resetSimulation}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw size={13} /> Reset Baseline
            </button>
          )}
        </div>
      </div>

      {/* Disease Archetype Selection */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
            1. Disease Archetype & Syndrome Signature
          </span>
          <span className="text-[11px] text-indigo-300">
            Leading Drug: {DISEASE_ARCHETYPES[archetype]?.primaryDrugClass}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.values(DISEASE_ARCHETYPES).map((arch) => {
            const isSelected = arch.id === archetype;
            return (
              <button
                key={arch.id}
                onClick={() => setArchetype(arch.id)}
                className={`flex flex-col text-left p-2.5 rounded-xl text-xs transition border cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-xs'
                    : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="truncate">{arch.name.split('(')[0]}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {arch.syndromeLabel} &bull; $R_0={arch.defaultR0}$
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Scrubber & Playback Controls */}
      <div className="space-y-2 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
            2. Temporal Scrubber & Surveillance Epoch
          </span>
          <span className="font-mono text-indigo-400 font-bold">
            Selected: {weeks[stepIndex]}
          </span>
        </div>

        {/* Scrubber slider */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={stepIndex}
            onChange={(e) => setStepIndex(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
            {weeks.map((w, idx) => (
              <button
                key={w}
                onClick={() => setStepIndex(idx)}
                className={`hover:text-indigo-300 cursor-pointer ${
                  stepIndex === idx ? 'text-indigo-400 font-bold' : ''
                }`}
              >
                {w.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Player Action Buttons */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={() => setStepIndex(stepIndex - 1)}
            disabled={stepIndex <= 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 cursor-pointer"
            title="Step Back"
          >
            <SkipBack size={15} />
          </button>

          {!isPlaying ? (
            <button
              onClick={playSimulation}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Play size={14} fill="currentColor" /> Play Epidemic Diffusion
            </button>
          ) : (
            <button
              onClick={pauseSimulation}
              className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Pause size={14} fill="currentColor" /> Pause Timeline
            </button>
          )}

          <button
            onClick={() => setStepIndex(stepIndex + 1)}
            disabled={stepIndex >= 5}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 cursor-pointer"
            title="Step Forward"
          >
            <SkipForward size={15} />
          </button>
        </div>
      </div>

      {/* R0 Calibration & Rapid Municipal Interventions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* R0 Slider */}
        <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Flame size={14} className="text-rose-400" />
              Transmission Rate ($R_0$)
            </span>
            <span className="font-mono text-rose-400 font-bold">{r0}</span>
          </div>
          <input
            type="range"
            min="1.1"
            max="4.5"
            step="0.1"
            value={r0}
            onChange={(e) => setR0(parseFloat(e.target.value))}
            className="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-400">
            Governs secondary cases generated per index infection in naive population.
          </p>
        </div>

        {/* Rapid Intervention Action Buttons */}
        <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Shield size={14} className="text-emerald-400" />
              Apply Municipal Intervention Protocol
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(INTERVENTIONS).map((inter) => {
              const isSelected = inter.id === intervention;
              return (
                <button
                  key={inter.id}
                  onClick={() => setIntervention(inter.id)}
                  className={`text-[11px] p-2 rounded-lg text-left font-medium transition border cursor-pointer truncate ${
                    isSelected
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate">{inter.label.split('&')[0]}</div>
                  <div className="text-[9px] text-slate-400">
                    {inter.transmissionReduction > 0
                      ? `-${Math.round(inter.transmissionReduction * 100)}% transmission`
                      : 'Uncontrolled'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

